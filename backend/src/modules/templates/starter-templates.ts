/** Built-in, email-client-safe starter templates (table layout, inline styles, English copy). */
export interface StarterTemplate {
  key: string; name: string; category: string; subject: string; previewText: string; html: string;
}

const btn = (label: string, href = 'https://example.com', color = '#4f46e5') =>
  `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0"><tr><td style="background:${color};border-radius:6px"><a href="${href}" style="display:inline-block;padding:13px 28px;color:#ffffff;text-decoration:none;font-weight:bold;font-size:15px">${label}</a></td></tr></table>`;

function shell(opts: { title: string; accent: string; body: string }) {
  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f5f7;font-family:Arial,Helvetica,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:10px;overflow:hidden">
<tr><td style="background:${opts.accent};padding:22px 32px"><span style="color:#ffffff;font-size:20px;font-weight:bold">${opts.title}</span></td></tr>
<tr><td style="padding:32px;color:#1f2937;font-size:15px;line-height:1.65">${opts.body}</td></tr>
<tr><td style="padding:20px 32px;background:#f9fafb;text-align:center;font-size:12px;color:#9ca3af">
You are receiving this email because you subscribed to updates from us.<br>
<a href="{{unsubscribe_url}}" style="color:#9ca3af">Unsubscribe</a></td></tr>
</table></td></tr></table></body></html>`;
}

const hi = `<p style="margin:0 0 16px">Hi {{first_name | default: "there"}},</p>`;

export const STARTER_TEMPLATES: StarterTemplate[] = [
  {
    key: 'welcome', name: 'Welcome email', category: 'onboarding',
    subject: 'Welcome aboard, {{first_name | default: "friend"}}!', previewText: 'Here is how to get started in 3 simple steps.',
    html: shell({ title: 'Welcome!', accent: '#4f46e5', body: `${hi}
<p style="margin:0 0 16px">Thanks for joining us. Here is how to get the most out of your first week:</p>
<ol style="margin:0 0 16px;padding-left:20px"><li>Complete your profile</li><li>Explore the dashboard</li><li>Reply to this email with any question</li></ol>
${btn('Get started')}<p style="margin:0">Warm regards,<br>The Team</p>` }),
  },
  {
    key: 'newsletter', name: 'Monthly newsletter', category: 'newsletter',
    subject: 'Your monthly update is here', previewText: 'News, tips and what is coming next.',
    html: shell({ title: 'Monthly Newsletter', accent: '#0f766e', body: `${hi}
<h2 style="margin:0 0 8px;font-size:20px">Top story</h2>
<p style="margin:0 0 16px">Write a short, engaging summary of your main story here. Keep it to two or three sentences and link to the full article.</p>
${btn('Read more', 'https://example.com', '#0f766e')}
<hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
<h3 style="margin:0 0 6px;font-size:16px">Quick tip</h3><p style="margin:0 0 16px">Share one useful tip your readers can apply today.</p>
<h3 style="margin:0 0 6px;font-size:16px">Coming soon</h3><p style="margin:0">Tease what is next to keep readers excited.</p>` }),
  },
  {
    key: 'promo', name: 'Promotional offer', category: 'promotion',
    subject: '{{first_name | default: "Hi"}}, 20% off just for you', previewText: 'Offer ends this Sunday.',
    html: shell({ title: 'Limited-time offer', accent: '#dc2626', body: `${hi}
<p style="margin:0 0 8px;font-size:34px;font-weight:bold;color:#dc2626">20% OFF</p>
<p style="margin:0 0 16px">Use code <b>SAVE20</b> at checkout. Valid until Sunday at midnight.</p>
${btn('Shop now', 'https://example.com', '#dc2626')}
<p style="margin:0;font-size:13px;color:#6b7280">Terms apply. Cannot be combined with other offers.</p>` }),
  },
  {
    key: 'announcement', name: 'Product announcement', category: 'announcement',
    subject: 'Introducing something new', previewText: 'We have been working on this for a while.',
    html: shell({ title: 'Something new is here', accent: '#7c3aed', body: `${hi}
<p style="margin:0 0 16px">We are excited to announce our latest feature. Here is what is new:</p>
<ul style="margin:0 0 16px;padding-left:20px"><li>Benefit one — explain it simply</li><li>Benefit two — focus on the outcome</li><li>Benefit three — keep it short</li></ul>
${btn('See what is new', 'https://example.com', '#7c3aed')}<p style="margin:0">We would love your feedback — just reply to this email.</p>` }),
  },
  {
    key: 'event', name: 'Event invitation', category: 'event',
    subject: 'You are invited: join us live', previewText: 'Save your seat — spots are limited.',
    html: shell({ title: 'You are invited', accent: '#ea580c', body: `${hi}
<p style="margin:0 0 16px">Join us for a live session packed with practical insights.</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 8px;background:#fff7ed;border-radius:8px;width:100%"><tr><td style="padding:16px 20px">
<b>Date:</b> Friday, 10:00 AM<br><b>Where:</b> Online (link sent after registration)<br><b>Cost:</b> Free</td></tr></table>
${btn('Save my seat', 'https://example.com', '#ea580c')}` }),
  },
  {
    key: 'reengage', name: 'Win-back / re-engagement', category: 'retention',
    subject: 'We miss you, {{first_name | default: "friend"}}', previewText: 'Here is what you have been missing.',
    html: shell({ title: 'It has been a while', accent: '#2563eb', body: `${hi}
<p style="margin:0 0 16px">We noticed you have not visited recently, and a lot has improved since. Come take a look.</p>
${btn('Come back', 'https://example.com', '#2563eb')}
<p style="margin:0;font-size:13px;color:#6b7280">Not interested anymore? You can unsubscribe below — no hard feelings.</p>` }),
  },
];
