"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildRewritePrompt = exports.REWRITE_ACTIONS = exports.buildSubjectPrompt = exports.buildEmailPrompt = exports.SYSTEM_EDITOR = exports.SYSTEM_EMAIL_WRITER = void 0;
exports.SYSTEM_EMAIL_WRITER = `You are an expert email marketing copywriter.
You write conversion-focused marketing emails that are clear, scannable and free of spam-trigger language.
Rules:
- Return ONLY valid JSON. No markdown fences, no commentary.
- The body must be responsive, inline-styled, table-free-where-possible HTML suitable for email clients.
- Use the merge tag {{first_name | default: "there"}} for personalisation.
- Never invent facts, prices, or claims that were not provided.`;
exports.SYSTEM_EDITOR = `You are an expert email copy editor. Return ONLY valid JSON with no markdown fences.`;
const buildEmailPrompt = (i) => `Write one marketing email.

Product/Service: ${i.product}
Target audience: ${i.audience}
Goal: ${i.goal}
Tone: ${i.tone}
Brand: ${i.brandName || 'the sender'}
Key points: ${i.keyPoints || '(none supplied)'}
Offer: ${i.offer || '(none)'}
Call to action: ${i.cta || 'Learn more'}

Return JSON exactly in this shape:
{"subject":"...","previewText":"...","body":"<html email body>","ctaText":"..."}`;
exports.buildEmailPrompt = buildEmailPrompt;
const buildSubjectPrompt = (topic, tone, count = 5) => `Write ${count} email subject lines about: ${topic}. Tone: ${tone}. Each under 60 characters, no emoji spam.
Return JSON: {"subjects":["...","..."],"previewTexts":["...","..."]}`;
exports.buildSubjectPrompt = buildSubjectPrompt;
exports.REWRITE_ACTIONS = {
    shorter: 'Rewrite the content to be significantly shorter while keeping every key point.',
    professional: 'Rewrite the content in a more professional, business-appropriate voice.',
    friendly: 'Rewrite the content in a warmer, more conversational and friendly voice.',
    grammar: 'Fix grammar, spelling and punctuation. Keep the meaning and the HTML structure intact.',
    persuasive: 'Rewrite the content to be more persuasive, with a stronger benefit-led hook.',
    cta: 'Generate 5 alternative call-to-action button labels for this content.',
};
const buildRewritePrompt = (action, content) => `${exports.REWRITE_ACTIONS[action]}

CONTENT:
${content}

Return JSON: ${action === 'cta' ? '{"ctas":["...","..."]}' : '{"content":"..."}'}`;
exports.buildRewritePrompt = buildRewritePrompt;
