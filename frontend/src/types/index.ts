export type WorkspaceRole = 'owner' | 'admin' | 'editor' | 'viewer';
export type ContactStatus = 'active' | 'unsubscribed' | 'bounced' | 'complained' | 'suppressed';
export type CampaignStatus =
  | 'draft' | 'scheduled' | 'preparing' | 'sending' | 'completed' | 'paused' | 'cancelled' | 'failed';

export interface User {
  id: string; email: string; firstName?: string; lastName?: string;
  emailVerified?: boolean; isSuperAdmin?: boolean; mustChangePassword?: boolean;
}

export interface Workspace {
  id: string; name: string; slug: string; role?: WorkspaceRole;
  timezone?: string; plan?: string; ownerId?: string; aiDailyLimit?: number;
  status?: 'active' | 'suspended'; createdAt?: string;
}

export interface WorkspaceMember {
  id: string; workspaceId: string; userId?: string; role: WorkspaceRole;
  status: 'active' | 'invited' | 'disabled'; invitedEmail?: string; createdAt: string;
  user?: Pick<User, 'id' | 'email' | 'firstName' | 'lastName'>;
}

export interface Contact {
  id: string; email: string; firstName?: string; lastName?: string; phone?: string;
  status: ContactStatus; subscribed: boolean; customAttributes?: Record<string, any>;
  createdAt: string; updatedAt: string; lists?: { id: string; name: string }[];
}

export interface ContactList { id: string; name: string; description?: string; contactCount: number; createdAt: string }

export interface SegmentRule { field: string; operator: string; value?: any }
export interface Segment {
  id: string; name: string; description?: string; matchType: 'all' | 'any';
  rules: SegmentRule[]; cachedCount?: number; createdAt: string;
}

export interface SenderIdentity {
  id: string; fromName: string; fromEmail: string; replyToEmail?: string;
  status: 'pending' | 'verified' | 'failed'; isDefault?: boolean; verifiedAt?: string; createdAt: string;
}

export interface DnsRecord { type: string; host: string; value: string; purpose?: string }

export interface SenderDomain {
  id: string; domain: string; provider?: string;
  verificationStatus: 'pending' | 'verifying' | 'verified' | 'failed';
  verificationRecords?: DnsRecord[]; verifiedAt?: string; lastCheckedAt?: string; createdAt: string;
}

export interface EmailTemplate {
  id: string; name: string; category: string; subject?: string; previewText?: string;
  htmlContent?: string; designJson?: any; thumbnail?: string; updatedAt: string; createdAt: string;
}

export interface CampaignAudience {
  mode: 'all' | 'lists' | 'segments';
  listIds?: string[]; segmentIds?: string[]; excludeListIds?: string[];
}

export interface CampaignSettings {
  trackOpens?: boolean; trackClicks?: boolean; includeUnsubscribeLink?: boolean; replyTo?: string;
}

export interface Campaign {
  id: string; name: string; subject?: string; previewText?: string; htmlContent?: string;
  templateId?: string; senderIdentityId?: string; status: CampaignStatus;
  audience?: CampaignAudience; settings?: CampaignSettings;
  scheduledAt?: string; startedAt?: string; completedAt?: string;
  totalRecipients: number; sentCount: number; deliveredCount: number; failedCount: number;
  bouncedCount: number; complainedCount: number; unsubscribedCount: number;
  uniqueOpens: number; totalOpens: number; uniqueClicks: number; totalClicks: number;
  createdAt: string;
}

export interface CampaignReport {
  campaign: { id: string; name: string; subject?: string; status: CampaignStatus; startedAt?: string; completedAt?: string };
  totals: {
    recipients: number; sent: number; delivered: number; failed: number; bounced: number;
    complaints: number; unsubscribes: number; uniqueOpens: number; totalOpens: number;
    uniqueClicks: number; totalClicks: number;
  };
  rates: {
    deliveryRate: number; openRate: number; clickRate: number;
    clickToOpenRate: number; bounceRate: number; unsubscribeRate: number;
  };
  timeline: { date: string; type: string; count: number }[];
}

export interface CampaignSummary {
  id: string; name: string; subject?: string; status: CampaignStatus;
  sent: number; recipients: number; openRate: number; clickRate: number;
  createdAt: string; scheduledAt?: string;
}

export interface CampaignRecipient {
  id: string; email: string; status: string; sentAt?: string; deliveredAt?: string;
  openedAt?: string; clickedAt?: string; bouncedAt?: string; openCount: number; clickCount: number;
  errorMessage?: string;
}

export interface TrackedLink {
  id: string; url: string; label?: string; totalClicks: number; uniqueClicks: number;
}

export interface CampaignEvent {
  id: string; event_type: string; email?: string; metadata?: any; created_at: string;
}

export interface Suppression {
  id: string; email: string; reason: string; source?: string; notes?: string; createdAt: string;
}

export interface ApiKey {
  id: string; name: string; keyPrefix: string; scopes: string[];
  lastUsedAt?: string; revokedAt?: string; createdAt: string;
}

export interface DashboardOverview {
  totalContacts: number; activeSubscribers: number; unsubscribedContacts: number;
  emailsSent: number; delivered: number; campaigns: number;
  openRate: number; clickRate: number; bounceRate: number; unsubscribes: number; complaints: number;
}

export interface TimeseriesPoint {
  date: string; sent: number; delivered: number; opened: number; clicked: number; bounced: number; unsubscribed: number;
}

export interface ImportJob {
  id: string; status: 'pending' | 'processing' | 'completed' | 'failed';
  totalRows: number; validRows: number; invalidRows: number; duplicateRows: number;
  importedRows: number; failedRows: number; errors?: any[]; createdAt: string;
}

export interface Paginated<T> { data: T[]; meta: { page: number; limit: number; total: number; totalPages: number } }

/* ------------------------------------------------------ SaaS layer */

export interface Plan {
  id: string; name: string; slug: string; description?: string;
  priceMonthly: number; priceYearly: number; currency: string;
  maxContacts: number; maxEmailsPerMonth: number; maxCampaignsPerMonth: number;
  maxTeamMembers: number; maxSenderIdentities: number; maxDomains: number;
  aiCreditsPerDay: number;
  allowCustomSmtp: boolean; allowApiAccess: boolean; allowAi: boolean;
  allowSegments: boolean; removeBranding: boolean;
  isPublic: boolean; isActive: boolean; sortOrder: number;
}

export interface PlanLimits {
  planId: string; planName: string; planSlug: string;
  maxContacts: number; maxEmailsPerMonth: number; maxCampaignsPerMonth: number;
  maxTeamMembers: number; maxSenderIdentities: number; maxDomains: number;
  aiCreditsPerDay: number;
  allowCustomSmtp: boolean; allowApiAccess: boolean; allowAi: boolean;
  allowSegments: boolean; removeBranding: boolean;
}

export interface BillingSummary {
  subscription: {
    id: string; status: 'trialing' | 'active' | 'past_due' | 'cancelled' | 'suspended';
    billingCycle: 'monthly' | 'yearly' | 'lifetime' | 'free';
    currentPeriodStart: string; currentPeriodEnd?: string;
    trialEndsAt?: string; cancelledAt?: string;
  };
  plan: { id: string; name: string; slug: string; priceMonthly: number; priceYearly: number; currency: string };
  limits: PlanLimits;
  usage: {
    period: string; contacts: number; members: number; senders: number; domains: number;
    emailsSent: number; campaignsCreated: number; contactsImported: number; aiCalls: number;
  };
  meters: { key: string; label: string; used: number; limit: number; percent: number }[];
}

export type MailProvider = 'smtp' | 'gmail' | 'outlook' | 'ses' | 'brevo' | 'sendgrid' | 'mailgun';

export interface MailConnection {
  id: string; workspaceId: string; label: string; provider: MailProvider;
  host: string; port: number; secure: boolean; username?: string;
  fromName?: string; fromEmail?: string;
  dailyLimit: number; ratePerMinute: number;
  status: 'untested' | 'verified' | 'failed';
  lastError?: string; lastTestedAt?: string; isActive: boolean;
  hasPassword: boolean;
}

export interface MailPreset {
  provider: MailProvider; host: string; port: number; secure: boolean; help: string;
}

export interface AdminStats {
  workspaces: number; users: number; contacts: number; emailsSent: number;
  activeSubscriptions: number; mrr: number;
  byPlan: { name: string; slug: string; workspaces: number; mrr: number }[];
}

export interface AdminWorkspace {
  id: string; name: string; slug: string; status: 'active' | 'suspended'; createdAt: string;
  ownerEmail?: string; ownerName?: string;
  plan?: { name: string; slug: string } | null;
  subscriptionStatus?: string; currentPeriodEnd?: string;
  contacts: number; members: number; emailsSent: number;
}

export interface PaymentRecord {
  id: string; invoiceNumber?: string; orderId?: string; paymentId?: string;
  amount: number; currency: string;
  billingCycle: 'monthly' | 'yearly' | 'lifetime';
  status: 'created' | 'pending' | 'paid' | 'failed' | 'refunded';
  method?: string; failureReason?: string;
  notes?: { planName?: string; planSlug?: string };
  paidAt?: string; createdAt: string;
}

export interface PaymentConfig { enabled: boolean; keyId: string | null }
