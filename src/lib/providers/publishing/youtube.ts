import { google } from 'googleapis';
import { getSupabaseServiceClient } from '@/lib/database/client';

export interface YouTubeChannelInfo {
  id: string;
  title: string;
  handle: string;
  thumbnailUrl?: string;
  tokenStatus: 'valid' | 'expires_soon' | 'reconnect_needed' | 'revoked';
  dailyQuotaUsed: number;
}

export interface UploadMetadata {
  title: string;
  description: string;
  tags?: string[];
  privacyStatus: 'private' | 'unlisted' | 'public';
  scheduledPublishTime?: string;
}

export interface ResumableUploadState {
  uploadId: string;
  resumableSessionUri: string;
  bytesUploaded: number;
  totalBytes: number;
  percent: number;
  status: 'uploading' | 'interrupted' | 'completed' | 'failed';
}

const UPLOAD_QUOTA_COST = 1600;
const DEFAULT_DAILY_QUOTA = 10000;

export class YouTubePublisher {
  private getOAuthClient() {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/youtube/callback';

    if (!clientId || !clientSecret) {
      throw new Error('[YouTube Error] GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is missing. Please configure credentials in Settings.');
    }

    return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  }

  /**
   * Generates the Google OAuth authorization URL.
   */
  getAuthorizationUrl(state: string): string {
    const oauth2Client = this.getOAuthClient();
    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: [
        'https://www.googleapis.com/auth/youtube.upload',
        'https://www.googleapis.com/auth/youtube.readonly',
      ],
      state,
    });
  }

  /**
   * Exchanges authorization code for tokens.
   */
  async exchangeCodeForTokens(code: string) {
    const oauth2Client = this.getOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);
    return tokens;
  }

  /**
   * Resumes an interrupted upload using the saved resumable session URI.
   */
  async resumeInterruptedUpload(
    resumableSessionUri: string,
    fileBuffer: Buffer
  ): Promise<{ status: 'completed' | 'uploading'; bytesUploaded: number; videoId?: string }> {
    const totalBytes = fileBuffer.length;

    // 1. Query the current upload offset from YouTube
    const statusCheck = await fetch(resumableSessionUri, {
      method: 'PUT',
      headers: {
        'Content-Range': `bytes */${totalBytes}`,
      },
    });

    if (statusCheck.status === 308) {
      // 308 Resume Incomplete: parse Range header
      const range = statusCheck.headers.get('range');
      let offset = 0;
      if (range) {
        const match = range.match(/bytes=0-(\d+)/);
        if (match) {
          offset = parseInt(match[1], 10) + 1;
        }
      }

      // 2. Upload remaining chunk
      const chunk = fileBuffer.subarray(offset);
      const uploadResp = await fetch(resumableSessionUri, {
        method: 'PUT',
        headers: {
          'Content-Length': String(chunk.length),
          'Content-Range': `bytes ${offset}-${totalBytes - 1}/${totalBytes}`,
          'Content-Type': 'video/mp4',
        },
        body: new Uint8Array(chunk),
      });

      if (uploadResp.ok) {
        const data = await uploadResp.json();
        return {
          status: 'completed',
          bytesUploaded: totalBytes,
          videoId: data.id,
        };
      }

      return {
        status: 'uploading',
        bytesUploaded: offset,
      };
    } else if (statusCheck.ok) {
      const data = await statusCheck.json();
      return {
        status: 'completed',
        bytesUploaded: totalBytes,
        videoId: data.id,
      };
    }

    throw new Error(`[YouTube Error] Failed to query upload status: HTTP ${statusCheck.status}`);
  }

  /**
   * Updates quota usage and logs quota consumption.
   */
  async trackQuotaUsage(channelId: string, units = UPLOAD_QUOTA_COST): Promise<number> {
    const supabase = getSupabaseServiceClient();
    const { data: channel } = await supabase
      .from('youtube_channels')
      .select('daily_quota_used')
      .eq('id', channelId)
      .single();

    const currentUsed = (channel?.daily_quota_used || 0) + units;
    if (currentUsed >= DEFAULT_DAILY_QUOTA) {
      console.warn(`[YouTube Quota] Channel ${channelId} has reached daily quota limit (${currentUsed}/${DEFAULT_DAILY_QUOTA}).`);
    }
    await supabase
      .from('youtube_channels')
      .update({ daily_quota_used: currentUsed, updated_at: new Date().toISOString() })
      .eq('id', channelId);

    return currentUsed;
  }
}

export const youtubePublisher = new YouTubePublisher();
