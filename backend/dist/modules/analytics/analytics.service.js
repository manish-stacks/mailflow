"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("../../database/entities");
const rate = (num, den) => (den ? +((num / den) * 100).toFixed(2) : 0);
let AnalyticsService = class AnalyticsService {
    campaigns;
    events;
    links;
    db;
    constructor(campaigns, events, links, db) {
        this.campaigns = campaigns;
        this.events = events;
        this.links = links;
        this.db = db;
    }
    /** Dashboard KPI cards. */
    async overview(workspaceId, days = 30) {
        const [contacts] = await this.db.query(`SELECT COUNT(*) AS total,
              SUM(status = 'active' AND subscribed = 1) AS active,
              SUM(status = 'unsubscribed') AS unsubscribed
       FROM contacts WHERE workspace_id = ?`, [workspaceId]);
        const [totals] = await this.db.query(`SELECT COALESCE(SUM(sent_count),0) sent, COALESCE(SUM(delivered_count),0) delivered,
              COALESCE(SUM(bounced_count),0) bounced, COALESCE(SUM(unique_opens),0) opens,
              COALESCE(SUM(unique_clicks),0) clicks, COALESCE(SUM(unsubscribed_count),0) unsubs,
              COALESCE(SUM(complained_count),0) complaints, COUNT(*) campaigns
       FROM campaigns
       WHERE workspace_id = ? AND deleted_at IS NULL AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)`, [workspaceId, days]);
        const sent = +totals.sent;
        const delivered = +totals.delivered || sent;
        return {
            totalContacts: +contacts.total,
            activeSubscribers: +contacts.active || 0,
            unsubscribedContacts: +contacts.unsubscribed || 0,
            emailsSent: sent,
            delivered: +totals.delivered,
            campaigns: +totals.campaigns,
            openRate: rate(+totals.opens, delivered),
            clickRate: rate(+totals.clicks, delivered),
            bounceRate: rate(+totals.bounced, sent),
            unsubscribes: +totals.unsubs,
            complaints: +totals.complaints,
        };
    }
    /** Time series for the dashboard chart. */
    async timeseries(workspaceId, days = 30) {
        const rows = await this.db.query(`SELECT DATE(created_at) AS day, event_type, COUNT(*) AS c
       FROM campaign_events
       WHERE workspace_id = ? AND created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       GROUP BY day, event_type ORDER BY day ASC`, [workspaceId, days]);
        const map = new Map();
        for (let i = days - 1; i >= 0; i--) {
            const d = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10);
            map.set(d, { date: d, sent: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0, unsubscribed: 0 });
        }
        for (const r of rows) {
            const key = new Date(r.day).toISOString().slice(0, 10);
            if (map.has(key))
                map.get(key)[r.event_type] = +r.c;
        }
        return [...map.values()];
    }
    async recentCampaigns(workspaceId, limit = 5) {
        const rows = await this.campaigns.find({
            where: { workspaceId }, order: { createdAt: 'DESC' }, take: limit,
        });
        return rows.map((c) => ({
            id: c.id, name: c.name, status: c.status, subject: c.subject,
            sent: c.sentCount, recipients: c.totalRecipients,
            openRate: rate(c.uniqueOpens, c.deliveredCount || c.sentCount),
            clickRate: rate(c.uniqueClicks, c.deliveredCount || c.sentCount),
            createdAt: c.createdAt, scheduledAt: c.scheduledAt,
        }));
    }
    async campaign(workspaceId, campaignId) {
        const c = await this.campaigns.findOne({ where: { id: campaignId, workspaceId } });
        if (!c)
            throw new common_1.NotFoundException('Campaign not found');
        const denom = c.deliveredCount || c.sentCount;
        const byDay = await this.db.query(`SELECT DATE(created_at) day, event_type, COUNT(*) c FROM campaign_events
       WHERE campaign_id = ? GROUP BY day, event_type ORDER BY day ASC`, [campaignId]);
        return {
            campaign: {
                id: c.id, name: c.name, subject: c.subject, status: c.status,
                startedAt: c.startedAt, completedAt: c.completedAt,
            },
            totals: {
                recipients: c.totalRecipients,
                sent: c.sentCount,
                delivered: c.deliveredCount,
                failed: c.failedCount,
                bounced: c.bouncedCount,
                complaints: c.complainedCount,
                unsubscribes: c.unsubscribedCount,
                uniqueOpens: c.uniqueOpens,
                totalOpens: c.totalOpens,
                uniqueClicks: c.uniqueClicks,
                totalClicks: c.totalClicks,
            },
            rates: {
                deliveryRate: rate(c.deliveredCount, c.sentCount),
                openRate: rate(c.uniqueOpens, denom),
                clickRate: rate(c.uniqueClicks, denom),
                clickToOpenRate: rate(c.uniqueClicks, c.uniqueOpens),
                bounceRate: rate(c.bouncedCount, c.sentCount),
                unsubscribeRate: rate(c.unsubscribedCount, denom),
            },
            timeline: byDay.map((r) => ({ date: new Date(r.day).toISOString().slice(0, 10), type: r.event_type, count: +r.c })),
        };
    }
    campaignLinks(workspaceId, campaignId) {
        return this.links.find({ where: { workspaceId, campaignId }, order: { totalClicks: 'DESC' } });
    }
    async campaignActivity(workspaceId, campaignId, limit = 100) {
        return this.db.query(`SELECT e.id, e.event_type, e.metadata, e.created_at, r.email
       FROM campaign_events e
       LEFT JOIN campaign_recipients r ON r.id = e.campaign_recipient_id
       WHERE e.workspace_id = ? AND e.campaign_id = ?
       ORDER BY e.created_at DESC LIMIT ?`, [workspaceId, campaignId, Math.min(limit, 500)]);
    }
    /** Recomputes counters from the event log — used after webhook bursts. */
    async recount(campaignId) {
        await this.db.query(`UPDATE campaigns c SET
        c.unique_opens = (SELECT COUNT(DISTINCT campaign_recipient_id) FROM campaign_events WHERE campaign_id = c.id AND event_type='opened'),
        c.total_opens  = (SELECT COUNT(*) FROM campaign_events WHERE campaign_id = c.id AND event_type='opened'),
        c.unique_clicks= (SELECT COUNT(DISTINCT campaign_recipient_id) FROM campaign_events WHERE campaign_id = c.id AND event_type='clicked'),
        c.total_clicks = (SELECT COUNT(*) FROM campaign_events WHERE campaign_id = c.id AND event_type='clicked'),
        c.delivered_count = (SELECT COUNT(*) FROM campaign_recipients WHERE campaign_id = c.id AND status='delivered'),
        c.bounced_count = (SELECT COUNT(*) FROM campaign_recipients WHERE campaign_id = c.id AND status='bounced')
       WHERE c.id = ?`, [campaignId]);
    }
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.Campaign)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.CampaignEvent)),
    __param(2, (0, typeorm_1.InjectRepository)(entities_1.TrackedLink)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource])
], AnalyticsService);
