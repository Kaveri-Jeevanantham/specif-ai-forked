import { BaseGuard } from '../core/base-guard';
import { GuardrailContext, ValidationResult } from '../core/types';
import { Message } from '../../llm-types';
import { PromptManager } from '../prompts/prompt-manager';

/**
 * Guard that enforces Specif AI's scope using PromptManager
 */
export class ScopeGuard extends BaseGuard {
  readonly id = 'scope-guard';
  readonly priority = 1; // Run first in chain

  async validate(input: Message[], context: GuardrailContext): Promise<ValidationResult> {
    // Check if messages are within scope
    const userMessages = input.filter(m => m.role === 'user');
    if (userMessages.length === 0) {
      return this.failure(['No user messages found']);
    }

    // Enhance messages with scope enforcement
    const enhancedMessages = PromptManager.enhanceMessages(input);
    return this.success(enhancedMessages);
  }

  async validateOutput(response: string, context: GuardrailContext): Promise<ValidationResult> {
    if (!response || typeof response !== 'string') {
      return this.failure(['Invalid response format']);
    }

    // Return out-of-scope response if needed
    if (this.isOutOfScopeResponse(response)) {
      return this.success(PromptManager.getOutOfScopeResponse(response));
    }

    return this.success(response);
  }

  private isOutOfScopeResponse(response: string): boolean {
    // Check if response indicates it's out of scope
    return response.toLowerCase().includes('i am not able to') ||
           response.toLowerCase().includes('i cannot provide') ||
           response.toLowerCase().includes('outside my scope');
  }
}
