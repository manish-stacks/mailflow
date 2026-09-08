export * from './base.entity';
export * from './user.entity';
export * from './workspace.entity';
export * from './contact.entity';
export * from './sender.entity';
export * from './campaign.entity';
export * from './misc.entity';
export * from './billing.entity';
export * from './payment.entity';

import { User, RefreshToken } from './user.entity';
import { Workspace, WorkspaceMember } from './workspace.entity';
import { Contact, ContactList, ContactListMember, Segment } from './contact.entity';
import { SenderIdentity, SenderDomain } from './sender.entity';
import { EmailTemplate, Campaign, CampaignRecipient, CampaignEvent, TrackedLink } from './campaign.entity';
import { Unsubscribe, Suppression, UploadedFile, ImportJob, ApiKey, AuditLog, AiUsage } from './misc.entity';
import { Plan, Subscription, UsagePeriod, EmailConnection } from './billing.entity';
import { Payment } from './payment.entity';

export const ALL_ENTITIES = [
  User, RefreshToken, Workspace, WorkspaceMember,
  Contact, ContactList, ContactListMember, Segment,
  SenderIdentity, SenderDomain,
  EmailTemplate, Campaign, CampaignRecipient, CampaignEvent, TrackedLink,
  Unsubscribe, Suppression, UploadedFile, ImportJob, ApiKey, AuditLog, AiUsage,
  Plan, Subscription, UsagePeriod, EmailConnection, Payment,
];
