import { SCOPE_ENFORCEMENT_PROMPT, getOutOfScopeResponse } from './scope-prompt';
import { Message } from '../../llm-types';

/**
 * Manages requirement-focused prompts and scope enforcement
 */
export class PromptManager {
  /**
   * Enhances messages with scope enforcement prompt
   */
  static enhanceMessages(messages: Message[]): Message[] {
    return [
      {
        role: 'system',
        content: SCOPE_ENFORCEMENT_PROMPT
      },
      ...messages
    ];
  }

  /**
   * Gets the base system prompt
   */
  static getSystemPrompt(): string {
    return SCOPE_ENFORCEMENT_PROMPT;
  }

  /**
   * Gets out-of-scope response
   */
  static getOutOfScopeResponse(query: string): string {
    return getOutOfScopeResponse(query);
  }
}
