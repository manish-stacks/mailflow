export const QUEUES = {
  CAMPAIGN_PREPARATION: 'campaign-preparation',
  EMAIL_SENDING: 'email-sending',
  SCHEDULED_CAMPAIGNS: 'scheduled-campaigns',
  CSV_IMPORT: 'csv-import',
  ANALYTICS_PROCESSING: 'analytics-processing',
} as const;

export type QueueName = (typeof QUEUES)[keyof typeof QUEUES];

export interface PrepareCampaignJob { campaignId: string; workspaceId: string }
export interface SendEmailJob { recipientId: string; campaignId: string; workspaceId: string }
export interface CsvImportJob { importJobId: string; workspaceId: string }
export interface AnalyticsJob { type: 'webhook' | 'recount'; payload: any }
