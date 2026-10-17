import React from 'react';

export type StatusVariant =
  | 'green'
  | 'red'
  | 'amber'
  | 'blue'
  | 'gray'
  | 'gold'
  | 'outline';

interface StatusPillProps {
  label: string;
  variant?: StatusVariant;
  className?: string;
  dot?: boolean;
}

export function StatusPill({ label, variant, className = '', dot = false }: StatusPillProps) {
  // Infer variant from label if not explicitly provided
  let computedVariant: StatusVariant = variant || 'gray';

  if (!variant) {
    const l = label.toLowerCase();
    if (['connected', 'healthy', 'done', 'rendered', 'capable', 'yes', 'valid', 'current', 'completed'].includes(l)) {
      computedVariant = 'green';
    } else if (['failed', '12s over limit', 'missing', 'unavailable', 'not implemented', 'revoked'].includes(l)) {
      computedVariant = 'red';
    } else if (['waiting_for_provider', 'assembling', 'rendering', 'running', 'uploading'].includes(l)) {
      computedVariant = 'blue';
    } else if (['awaiting_review', 'awaiting you', 'needs prompt', 'queued', 'draft', 'expires soon', 'reconnect needed', 'estimated'].includes(l)) {
      computedVariant = 'amber';
    } else if (['provider-reported', 'completed · mock', 'off in production'].includes(l)) {
      computedVariant = l.includes('mock') ? 'gold' : 'green';
    }
  }

  const styles = {
    green: 'bg-[#0E2A1E] text-[#34D399] border-[#1B4D36]',
    red: 'bg-[#2A1215] text-[#F87171] border-[#4D1B22]',
    amber: 'bg-[#2D220E] text-[#FBBF24] border-[#4D3A1B]',
    blue: 'bg-[#0F2236] text-[#60A5FA] border-[#1E3A5F]',
    gold: 'bg-[#2D220E] text-[#E5A93C] border-[#4D3A1B]',
    gray: 'bg-[#181B20] text-[#9CA3AF] border-[#2A2F3A]',
    outline: 'bg-transparent text-[#9CA3AF] border-[#2A2F3A]',
  }[computedVariant];

  const dotColors = {
    green: 'bg-[#34D399]',
    red: 'bg-[#F87171]',
    amber: 'bg-[#FBBF24]',
    blue: 'bg-[#60A5FA]',
    gold: 'bg-[#E5A93C]',
    gray: 'bg-[#9CA3AF]',
    outline: 'bg-[#9CA3AF]',
  }[computedVariant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono border tracking-wide select-none ${styles} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors}`} />}
      {label}
    </span>
  );
}
