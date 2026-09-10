export default () => ({
  env: process.env.NODE_ENV || 'development',
  port: +(process.env.PORT || 4000),
  appBaseUrl: process.env.APP_BASE_URL || 'http://localhost:3000',
  trackingBaseUrl: process.env.TRACKING_BASE_URL || 'http://localhost:4000',
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3000').split(','),
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessTtl: process.env.JWT_ACCESS_TTL || '15m',
    refreshTtl: process.env.JWT_REFRESH_TTL || '30d',
  },
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID,
    keySecret: process.env.RAZORPAY_KEY_SECRET,
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET,
  },
  encryptionKey: process.env.ENCRYPTION_KEY || process.env.JWT_SECRET,
  // Extra SPF "include:" mechanism merged into every newly-generated SPF record,
  // so it doesn't clash with the mailbox provider clients' domains are typically
  // already using (e.g. Hostinger). Leave blank to generate a plain SPF record.
  spfInclude: process.env.SPF_INCLUDE || '_spf.mail.hostinger.com',
  trackingSecret: process.env.TRACKING_SECRET || 'tracking',
  webhookSecret: process.env.WEBHOOK_SECRET || 'webhook',
  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: +(process.env.REDIS_PORT || 6379),
    password: process.env.REDIS_PASSWORD || undefined,
  },
  ai: {
    provider: process.env.AI_PROVIDER || 'huggingface',
    hfKey: process.env.HUGGINGFACE_API_KEY,
    hfModel: process.env.HUGGINGFACE_MODEL || 'meta-llama/Llama-3.1-8B-Instruct',
    dailyLimit: +(process.env.AI_DAILY_LIMIT || 200),
  },
  email: {
    provider: process.env.EMAIL_PROVIDER || 'smtp',
    from: process.env.EMAIL_FROM,
    ratePerMinute: +(process.env.SEND_RATE_PER_MINUTE || 600),
    allowUnverifiedSenders: process.env.ALLOW_UNVERIFIED_SENDERS === 'true',
    smtp: {
      host: process.env.SMTP_HOST,
      port: +(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      user: process.env.SMTP_USER,
      password: process.env.SMTP_PASSWORD,
    },
  },
  r2: {
    endpoint: process.env.R2_ACCOUNT_ID ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : undefined,
    region: 'auto',
    bucket: process.env.R2_BUCKET_NAME,
    accessKey: process.env.R2_ACCESS_KEY_ID,
    secretKey: process.env.R2_SECRET_ACCESS_KEY,
    publicUrl: process.env.R2_PUBLIC_URL,
  },
});