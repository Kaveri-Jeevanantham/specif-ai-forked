import { LLMHandler } from './llm-handler';
import { LLMProvider } from './llm-types';
import { GuardChain } from './guardrails/chain';
import { ScopeGuard } from './guardrails/guards/scope.guard';
import { ProviderRegistry } from './providers/provider-registry';
import { LangChainHandler } from './handlers/langchain-handler';
import { NativeHandler } from './handlers/native-handler';

// Re-export all types and providers
export * from './llm-types';
export * from './llm-handler';
export * from './providers/azure-openai';
export * from './providers/openai';
export * from './providers/anthropic';
export * from './providers/bedrock';
export * from './providers/ollama';
export * from './providers/gemini';
export * from './providers/openrouter';

/**
 * Creates an instance of the appropriate LLM handler based on the specified provider.
 */
export function buildLLMHandler(provider: LLMProvider | string, config: Record<string, any>): LLMHandler {
  const providerName = typeof provider === 'string' ? provider : String(provider);
  
  // Create guard chain first
  const guardChain = new GuardChain([new ScopeGuard()]);

  // Create handler based on provider type
  if (ProviderRegistry.isLangChainProvider(providerName)) {
    const langchainProvider = ProviderRegistry.createLangChainProvider(providerName, config);
    const handler = new LangChainHandler(langchainProvider, config, guardChain);
    return handler.createHandler();
  } else {
    const nativeProvider = ProviderRegistry.createNativeProvider(providerName, config);
    const handler = new NativeHandler(nativeProvider, guardChain);
    return handler.createHandler();
  }
}
