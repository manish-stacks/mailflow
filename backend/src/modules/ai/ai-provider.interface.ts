export interface AiCompletionInput {
  system: string;
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  json?: boolean;
}

export interface AiCompletionResult {
  text: string;
  tokensIn?: number;
  tokensOut?: number;
  model: string;
}

/** Swap Hugging Face for any other provider by implementing this and registering it in AiService. */
export interface AiProvider {
  readonly name: string;
  complete(input: AiCompletionInput): Promise<AiCompletionResult>;
}
