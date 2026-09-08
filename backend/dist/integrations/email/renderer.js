"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashUrl = void 0;
exports.renderMergeTags = renderMergeTags;
exports.injectClickTracking = injectClickTracking;
exports.injectOpenPixel = injectOpenPixel;
exports.unsubscribeUrl = unsubscribeUrl;
exports.applyUnsubscribe = applyUnsubscribe;
exports.htmlToText = htmlToText;
exports.extractLinks = extractLinks;
const crypto_1 = require("crypto");
const tokens_1 = require("../../common/tokens");
const escapeHtml = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
/**
 * Merge tags: {{first_name}} and {{first_name | default: "there"}}.
 * Values come from a fixed lookup table — no template code is ever evaluated.
 */
function renderMergeTags(input, contact) {
    if (!input)
        return '';
    const vars = {
        email: contact.email,
        first_name: contact.firstName,
        last_name: contact.lastName,
        full_name: [contact.firstName, contact.lastName].filter(Boolean).join(' '),
        ...(contact.customAttributes || {}),
    };
    return input.replace(/\{\{\s*([a-zA-Z0-9_.]+)\s*(?:\|\s*default:\s*["']([^"']*)["']\s*)?\}\}/g, (_m, key, fallback) => {
        const value = key.split('.').reduce((acc, k) => (acc == null ? acc : acc[k]), vars);
        const out = value === undefined || value === null || value === '' ? (fallback ?? '') : value;
        return escapeHtml(out);
    });
}
const hashUrl = (url) => (0, crypto_1.createHash)('sha256').update(url).digest('hex');
exports.hashUrl = hashUrl;
/** Rewrites http(s) anchors to signed tracking URLs. Anchors, mailto: and unsubscribe links are left alone. */
function injectClickTracking(html, opts) {
    return html.replace(/href\s*=\s*["'](https?:\/\/[^"']+)["']/gi, (match, url) => {
        if (url.includes('/tracking/') || url.includes('/unsubscribe/'))
            return match;
        const linkId = opts.linkIds.get((0, exports.hashUrl)(url));
        if (!linkId)
            return match;
        const token = (0, tokens_1.signToken)({ r: opts.recipientId, c: opts.campaignId, l: linkId }, opts.secret);
        return `href="${opts.baseUrl}/tracking/click/${token}"`;
    });
}
function injectOpenPixel(html, opts) {
    const token = (0, tokens_1.signToken)({ r: opts.recipientId, c: opts.campaignId }, opts.secret);
    const pixel = `<img src="${opts.baseUrl}/tracking/open/${token}" width="1" height="1" alt="" style="display:block;border:0;" />`;
    return html.includes('</body>') ? html.replace('</body>', `${pixel}</body>`) : html + pixel;
}
function unsubscribeUrl(opts) {
    const token = (0, tokens_1.signToken)({ r: opts.recipientId, w: opts.workspaceId, ct: opts.contactId }, opts.secret);
    return `${opts.appBaseUrl}/unsubscribe/${token}`;
}
/** Appends a compliant footer when the author has not placed {{unsubscribe_url}} themselves. */
function applyUnsubscribe(html, url) {
    if (html.includes('{{unsubscribe_url}}'))
        return html.split('{{unsubscribe_url}}').join(url);
    const footer = `<div style="text-align:center;font:12px Arial,sans-serif;color:#8a8a8a;padding:24px 16px;">
<a href="${url}" style="color:#8a8a8a;">Unsubscribe</a> from these emails.</div>`;
    return html.includes('</body>') ? html.replace('</body>', `${footer}</body>`) : html + footer;
}
function htmlToText(html) {
    return html
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n\n')
        .replace(/<[^>]+>/g, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}
function extractLinks(html) {
    const out = new Set();
    const re = /href\s*=\s*["'](https?:\/\/[^"']+)["']/gi;
    let m;
    while ((m = re.exec(html))) {
        if (!m[1].includes('/tracking/') && !m[1].includes('/unsubscribe/'))
            out.add(m[1]);
    }
    return [...out];
}
