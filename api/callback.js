// Vercel serverless function: receives "Request a callback" form submissions
// and emails them to the parts team.
//
// Required environment variables (set in Vercel → Settings → Environment Variables):
//   SMTP_USER         Mailbox that sends the email (e.g. a Gmail address)
//   SMTP_PASS         Its password. For Gmail this must be an App Password.
//   LEAD_RECIPIENTS   Comma-separated list of addresses that receive each request
// Optional:
//   SMTP_HOST         Defaults to smtp.gmail.com
//   SMTP_PORT         Defaults to 465 (implicit TLS)
//   SMTP_SECURE       "true"/"false". Defaults to true when the port is 465.

import nodemailer from 'nodemailer';

const PHONE = '(800) 732-6762';
const FAIL_MESSAGE = `We couldn't send your request. Please call us at ${PHONE}.`;

// Same rules as the form on the page.
const FIELDS = {
  name: { label: 'Name', max: 100, required: true },
  company: { label: 'Company', max: 150, required: true },
  phone: { label: 'Phone', max: 30, required: true, min: 7 },
  email: { label: 'Email', max: 255, required: true },
  model: { label: 'Machine model', max: 100, required: true },
  serial: { label: 'Serial number', max: 100, required: false },
  needs: { label: "What they're looking for", max: 1000, required: true },
};
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function validate(body) {
  const data = {};
  for (const [key, rule] of Object.entries(FIELDS)) {
    const value = clean(body[key]);
    if (rule.required && !value) return { error: `${rule.label} is required.` };
    if (value.length > rule.max) return { error: `${rule.label} is too long.` };
    if (rule.min && value.length < rule.min) return { error: 'Enter a valid phone.' };
    data[key] = value;
  }
  if (!EMAIL_RE.test(data.email)) return { error: 'Enter a valid email.' };
  return { data };
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

function stripLineBreaks(s) {
  return s.replace(/[\r\n]+/g, ' ');
}

function buildEmail(data, meta) {
  const rows = Object.entries(FIELDS).map(([key, rule]) => [rule.label, data[key] || '—']);
  const text = [
    'New callback request from the parts landing page.',
    '',
    ...rows.map(([label, value]) => `${label}: ${value}`),
    '',
    `Submitted: ${meta.submittedAt}`,
    `Page: ${meta.page || 'unknown'}`,
    '',
    'Reply to this email to answer the customer directly.',
  ].join('\n');

  const htmlRows = rows
    .map(([label, value]) =>
      `<tr><td style="padding:8px 16px 8px 0;color:#5B6770;vertical-align:top;white-space:nowrap">${escapeHtml(label)}</td>` +
      `<td style="padding:8px 0;color:#2F363A;white-space:pre-wrap">${escapeHtml(value)}</td></tr>`)
    .join('');
  const html =
    `<div style="font-family:'Source Sans Pro',Arial,Helvetica,sans-serif;font-size:16px;line-height:1.5">` +
    `<h2 style="margin:0 0 12px;color:#2F363A;font-weight:600">New callback request</h2>` +
    `<table style="border-collapse:collapse">${htmlRows}</table>` +
    `<p style="margin:16px 0 0;color:#5B6770;font-size:14px">Submitted ${escapeHtml(meta.submittedAt)}` +
    (meta.page ? ` from ${escapeHtml(meta.page)}` : '') +
    `. Reply to this email to answer the customer directly.</p></div>`;

  const subject = stripLineBreaks(`Callback request: ${data.name}, ${data.company} (${data.model})`).slice(0, 200);
  return { subject, text, html };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  // Reject posts from other websites.
  const origin = req.headers.origin;
  if (origin) {
    let originHost = '';
    try { originHost = new URL(origin).host; } catch { /* malformed origin */ }
    if (originHost !== req.headers.host) {
      return res.status(403).json({ error: 'Forbidden.' });
    }
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = null; }
  }
  if (!body || typeof body !== 'object') {
    return res.status(400).json({ error: 'Invalid request.' });
  }

  // Honeypot: people never see this field, so anything in it is a bot.
  // Pretend it worked so the bot moves on.
  if (clean(body.website)) {
    return res.status(200).json({ ok: true });
  }

  const { data, error } = validate(body);
  if (error) return res.status(400).json({ error });

  const { SMTP_USER, SMTP_PASS, LEAD_RECIPIENTS } = process.env;
  const recipients = (LEAD_RECIPIENTS || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (!SMTP_USER || !SMTP_PASS || recipients.length === 0) {
    console.error('callback: email is not configured (SMTP_USER, SMTP_PASS and LEAD_RECIPIENTS are required)');
    return res.status(500).json({ error: FAIL_MESSAGE });
  }

  const port = Number(process.env.SMTP_PORT || 465);
  const secure = process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : port === 465;
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port,
    secure,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  const page = typeof body.source === 'string' ? body.source.slice(0, 500) : '';
  const { subject, text, html } = buildEmail(data, { submittedAt: new Date().toUTCString(), page });

  try {
    await transporter.sendMail({
      from: { name: 'Parts callback request', address: SMTP_USER },
      to: recipients,
      replyTo: { name: stripLineBreaks(data.name), address: data.email },
      subject,
      text,
      html,
    });
  } catch (err) {
    console.error('callback: sending failed:', err && err.message);
    return res.status(502).json({ error: FAIL_MESSAGE });
  }

  return res.status(200).json({ ok: true });
}
