import { Message } from '../llm-types';
import { GuardChain } from '../guardrails/chain';

/**
 * Base class for all handlers with guard chain integration
 */
export abstract class BaseHandler {
  constructor(protected guardChain: GuardChain) {}

  /**
   * Process messages through guard chain and handler
   */
  protected async processWithGuards(
    messages: Message[],
    operation: string | undefined,
    processor: (messages: Message[]) => Promise<string>
  ): Promise<string> {
    // Process through guard chain
    const processedMessages = await this.guardChain.processInput(messages, {
      type: 'llm',
      operation: operation || 'default'
    });

    // Process with handler
    const response = await processor(processedMessages);

    // Process response through guard chain
    return this.guardChain.processOutput(String(response), {
      type: 'llm',
      operation: `${operation || 'default'}_response`
    });
  }
}
