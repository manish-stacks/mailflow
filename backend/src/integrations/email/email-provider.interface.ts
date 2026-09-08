export interface SendEmailInput {
  to: string;
  /** When set, the send is routed through this workspace's own mail connection if it has one. */
  workspaceId?: string;
  fromName: string;
  fromEmail: string;
  replyTo?: string;
  subject: string;
  html: string;
  text?: string;
  headers?: Record<string, string>;
}

export interface SendEmailResult {
  messageId: string;
  accepted: boolean;
  /** true => transient (retry), false => permanent (mark failed/suppress) */
  retryable?: boolean;
  error?: string;
}

export interface DomainVerificationRecord {
  type: 'TXT' | 'CNAME' | 'MX';
  host: string;
  value: string;
  purpose: 'spf' | 'dkim' | 'dmarc' | 'verification' | 'return-path';
}

/**
 * Every email provider (SMTP, SES, Postmark, Brevo...) implements this.
 * Campaign business logic never talks to a provider SDK directly.
 */
export interface EmailProvider {
  readonly name: string;
  send(input: SendEmailInput): Promise<SendEmailResult>;
  /** DNS records a workspace must publish to authenticate a sending domain. */
  getDomainRecords(domain: string): Promise<DomainVerificationRecord[]>;
  /** Ask the provider (or DNS) whether the domain is authenticated yet. */
  checkDomain(domain: string): Promise<{ verified: boolean; details?: any }>;
  /** Validate an inbound webhook. Providers without signatures return true only in dev. */
  verifyWebhook(headers: Record<string, any>, rawBody: string): boolean;
  /** Normalise a provider payload into internal events. */
  parseWebhook(payload: any): Array<{ messageId?: string; email?: string; type: string; timestamp?: Date; raw?: any }>;
}
