import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiCompletionInput, AiCompletionResult, AiProvider } from '@/modules/ai/ai-provider.interface';

/**
 * Hugging Face Inference Providers (OpenAI-compatible chat completions).
 * The API key never leaves the backend.
 */
@Injectable()
export class HuggingFaceProvider implements AiProvider {
  readonly name = 'huggingface';
  private readonly logger = new Logger(HuggingFaceProvider.name);
  private readonly endpoint = 'https://router.huggingface.co/v1/chat/completions';

  constructor(private config: ConfigService) {}

  async complete(input: AiCompletionInput): Promise<AiCompletionResult> {
    const key = this.config.get('ai.hfKey');
    const model = this.config.get('ai.hfModel');
    if (!key) throw new ServiceUnavailableException('AI is not configured on this server');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60_000);

    try {
      const res = await fetch(this.endpoint, {
        method: 'POST',
        signal: controller.signal,
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: input.system },
            { role: 'user', content: input.prompt },
          ],
          max_tokens: input.maxTokens ?? 900,
          temperature: input.temperature ?? 0.7,
          ...(input.json ? { response_format: { type: 'json_object' } } : {}),
        }),
      });

      if (!res.ok) {
        const body = await res.text();
        this.logger.error(`Hugging Face ${res.status}: ${body.slice(0, 300)}`);
        throw new ServiceUnavailableException('The AI service is temporarily unavailable');
      }

      const data: any = await res.json();
      return {
        text: data?.choices?.[0]?.message?.content ?? '',
        tokensIn: data?.usage?.prompt_tokens,
        tokensOut: data?.usage?.completion_tokens,
        model,
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}
