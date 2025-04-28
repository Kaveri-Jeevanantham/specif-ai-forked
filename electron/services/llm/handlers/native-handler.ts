import { LLMHandler } from '../llm-handler';
import { Message } from '../llm-types';
import { GuardChain } from '../guardrails/chain';
import { BaseHandler } from './base-handler';

/**
 * Handler for native providers
 */
export class NativeHandler extends BaseHandler {
  constructor(
    private handler: LLMHandler,
    guardChain: GuardChain
  ) {
    super(guardChain);
  }

  /**
   * Create LLM handler with guard chain
   */
  createHandler(): LLMHandler {
    const originalHandler = this.handler;
    const self = this;

    return new class extends LLMHandler {
      protected config = originalHandler.getConfig({});

      async invoke(messages: Message[], systemPrompt?: string | null, operation?: string): Promise<string> {
        return self.processWithGuards(messages, operation, async (processedMessages) => {
          return originalHandler.invoke(processedMessages, systemPrompt, operation);
        });
      }

      getConfig(config: Record<string, any>): Record<string, any> {
        return originalHandler.getConfig(config);
      }

      getModel() {
        return originalHandler.getModel();
      }

      isValid(): boolean | Promise<boolean> {
        return originalHandler.isValid();
      }
    };
  }
}
