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
var HuggingFaceProvider_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HuggingFaceProvider = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
/**
 * Hugging Face Inference Providers (OpenAI-compatible chat completions).
 * The API key never leaves the backend.
 */
let HuggingFaceProvider = HuggingFaceProvider_1 = class HuggingFaceProvider {
    config;
    name = 'huggingface';
    logger = new common_1.Logger(HuggingFaceProvider_1.name);
    endpoint = 'https://router.huggingface.co/v1/chat/completions';
    constructor(config) {
        this.config = config;
    }
    async complete(input) {
        const key = this.config.get('ai.hfKey');
        const model = this.config.get('ai.hfModel');
        if (!key)
            throw new common_1.ServiceUnavailableException('AI is not configured on this server');
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
                throw new common_1.ServiceUnavailableException('The AI service is temporarily unavailable');
            }
            const data = await res.json();
            return {
                text: data?.choices?.[0]?.message?.content ?? '',
                tokensIn: data?.usage?.prompt_tokens,
                tokensOut: data?.usage?.completion_tokens,
                model,
            };
        }
        finally {
            clearTimeout(timeout);
        }
    }
};
exports.HuggingFaceProvider = HuggingFaceProvider;
exports.HuggingFaceProvider = HuggingFaceProvider = HuggingFaceProvider_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], HuggingFaceProvider);
