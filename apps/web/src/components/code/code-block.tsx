import * as React from 'react';
import { codeToHtml } from 'shiki';
import { CopyButton } from './copy-button';
import { cn } from '@/lib/utils';

interface CodeBlockProps {
  code: string;
  language: string;
  filename?: string;
  className?: string;
  showCopy?: boolean;
}

/** Highlights code with shiki. Renders on the server, no client JS for highlighting. */
export async function CodeBlock({
  code,
  language,
  filename,
  className,
  showCopy = true,
}: CodeBlockProps): Promise<React.JSX.Element> {
  let html: string;
  try {
    html = await codeToHtml(code, {
      lang: language,
      theme: 'github-dark-default',
    });
  } catch {
    html = `<pre><code>${escapeHtml(code)}</code></pre>`;
  }

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-xl border border-border/60 bg-[#0d1117]',
        className,
      )}
    >
      {filename || showCopy ? (
        <div className="flex items-center justify-between border-b border-border/40 px-4 py-2">
          <span className="font-mono text-xs text-muted-foreground">{filename ?? language}</span>
          {showCopy ? <CopyButton value={code} label="" /> : null}
        </div>
      ) : null}
      <div
        className="overflow-x-auto p-4 text-sm [&>pre]:!m-0 [&>pre]:!bg-transparent [&>pre]:p-0"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
