import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';

export const EpisodeScriptSchema = z.object({
  title: z.string(),
  logline: z.string(),
  scenes: z.array(
    z.object({
      sequenceNumber: z.number(),
      title: z.string(),
      narration: z.string(),
      visualPrompt: z.string(),
      suggestedDurationSec: z.number().min(3).max(8),
    })
  ),
});

export type EpisodeScript = z.infer<typeof EpisodeScriptSchema>;

export const ScriptRevisionSchema = z.object({
  originalSnippet: z.string(),
  revisedSnippet: z.string(),
  rationale: z.string(),
});

export type ScriptRevision = z.infer<typeof ScriptRevisionSchema>;

export class GeminiDirector {
  private apiKey?: string;
  private modelName: string;

  constructor(apiKey?: string, modelName = process.env.GEMINI_MODEL || 'gemini-2.5-pro') {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY;
    this.modelName = modelName;
  }

  private getClient(): GoogleGenAI {
    const key = this.apiKey || process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('[Gemini Error] Gemini API key is missing. Please configure it in Settings -> Integrations.');
    }
    return new GoogleGenAI({ apiKey: key });
  }

  /**
   * Generates structured episode scenes and narration.
   */
  async planEpisode(projectContext: {
    projectName: string;
    description: string;
    category: string;
    targetDurationMinutes: number;
    episodeNumber: number;
    episodeIdea: string;
  }): Promise<EpisodeScript> {
    const ai = this.getClient();

    const prompt = `You are the lead visual director and head writer for the documentary series "${projectContext.projectName}" (${projectContext.category}).
Description: ${projectContext.description}
Plan Episode ${projectContext.episodeNumber}: "${projectContext.episodeIdea}".
Target runtime: ~${projectContext.targetDurationMinutes} minutes.

Produce a structured series of scenes. Each scene must have:
1. sequenceNumber
2. title
3. narration (compelling, evocative voiceover)
4. visualPrompt (photorealistic cinematic description: camera angle, lighting, 35mm film grain, colors)
5. suggestedDurationSec (between 5 and 8 seconds to stay within provider rendering limits).

Return ONLY valid JSON matching this schema:
{
  "title": string,
  "logline": string,
  "scenes": [
    {
      "sequenceNumber": number,
      "title": string,
      "narration": string,
      "visualPrompt": string,
      "suggestedDurationSec": number
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: this.modelName,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    const parsed = JSON.parse(text);
    return EpisodeScriptSchema.parse(parsed);
  }

  /**
   * Generates an editorial revision with an accept/reject diff.
   */
  async reviseScript(
    currentScript: string,
    revisionInstruction: string
  ): Promise<ScriptRevision> {
    const ai = this.getClient();

    const prompt = `You are a script editor. The user wants to revise a script.
Current script:
"${currentScript}"

User revision instruction:
"${revisionInstruction}"

Return a JSON object containing:
- originalSnippet: the exact phrase from the script to replace
- revisedSnippet: the new editorial text
- rationale: why this change satisfies the director's request.

Output ONLY valid JSON.`;

    const response = await ai.models.generateContent({
      model: this.modelName,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    const parsed = JSON.parse(text);
    return ScriptRevisionSchema.parse(parsed);
  }
}
