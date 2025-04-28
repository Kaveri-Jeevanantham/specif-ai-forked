import { LLMHandler } from '../llm-handler';
import { Message, ModelInfo } from '../llm-types';
import { GuardChain } from '../guardrails/chain';
import { LangChainModelProvider } from '../langchain-providers/base';
import { BaseHandler } from './base-handler';
import { SystemMessage, HumanMessage, AIMessage } from "@langchain/core/messages";

/**
 * Handler for LangChain providers
 */
export class LangChainHandler extends BaseHandler {
  constructor(
    private provider: LangChainModelProvider,
    private config: Record<string, any>,
    guardChain: GuardChain
  ) {
    super(guardChain);
  }

  /**
   * Create LLM handler with guard chain
   */
  createHandler(): LLMHandler {
    const model = this.provider.getModel();
    const self = this;

    return new class extends LLMHandler {
      protected config: Record<string, any>;

      constructor() {
        super();
        this.config = self.config;
      }

      async invoke(messages: Message[], systemPrompt?: string | null, operation?: string): Promise<string> {
        return self.processWithGuards(messages, operation, async (processedMessages) => {
          // Convert to LangChain messages
          const langchainMessages = processedMessages.map(m => {
            switch (m.role) {
              case 'system':
                return new SystemMessage(m.content);
              case 'user':
                return new HumanMessage(m.content);
              case 'assistant':
                return new AIMessage(m.content);
              default:
                throw new Error(`Unknown message role: ${m.role}`);
            }
          });

          // Add system prompt if provided
          const finalMessages = systemPrompt 
            ? [new SystemMessage(systemPrompt), ...langchainMessages]
            : langchainMessages;

          // Process with model
          const response = await model.invoke(finalMessages);

          // Extract response content
          if (typeof response === 'string') {
            return response;
          } else if (response && typeof response === 'object' && 'content' in response) {
            return String(response.content);
          } else if (Array.isArray(response)) {
            const validResponses = (response as Array<{ content: unknown }>)
              .filter((r): r is { content: unknown } => 
                r && typeof r === 'object' && 'content' in r
              )
              .map(r => String(r.content));
            return validResponses.join('\n');
          }
          return '';
        });
      }

      getConfig(): Record<string, any> {
        return self.config;
      }

      getModel(): ModelInfo {
        return self.provider.getModelInfo();
      }

      isValid(): boolean | Promise<boolean> {
        return self.provider.isValid();
      }
    };
  }
}
