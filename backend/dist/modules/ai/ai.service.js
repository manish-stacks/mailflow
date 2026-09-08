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
var AiService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("../../database/entities");
const huggingface_provider_1 = require("../../integrations/huggingface/huggingface.provider");
const prompts_1 = require("./prompts");
const billing_service_1 = require("../billing/billing.service");
let AiService = AiService_1 = class AiService {
    config;
    usage;
    workspaces;
    billing;
    logger = new common_1.Logger(AiService_1.name);
    providers;
    constructor(config, hf, usage, workspaces, billing) {
        this.config = config;
        this.usage = usage;
        this.workspaces = workspaces;
        this.billing = billing;
        this.providers = { huggingface: hf };
    }
    get provider() {
        return this.providers[this.config.get('ai.provider')] || this.providers.huggingface;
    }
    /**
     * Two gates: the plan must include AI at all, then the daily credit count.
     * The plan's aiCreditsPerDay wins over the per-workspace column, which now
     * only acts as a manual override an operator can drop below the plan.
     */
    async assertQuota(workspaceId) {
        const limits = await this.billing.assertFeature(workspaceId, 'ai');
        const ws = await this.workspaces.findOne({ where: { id: workspaceId } });
        const planLimit = limits.aiCreditsPerDay;
        if (planLimit === -1)
            return; // unlimited
        const manual = ws?.aiDailyLimit ?? this.config.get('ai.dailyLimit');
        const limit = Math.min(planLimit, manual ?? planLimit);
        const since = new Date(Date.now() - 864e5);
        const used = await this.usage.count({ where: { workspaceId, createdAt: (0, typeorm_2.MoreThan)(since) } });
        if (used >= limit) {
            throw new common_1.HttpException(`Daily AI limit reached (${limit} generations on the ${limits.planName} plan). It resets in 24 hours.`, common_1.HttpStatus.TOO_MANY_REQUESTS);
        }
    }
    async run(workspaceId, userId, feature, system, prompt) {
        await this.assertQuota(workspaceId);
        const res = await this.provider.complete({ system, prompt, json: true });
        await this.usage.save(this.usage.create({
            workspaceId, userId, feature, tokensIn: res.tokensIn || 0, tokensOut: res.tokensOut || 0,
        }));
        await this.billing.increment(workspaceId, 'aiCalls', 1);
        return this.parseJson(res.text);
    }
    /** Models occasionally wrap JSON in prose or fences — recover instead of failing the request. */
    parseJson(text) {
        const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
        try {
            return JSON.parse(cleaned);
        }
        catch { /* fall through */ }
        const start = cleaned.indexOf('{');
        const end = cleaned.lastIndexOf('}');
        if (start >= 0 && end > start) {
            try {
                return JSON.parse(cleaned.slice(start, end + 1));
            }
            catch { /* fall through */ }
        }
        this.logger.warn('AI returned unparseable JSON; falling back to raw text');
        return { body: cleaned };
    }
    async generateEmail(workspaceId, userId, input) {
        const out = await this.run(workspaceId, userId, 'generate_email', prompts_1.SYSTEM_EMAIL_WRITER, (0, prompts_1.buildEmailPrompt)(input));
        return {
            subject: out.subject || '',
            previewText: out.previewText || '',
            body: out.body || out.content || '',
            ctaText: out.ctaText || input.cta || '',
        };
    }
    async generateSubjects(workspaceId, userId, topic, tone = 'professional') {
        const out = await this.run(workspaceId, userId, 'generate_subject', prompts_1.SYSTEM_EDITOR, (0, prompts_1.buildSubjectPrompt)(topic, tone));
        return { subjects: out.subjects || [], previewTexts: out.previewTexts || [] };
    }
    async rewrite(workspaceId, userId, action, content) {
        const out = await this.run(workspaceId, userId, `rewrite_${action}`, prompts_1.SYSTEM_EDITOR, (0, prompts_1.buildRewritePrompt)(action, content));
        return action === 'cta' ? { ctas: out.ctas || [] } : { content: out.content || out.body || '' };
    }
    async usageSummary(workspaceId) {
        const ws = await this.workspaces.findOne({ where: { id: workspaceId } });
        const since = new Date(Date.now() - 864e5);
        const used = await this.usage.count({ where: { workspaceId, createdAt: (0, typeorm_2.MoreThan)(since) } });
        return { used, limit: ws?.aiDailyLimit ?? this.config.get('ai.dailyLimit'), provider: this.provider.name };
    }
};
exports.AiService = AiService;
exports.AiService = AiService = AiService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, typeorm_1.InjectRepository)(entities_1.AiUsage)),
    __param(3, (0, typeorm_1.InjectRepository)(entities_1.Workspace)),
    __metadata("design:paramtypes", [config_1.ConfigService,
        huggingface_provider_1.HuggingFaceProvider,
        typeorm_2.Repository,
        typeorm_2.Repository,
        billing_service_1.BillingService])
], AiService);
