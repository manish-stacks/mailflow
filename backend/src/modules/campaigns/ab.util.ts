import type { DataSource } from 'typeorm';
import type { CampaignSettings } from '@/database/entities';

/** Auto-winner A/B tests. A recipient is in the TEST group when the first byte of its id is below the threshold,
 *  and sees subject B when the last hex digit of its id is odd — both are deterministic, so no extra columns are needed. */
export function abThreshold(s?: CampaignSettings | null): number | null {
  if (!s?.subjectB || !s.abAutoWinner?.enabled) return null;
  const pct = Math.min(50, Math.max(5, Number(s.abAutoWinner.testPercent) || 20));
  return Math.round((pct / 100) * 256);
}
export const inTestGroup = (recipientId: string, threshold: number) => parseInt(recipientId.slice(0, 2), 16) < threshold;
export const isVariantB = (recipientId: string) => parseInt(recipientId.slice(-1), 16) % 2 === 1;

/** Per-variant engagement. With a threshold, only the test group is counted (so post-winner sends don't skew results). */
export async function abStats(db: DataSource, campaignId: string, workspaceId: string, threshold: number | null) {
  const rows = await db.query(
    `SELECT CONV(RIGHT(id,1),16,10) % 2 AS v, COUNT(*) AS total,
            SUM(status IN ('sent','delivered')) AS sent, SUM(open_count > 0) AS opened, SUM(click_count > 0) AS clicked
       FROM campaign_recipients WHERE campaign_id = ? AND workspace_id = ?
        ${threshold !== null ? 'AND CONV(LEFT(id,2),16,10) < ?' : ''} GROUP BY v`,
    threshold !== null ? [campaignId, workspaceId, threshold] : [campaignId, workspaceId]);
  const pick = (v: number) => rows.find((r: any) => Number(r.v) === v) || {};
  const mk = (r: any) => {
    const sent = Number(r.sent || 0), opened = Number(r.opened || 0), clicked = Number(r.clicked || 0);
    return { recipients: Number(r.total || 0), sent, opened, clicked,
      openRate: sent ? +(opened / sent * 100).toFixed(1) : 0, clickRate: sent ? +(clicked / sent * 100).toFixed(1) : 0 };
  };
  return { a: mk(pick(0)), b: mk(pick(1)) };
}
