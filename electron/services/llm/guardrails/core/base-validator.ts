import { GuardrailContext, ValidationResult } from './types';

/**
 * Abstract base class for implementing validators
 */
export abstract class BaseValidator {
  /**
   * Unique identifier for the validator
   */
  abstract readonly id: string;

  /**
   * Priority of the validator (lower numbers run first)
   */
  abstract readonly priority: number;

  /**
   * Whether the validator is enabled
   */
  enabled: boolean = true;

  /**
   * Validates the input according to the validator's rules
   * @param input The input to validate
   * @param context Context information about the operation
   * @returns Validation result
   */
  abstract validate(
    input: any,
    context: GuardrailContext
  ): Promise<ValidationResult>;

  /**
   * Creates a validation result
   * @param isValid Whether validation passed
   * @param messages Any validation messages
   * @param sanitizedContent Optional sanitized content
   */
  protected createResult(
    isValid: boolean,
    messages: string[] = [],
    sanitizedContent?: any
  ): ValidationResult {
    return {
      isValid,
      messages,
      sanitizedContent
    };
  }

  /**
   * Creates a successful validation result
   * @param sanitizedContent Optional sanitized content
   */
  protected success(sanitizedContent?: any): ValidationResult {
    return this.createResult(true, [], sanitizedContent);
  }

  /**
   * Creates a failed validation result
   * @param messages Validation error messages
   */
  protected failure(messages: string[]): ValidationResult {
    return this.createResult(false, messages);
  }
}
