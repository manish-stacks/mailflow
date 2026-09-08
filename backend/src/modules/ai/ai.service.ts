import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { AiUsage, Workspace } from '@/database/entities';
import { HuggingFaceProvider } from '@/integrations/huggingface/huggingface.provider';
import { AiProvider } from './ai-provider.interface';
import {
  buildEmailPrompt, buildRewritePrompt, buildSubjectPrompt, GenerateEmailInput,
  RewriteAction, SYSTEM_EDITOR, SYSTEM_EMAIL_WRITER,
} from './prompts';
import { BillingService } from '@/modules/billing/billing.service';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly providers: Record<string, AiProvider>;

  constructor(
    private config: ConfigService,
    hf: HuggingFaceProvider,
    @InjectRepository(AiUsage) private usage: Repository<AiUsage>,
    @InjectRepository(Workspace) private workspaces: Repository<Workspace>,
    private billing: BillingService,
  ) {
    this.providers = { huggingface: hf };
  }

  private get provider(): AiProvider {
    return this.providers[this.config.get('ai.provider')] || this.providers.huggingface;
  }

  /**
   * Two gates: the plan must include AI at all, then the daily credit count.
   * The plan's aiCreditsPerDay wins over the per-workspace column, which now
   * only acts as a manual override an operator can drop below the plan.
   */
  private async assertQuota(workspaceId: string) {
    const limits = await this.billing.assertFeature(workspaceId, 'ai');
    const ws = await this.workspaces.findOne({ where: { id: workspaceId } });

    const planLimit = limits.aiCreditsPerDay;
    if (planLimit === -1) return; // unlimited

    const manual = ws?.aiDailyLimit ?? this.config.get('ai.dailyLimit');
    const limit = Math.min(planLimit, manual ?? planLimit);

    const since = new Date(Date.now() - 864e5);
    const used = await this.usage.count({ where: { workspaceId, createdAt: MoreThan(since) } });
    if (used >= limit) {
      throw new HttpException(
        `Daily AI limit reached (${limit} generations on the ${limits.planName} plan). It resets in 24 hours.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private async run(workspaceId: string, userId: string, feature: string, system: string, prompt: string) {
    await this.assertQuota(workspaceId);
    const res = await this.provider.complete({ system, prompt, json: true });
    await this.usage.save(this.usage.create({
      workspaceId, userId, feature, tokensIn: res.tokensIn || 0, tokensOut: res.tokensOut || 0,
    }));
    await this.billing.increment(workspaceId, 'aiCalls', 1);
    return this.parseJson(res.text);
  }

  /** Models occasionally wrap JSON in prose or fences — recover instead of failing the request. */
  private parseJson(text: string): any {
    const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    try { return JSON.parse(cleaned); } catch { /* fall through */ }
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try { return JSON.parse(cleaned.slice(start, end + 1)); } catch { /* fall through */ }
    }
    this.logger.warn('AI returned unparseable JSON; falling back to raw text');
    return { body: cleaned };
  }

  async generateEmail(workspaceId: string, userId: string, input: GenerateEmailInput) {
    const out = await this.run(workspaceId, userId, 'generate_email', SYSTEM_EMAIL_WRITER, buildEmailPrompt(input));
    return {
      subject: out.subject || '',
      previewText: out.previewText || '',
      body: out.body || out.content || '',
      ctaText: out.ctaText || input.cta || '',
    };
  }

  async generateSubjects(workspaceId: string, userId: string, topic: string, tone = 'professional') {
    const out = await this.run(workspaceId, userId, 'generate_subject', SYSTEM_EDITOR, buildSubjectPrompt(topic, tone));
    return { subjects: out.subjects || [], previewTexts: out.previewTexts || [] };
  }

  async rewrite(workspaceId: string, userId: string, action: RewriteAction, content: string) {
    const out = await this.run(workspaceId, userId, `rewrite_${action}`, SYSTEM_EDITOR, buildRewritePrompt(action, content));
    return action === 'cta' ? { ctas: out.ctas || [] } : { content: out.content || out.body || '' };
  }

  async usageSummary(workspaceId: string) {
    const ws = await this.workspaces.findOne({ where: { id: workspaceId } });
    const since = new Date(Date.now() - 864e5);
    const used = await this.usage.count({ where: { workspaceId, createdAt: MoreThan(since) } });
    return { used, limit: ws?.aiDailyLimit ?? this.config.get('ai.dailyLimit'), provider: this.provider.name };
  }
}
