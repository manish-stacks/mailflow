import { createHash } from 'crypto';
import { signToken } from '@/common/tokens';

export interface RenderContext {
  contact: {
    id: string; email: string; firstName?: string; lastName?: string;
    customAttributes?: Record<string, any>;
  };
  workspaceId: string;
  campaignId: string;
  recipientId: string;
}

const escapeHtml = (v: any) =>
  String(v ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/**
 * Merge tags: {{first_name}} and {{first_name | default: "there"}}.
 * Values come from a fixed lookup table — no template code is ever evaluated.
 */
export function renderMergeTags(input: string, contact: RenderContext['contact']): string {
  if (!input) return '';
  const vars: Record<string, any> = {
    email: contact.email,
    first_name: contact.firstName,
    last_name: contact.lastName,
    full_name: [contact.firstName, contact.lastName].filter(Boolean).join(' '),
    ...(contact.customAttributes || {}),
  };

  return input.replace(/\{\{\s*([a-zA-Z0-9_.]+)\s*(?:\|\s*default:\s*["']([^"']*)["']\s*)?\}\}/g,
    (_m, key: string, fallback?: string) => {
      const value = key.split('.').reduce((acc: any, k) => (acc == null ? acc : acc[k]), vars);
      const out = value === undefined || value === null || value === '' ? (fallback ?? '') : value;
      return escapeHtml(out);
    });
}

export const hashUrl = (url: string) => createHash('sha256').update(url).digest('hex');

/** Rewrites http(s) anchors to signed tracking URLs. Anchors, mailto: and unsubscribe links are left alone. */
export function injectClickTracking(
  html: string,
  opts: { secret: string; baseUrl: string; recipientId: string; campaignId: string; linkIds: Map<string, string> },
): string {
  return html.replace(/href\s*=\s*["'](https?:\/\/[^"']+)["']/gi, (match, url: string) => {
    if (url.includes('/tracking/') || url.includes('/unsubscribe/')) return match;
    const linkId = opts.linkIds.get(hashUrl(url));
    if (!linkId) return match;
    const token = signToken({ r: opts.recipientId, c: opts.campaignId, l: linkId }, opts.secret);
    return `href="${opts.baseUrl}/tracking/click/${token}"`;
  });
}

export function injectOpenPixel(html: string, opts: { secret: string; baseUrl: string; recipientId: string; campaignId: string }): string {
  const token = signToken({ r: opts.recipientId, c: opts.campaignId }, opts.secret);
  const pixel = `<img src="${opts.baseUrl}/tracking/open/${token}" width="1" height="1" alt="" style="display:block;border:0;" />`;
  return html.includes('</body>') ? html.replace('</body>', `${pixel}</body>`) : html + pixel;
}

export function unsubscribeUrl(opts: { secret: string; appBaseUrl: string; recipientId: string; workspaceId: string; contactId: string }) {
  const token = signToken({ r: opts.recipientId, w: opts.workspaceId, ct: opts.contactId }, opts.secret);
  return `${opts.appBaseUrl}/unsubscribe/${token}`;
}

/** Appends a compliant footer when the author has not placed {{unsubscribe_url}} themselves. */
export function applyUnsubscribe(html: string, url: string): string {
  if (html.includes('{{unsubscribe_url}}')) return html.split('{{unsubscribe_url}}').join(url);
  const footer = `<div style="text-align:center;font:12px Arial,sans-serif;color:#8a8a8a;padding:24px 16px;">
<a href="${url}" style="color:#8a8a8a;">Unsubscribe</a> from these emails.</div>`;
  return html.includes('</body>') ? html.replace('</body>', `${footer}</body>`) : html + footer;
}

export function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function extractLinks(html: string): string[] {
  const out = new Set<string>();
  const re = /href\s*=\s*["'](https?:\/\/[^"']+)["']/gi;
  let m: RegExpExecArray;
  while ((m = re.exec(html))) {
    if (!m[1].includes('/tracking/') && !m[1].includes('/unsubscribe/')) out.add(m[1]);
  }
  return [...out];
}
