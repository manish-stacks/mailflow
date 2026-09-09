'use client';
import { useRef, useState } from 'react';
import { Code2, ImagePlus, LayoutTemplate, Loader2, Monitor, Smartphone, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { toast } from '@/components/ui/feedback';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/primitives';

/**
 * HTML-first editor with device previews. design_json is preserved on the
 * record so a future drag-and-drop builder can take over without a migration.
 */
const BLOCKS: Record<string, string> = {
  Heading: `<h1 style="margin:0 0 16px;font-family:Arial,sans-serif;font-size:24px;color:#111">Your heading here</h1>`,
  Paragraph: `<p style="margin:0 0 16px;font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#333">Write your message here. Hi {{first_name | default: "there"}}, ...</p>`,
  Button: `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 16px"><tr><td style="border-radius:6px;background:#4f46e5"><a href="https://example.com" style="display:inline-block;padding:12px 24px;font-family:Arial,sans-serif;font-size:14px;color:#fff;text-decoration:none;border-radius:6px">Click here</a></td></tr></table>`,
  Divider: `<hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0" />`,
};

export function EmailEditor({
  value, onChange, onAiClick,
}: { value: string; onChange: (html: string) => void; onAiClick?: () => void }) {
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [fullscreen, setFullscreen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  /** Inserts a snippet at the current cursor position (or appends it). */
  function insertAtCursor(snippet: string) {
    const el = textareaRef.current;
    if (!el) { onChange(value + snippet); return; }
    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    const next = value.slice(0, start) + snippet + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => { el.focus(); el.selectionStart = el.selectionEnd = start + snippet.length; });
  }

  async function handleImageFile(file: File) {
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const uploaded = await api.upload<{ url: string }>('/files/upload?purpose=email-image', form);
      insertAtCursor(`<img src="${uploaded.url}" alt="" width="600" style="max-width:100%;display:block" />`);
    } catch (e: any) {
      toast.error('Image upload failed', e.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className={cn('rounded-xl border border-border bg-card', fullscreen && 'fixed inset-4 z-50 overflow-hidden shadow-2xl')}>
      <Tabs defaultValue="code">
        <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
          <TabsList>
            <TabsTrigger value="code"><Code2 className="mr-1.5 h-3.5 w-3.5" /> HTML</TabsTrigger>
            <TabsTrigger value="preview"><Monitor className="mr-1.5 h-3.5 w-3.5" /> Preview</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-1.5">
            <Button size="sm" variant="outline" disabled={uploading} onClick={() => fileInput.current?.click()}>
              {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />} Image
            </Button>
            <input
              ref={fileInput}
              type="file"
              accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
              hidden
              onChange={(e) => e.target.files?.[0] && handleImageFile(e.target.files[0])}
            />
            {Object.keys(BLOCKS).map((label) => (
              <Button key={label} size="sm" variant="ghost" onClick={() => insertAtCursor(BLOCKS[label])}>
                <LayoutTemplate className="mr-1 h-3.5 w-3.5" /> {label}
              </Button>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-2">
            {onAiClick && <Button size="sm" variant="outline" onClick={onAiClick}><Sparkles className="h-3.5 w-3.5" /> AI Assistant</Button>}
            <Button size="sm" variant="ghost" onClick={() => setFullscreen(!fullscreen)}>{fullscreen ? 'Exit' : 'Fullscreen'}</Button>
          </div>
        </div>

        <TabsContent value="code" className="mt-0">
          <textarea
            ref={textareaRef}
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