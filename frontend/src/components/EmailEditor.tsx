'use client';
import { useState } from 'react';
import { Code2, Monitor, Smartphone, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/primitives';

/**
 * HTML-first editor with device previews. design_json is preserved on the
 * record so a future drag-and-drop builder can take over without a migration.
 */
export function EmailEditor({
  value, onChange, onAiClick,
}: { value: string; onChange: (html: string) => void; onAiClick?: () => void }) {
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [fullscreen, setFullscreen] = useState(false);

  return (
    <div className={cn('rounded-xl border border-border bg-card', fullscreen && 'fixed inset-4 z-50 overflow-hidden shadow-2xl')}>
      <Tabs defaultValue="code">
        <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
          <TabsList>
            <TabsTrigger value="code"><Code2 className="mr-1.5 h-3.5 w-3.5" /> HTML</TabsTrigger>
            <TabsTrigger value="preview"><Monitor className="mr-1.5 h-3.5 w-3.5" /> Preview</TabsTrigger>
          </TabsList>
          <div className="ml-auto flex items-center gap-2">
            {onAiClick && <Button size="sm" variant="outline" onClick={onAiClick}><Sparkles className="h-3.5 w-3.5" /> AI Assistant</Button>}
            <Button size="sm" variant="ghost" onClick={() => setFullscreen(!fullscreen)}>{fullscreen ? 'Exit' : 'Fullscreen'}</Button>
          </div>
        </div>

        <TabsContent value="code" className="mt-0">
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            spellCheck={false}
            placeholder={'<div style="font-family:Arial,sans-serif;padding:24px">\n  <h1>Hello {{first_name | default: "there"}}</h1>\n</div>'}
            className={cn('w-full resize-none bg-transparent p-4 font-mono text-xs leading-relaxed outline-none', fullscreen ? 'h-[calc(100vh-12rem)]' : 'h-[420px]')}
          />
        </TabsContent>

        <TabsContent value="preview" className="mt-0">
          <div className="flex items-center justify-center gap-2 border-b border-border py-2">
            <Button size="sm" variant={device === 'desktop' ? 'secondary' : 'ghost'} onClick={() => setDevice('desktop')}>
              <Monitor className="h-3.5 w-3.5" /> Desktop
            </Button>
            <Button size="sm" variant={device === 'mobile' ? 'secondary' : 'ghost'} onClick={() => setDevice('mobile')}>
              <Smartphone className="h-3.5 w-3.5" /> Mobile
            </Button>
          </div>
          <div className="flex justify-center bg-muted/40 p-6">
            <iframe
              title="Email preview"
              srcDoc={value || '<p style="font-family:sans-serif;color:#888;padding:40px;text-align:center">Nothing to preview yet.</p>'}
              sandbox=""
              className={cn('rounded-lg border border-border bg-white transition-all', device === 'mobile' ? 'h-[560px] w-[380px]' : 'h-[560px] w-full max-w-3xl')}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export const MERGE_TAGS = ['{{first_name}}', '{{last_name}}', '{{email}}', '{{company}}', '{{unsubscribe_url}}'];

export function MergeTagHelp({ onInsert }: { onInsert?: (tag: string) => void }) {
  return (
    <div className="rounded-lg border border-border bg-muted/40 p-3">
      <p className="text-xs font-medium">Personalisation tags</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {MERGE_TAGS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => onInsert?.(t)}
            className="rounded-md bg-card px-2 py-1 font-mono text-[11px] text-muted-foreground ring-1 ring-border transition hover:text-foreground"
          >
            {t}
          </button>
        ))}
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">
        Add a fallback with <code>{'{{first_name | default: "there"}}'}</code>.
      </p>
    </div>
  );
}
