import { LLMError, LLMProvider } from '../llm-types';
import { buildLangchainModelProvider } from '../llm-langchain';
import AzureOpenAIHandler from './azure-openai';
import AnthropicHandler from './anthropic';
import BedrockHandler from './bedrock';
import GeminiHandler from './gemini';
import OllamaHandler from './ollama';
import OpenAIHandler from './openai';
import OpenRouterHandler from './openrouter';

// List of providers that use LangChain
const LANGCHAIN_PROVIDERS = [
  LLMProvider.OPENAI_NATIVE,
  LLMProvider.OPENAI,      // Azure OpenAI
  LLMProvider.ANTHROPIC,
  LLMProvider.BEDROCK,
  LLMProvider.OLLAMA,
  LLMProvider.GEMINI,
  LLMProvider.OPENROUTER
];

export class ProviderRegistry {
  /**
   * Check if provider uses LangChain
   */
  static isLangChainProvider(provider: string): boolean {
    return LANGCHAIN_PROVIDERS.includes(provider as LLMProvider);
  }

  /**
   * Create LangChain provider
   */
  static createLangChainProvider(provider: string, config: Record<string, any>) {
    return buildLangchainModelProvider(provider, config);
  }

  /**
   * Create native provider
   */
  static createNativeProvider(provider: string, config: Record<string, any>) {
    switch (provider.toLowerCase()) {
      case LLMProvider.OPENAI_NATIVE:
        return new OpenAIHandler(config);
      case LLMProvider.ANTHROPIC:
        return new AnthropicHandler(config);
      case LLMProvider.BEDROCK:
        return new BedrockHandler(config);
      case LLMProvider.OLLAMA:
        return new OllamaHandler(config);
      case LLMProvider.GEMINI:
        return new GeminiHandler(config);
      case LLMProvider.OPENAI:
        return new AzureOpenAIHandler(config);
      case LLMProvider.OPENROUTER:
        return new OpenRouterHandler(config);
      default:
        throw new LLMError(
          `Invalid provider: ${provider}. Must be one of: ${Object.values(LLMProvider).join(', ')}`,
          'builder'
        );
    }
  }
}
