'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Copy, GripVertical, Heading1, Image as ImageIcon, Loader2, Mail, Minus, MousePointerClick, MoveVertical, Trash2, Type } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/feedback';

/**
 * Drag-and-drop block builder. The block list is stored inside the HTML itself as a
 * <!--mf-blocks:BASE64--> comment, so no API or database change is needed: the saved HTML is
 * exactly what gets sent, and re-opening the Builder tab restores the editable blocks.
 */
type BlockType = 'heading' | 'text' | 'image' | 'button' | 'divider' | 'spacer' | 'footer';
interface Block {
  id: string; type: BlockType; text?: string; url?: string; src?: string; alt?: string;
  align?: 'left' | 'center' | 'right'; size?: number; color?: string; bg?: string;
}
interface Settings { accent: string; pageBg: string }

const PALETTE: { type: BlockType; label: string; icon: any }[] = [
  { type: 'heading', label: 'Heading', icon: Heading1 },
  { type: 'text', label: 'Text', icon: Type },
  { type: 'image', label: 'Image', icon: ImageIcon },
  { type: 'button', label: 'Button', icon: MousePointerClick },
  { type: 'divider', label: 'Divider', icon: Minus },
  { type: 'spacer', label: 'Spacer', icon: MoveVertical },
  { type: 'footer', label: 'Footer', icon: Mail },
];

const uid = () => Math.random().toString(36).slice(2, 10);
const MARK = /<!--mf-blocks:([A-Za-z0-9+/=]+)-->/;
const esc = (s = '') => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const attr = (s = '') => s.replace(/"/g, '&quot;');
const rich = (s = '') => esc(s).replace(/\n/g, '<br>');

function defaults(type: BlockType, s: Settings): Block {
  const id = uid();
  switch (type) {
    case 'heading': return { id, type, text: 'Your heading here', align: 'left', size: 26, color: '#111827' };
    case 'text': return { id, type, text: 'Hi {{first_name | default: "there"}},\n\nWrite your message here.', align: 'left', size: 15, color: '#374151' };
    case 'image': return { id, type, src: '', alt: '', url: '', align: 'center' };
    case 'button': return { id, type, text: 'Click here', url: 'https://example.com', align: 'left', bg: s.accent, color: '#ffffff' };
    case 'divider': return { id, type };
    case 'spacer': return { id, type, size: 24 };
    case 'footer': return { id, type, text: 'You are receiving this email because you subscribed to updates from us.' };
  }
}

function blockHtml(b: Block): string {
  const al = b.align || 'left';
  switch (b.type) {
    case 'heading': return `<h1 style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:${b.size || 26}px;line-height:1.3;color:${b.color || '#111827'};text-align:${al}">${rich(b.text)}</h1>`;
    case 'text': return `<p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:${b.size || 15}px;line-height:1.65;color:${b.color || '#374151'};text-align:${al}">${rich(b.text)}</p>`;
    case 'image': {
      if (!b.src) return '';
      const img = `<img src="${attr(b.src)}" alt="${attr(b.alt)}" width="536" style="display:inline-block;max-width:100%;height:auto;border:0" />`;
      return `<div style="text-align:${al}">${b.url ? `<a href="${attr(b.url)}">${img}</a>` : img}</div>`;
    }
    case 'button': return `<table role="presentation" cellpadding="0" cellspacing="0" align="${al}" style="margin:0 ${al === 'center' ? 'auto' : '0'}"><tr><td style="background:${b.bg || '#4f46e5'};border-radius:6px"><a href="${attr(b.url)}" style="display:inline-block;padding:13px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:${b.color || '#ffffff'};text-decoration:none">${esc(b.text)}</a></td></tr></table>`;
    case 'divider': return `<hr style="border:none;border-top:1px solid #e5e7eb;margin:0" />`;
    case 'spacer': return `<div style="height:${b.size || 24}px;line-height:${b.size || 24}px;font-size:1px">&nbsp;</div>`;
    case 'footer': return `<p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:#9ca3af;text-align:center">${rich(b.text)}<br /><a href="{{unsubscribe_url}}" style="color:#9ca3af">Unsubscribe</a></p>`;
  }
}

function toHtml(blocks: Block[], s: Settings): string {
  const json = JSON.stringify({ blocks, s });
  const b64 = typeof window !== 'undefined' ? btoa(unescape(encodeURIComponent(json))) : '';
  const rows = blocks.map((b) => blockHtml(b)).filter(Boolean)
    .map((h) => `<tr><td style="padding:8px 32px">${h}</td></tr>`).join('\n');
  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${s.pageBg}"><!--mf-blocks:${b64}-->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${s.pageBg};padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:8px;padding:16px 0">
${rows}
</table></td></tr></table></body></html>`;
}

function parse(html: string): { blocks: Block[]; s: Settings } | null {
  const m = html.match(MARK);
  if (!m) return null;
  try { return JSON.parse(decodeURIComponent(escape(atob(m[1])))); } catch { return null; }
}

const START = (s: Settings): Block[] => [defaults('heading', s), defaults('text', s), defaults('button', s), defaults('spacer', s), defaults('footer', s)];

export function BlockBuilder({ value, onChange }: { value: string; onChange: (html: string) => void }) {
  const parsed = useRef(parse(value)).current;
  const hasForeignHtml = !!value.trim() && !parsed;
  const [settings, setSettings] = useState<Settings>(parsed?.s ?? { accent: '#4f46e5', pageBg: '#f4f5f7' });
  const [blocks, setBlocks] = useState<Block[]>(parsed?.blocks ?? (hasForeignHtml ? [] : START({ accent: '#4f46e5', pageBg: '#f4f5f7' })));
  const [locked, setLocked] = useState(hasForeignHtml);
  const [sel, setSel] = useState<string | null>(null);
  const [dropAt, setDropAt] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const commit = (nb: Block[], ns = settings) => { setBlocks(nb); onChange(toHtml(nb, ns)); };
  useEffect(() => { if (!parsed && !hasForeignHtml) onChange(toHtml(blocks, settings)); /* emit starter once */ // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const insert = (b: Block, at = blocks.length) => { const nb = [...blocks]; nb.splice(at, 0, b); commit(nb); setSel(b.id); };
  const patch = (id: string, p: Partial<Block>) => commit(blocks.map((b) => (b.id === id ? { ...b, ...p } : b)));
  const move = (id: string, to: number) => {
    const from = blocks.findIndex((b) => b.id === id); if (from < 0) return;
    const nb = [...blocks]; const [item] = nb.splice(from, 1);
    nb.splice(Math.max(0, Math.min(nb.length, to > from ? to - 1 : to)), 0, item); commit(nb);
  };
  const step = (id: string, d: number) => { const i = blocks.findIndex((b) => b.id === id); move(id, d > 0 ? i + 2 : i - 1); };
  const remove = (id: string) => { commit(blocks.filter((b) => b.id !== id)); setSel(null); };
  const dup = (id: string) => { const i = blocks.findIndex((b) => b.id === id); insert({ ...blocks[i], id: uid() }, i + 1); };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const at = dropAt ?? blocks.length; setDropAt(null);
    const t = e.dataTransfer.getData('mf/new') as BlockType; const mv = e.dataTransfer.getData('mf/move');
    if (t) insert(defaults(t, settings), at); else if (mv) move(mv, at);
  };

  async function upload(file: File, id: string) {
    setUploading(true);
    try {
      const form = new FormData(); form.append('file', file);
      const r = await api.upload<{ url: string }>('/files/upload?purpose=email-image', form);
      patch(id, { src: r.url });
    } catch (e: any) { toast.error('Image upload failed', e.message); } finally { setUploading(false); }
  }

  if (locked) {
    return (
      <div className="space-y-3 p-8 text-center">
        <p className="font-medium">This email was written as raw HTML</p>
        <p className="text-sm text-muted-foreground">Starting the builder replaces the current content. Your HTML stays untouched unless you continue.</p>
        <Button onClick={() => { setLocked(false); const nb = START(settings); setBlocks(nb); onChange(toHtml(nb, settings)); }}>Start fresh in the builder</Button>
      </div>
    );
  }

  const selected = blocks.find((b) => b.id === sel);
  const label = 'mb-1 block text-xs font-medium text-muted-foreground';

  return (
    <div className="grid gap-0 md:grid-cols-[150px_1fr_240px]">
      {/* palette */}
      <div className="space-y-1.5 border-b border-border p-3 md:border-b-0 md:border-r">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Blocks</p>
        {PALETTE.map(({ type, label: l, icon: Icon }) => (
          <button key={type} type="button" draggable onDragStart={(e) => e.dataTransfer.setData('mf/new', type)}
            onClick={() => insert(defaults(type, settings))}
            className="flex w-full cursor-grab items-center gap-2 rounded-lg border border-border bg-card px-2.5 py-2 text-sm hover:bg-muted/50 active:cursor-grabbing">
            <Icon className="h-4 w-4 text-muted-foreground" /> {l}
          </button>
        ))}
        <p className="pt-2 text-[11px] text-muted-foreground">Drag onto the canvas, or click to add.</p>
      </div>

      {/* canvas */}
      <div className="max-h-[560px] overflow-y-auto bg-muted/40 p-4" onDragOver={(e) => { e.preventDefault(); if (!blocks.length) setDropAt(0); }} onDrop={onDrop} onDragLeave={() => setDropAt(null)}>
        <div className="mx-auto max-w-[600px] rounded-lg bg-white py-3 shadow-sm" style={{ color: '#111' }}>
          {!blocks.length && <p className="p-10 text-center text-sm text-gray-400">Drop a block here</p>}
          {blocks.map((b, i) => (
            <div key={b.id}>
              {dropAt === i && <div className="mx-8 h-1 rounded bg-primary" />}
              <div draggable onDragStart={(e) => e.dataTransfer.setData('mf/move', b.id)}
                onDragOver={(e) => { e.preventDefault(); const r = e.currentTarget.getBoundingClientRect(); setDropAt(e.clientY < r.top + r.height / 2 ? i : i + 1); }}
                onClick={() => setSel(b.id)}
                className={cn('group relative mx-2 cursor-pointer rounded-md border-2 px-6 py-2', sel === b.id ? 'border-primary' : 'border-transparent hover:border-primary/30')}>
                <div className="pointer-events-none" dangerouslySetInnerHTML={{ __html: b.type === 'image' && !b.src ? '<div style="padding:28px;text-align:center;color:#9ca3af;border:1px dashed #d1d5db;border-radius:6px;font:13px Arial">Image — choose a file or paste a URL</div>' : blockHtml(b).replace(/\{\{[^}]*\}\}/g, (t) => `<span style="background:#eef2ff;color:#4338ca;border-radius:3px">${esc(t)}</span>`) }} />
                {sel === b.id && (
                  <div className="absolute -top-3 right-2 flex items-center gap-0.5 rounded-md border border-border bg-card p-0.5 shadow">
                    <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
                    <button type="button" title="Move up" onClick={(e) => { e.stopPropagation(); step(b.id, -1); }} className="rounded p-1 hover:bg-muted"><ArrowUp className="h-3.5 w-3.5" /></button>
                    <button type="button" title="Move down" onClick={(e) => { e.stopPropagation(); step(b.id, 1); }} className="rounded p-1 hover:bg-muted"><ArrowDown className="h-3.5 w-3.5" /></button>
                    <button type="button" title="Duplicate" onClick={(e) => { e.stopPropagation(); dup(b.id); }} className="rounded p-1 hover:bg-muted"><Copy className="h-3.5 w-3.5" /></button>
                    <button type="button" title="Delete" onClick={(e) => { e.stopPropagation(); remove(b.id); }} className="rounded p-1 text-destructive hover:bg-muted"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {dropAt === blocks.length && blocks.length > 0 && <div className="mx-8 h-1 rounded bg-primary" />}
        </div>
      </div>

      {/* properties */}
      <div className="space-y-3 border-t border-border p-3 md:border-l md:border-t-0">
        {!selected ? (
          <>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Email style</p>
            <div><span className={label}>Accent (buttons)</span><input type="color" value={settings.accent} onChange={(e) => { const ns = { ...settings, accent: e.target.value }; setSettings(ns); commit(blocks.map((b) => (b.type === 'button' && b.bg === settings.accent ? { ...b, bg: ns.accent } : b)), ns); }} className="h-8 w-full cursor-pointer rounded border border-border" /></div>
            <div><span className={label}>Background</span><input type="color" value={settings.pageBg} onChange={(e) => { const ns = { ...settings, pageBg: e.target.value }; setSettings(ns); commit(blocks, ns); }} className="h-8 w-full cursor-pointer rounded border border-border" /></div>
            <p className="text-[11px] text-muted-foreground">Select a block to edit it. Use <code>{'{{first_name}}'}</code> to personalise.</p>
          </>
        ) : (
          <>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{selected.type}</p>
            {['heading', 'text', 'button', 'footer'].includes(selected.type) && (
              <div><span className={label}>{selected.type === 'button' ? 'Label' : 'Text'}</span>
                {selected.type === 'button'
                  ? <Input value={selected.text || ''} onChange={(e) => patch(selected.id, { text: e.target.value })} />
                  : <textarea value={selected.text || ''} rows={selected.type === 'text' ? 6 : 3} onChange={(e) => patch(selected.id, { text: e.target.value })} className="w-full rounded-md border border-border bg-transparent p-2 text-sm outline-none focus:ring-1 focus:ring-primary" />}
              </div>
            )}
            {['button', 'image'].includes(selected.type) && (
              <div><span className={label}>{selected.type === 'image' ? 'Link (optional)' : 'Link URL'}</span><Input value={selected.url || ''} onChange={(e) => patch(selected.id, { url: e.target.value })} placeholder="https://" /></div>
            )}
            {selected.type === 'image' && (
              <>
                <div><span className={label}>Image URL</span><Input value={selected.src || ''} onChange={(e) => patch(selected.id, { src: e.target.value })} placeholder="https://…" /></div>
                <input ref={fileRef} type="file" hidden accept="image/png,image/jpeg,image/gif,image/webp" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0], selected.id)} />
                <Button size="sm" variant="outline" className="w-full" disabled={uploading} onClick={() => fileRef.current?.click()}>{uploading && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Upload image</Button>
                <div><span className={label}>Alt text</span><Input value={selected.alt || ''} onChange={(e) => patch(selected.id, { alt: e.target.value })} /></div>
              </>
            )}
            {['heading', 'text', 'button', 'image'].includes(selected.type) && (
              <div><span className={label}>Align</span>
                <div className="flex gap-1">{(['left', 'center', 'right'] as const).map((a) => (
                  <Button key={a} size="sm" variant={(selected.align || 'left') === a ? 'secondary' : 'ghost'} className="flex-1 capitalize" onClick={() => patch(selected.id, { align: a })}>{a}</Button>
                ))}</div>
              </div>
            )}
            {['heading', 'text', 'spacer'].includes(selected.type) && (
              <div><span className={label}>{selected.type === 'spacer' ? 'Height (px)' : 'Font size (px)'}</span><Input type="number" min={8} max={80} value={selected.size ?? ''} onChange={(e) => patch(selected.id, { size: Math.max(8, Math.min(80, +e.target.value || 8)) })} /></div>
            )}
            {['heading', 'text'].includes(selected.type) && (
              <div><span className={label}>Text colour</span><input type="color" value={selected.color || '#111827'} onChange={(e) => patch(selected.id, { color: e.target.value })} className="h-8 w-full cursor-pointer rounded border border-border" /></div>
            )}
            {selected.type === 'button' && (
              <div><span className={label}>Button colour</span><input type="color" value={selected.bg || settings.accent} onChange={(e) => patch(selected.id, { bg: e.target.value })} className="h-8 w-full cursor-pointer rounded border border-border" /></div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
