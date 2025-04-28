import { BaseValidator } from '../core/base-validator';
import { GuardrailContext, ValidationResult } from '../core/types';

/**
 * Configuration for content validation patterns
 */
interface ContentValidationPattern {
  pattern: RegExp;
  replacement: string;
  description: string;
}

/**
 * Validates and sanitizes content for sensitive information
 */
export class ContentValidator extends BaseValidator {
  readonly id = 'content-validator';
  readonly priority = 1;

  private patterns: Record<string, ContentValidationPattern> = {
    email: {
      pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      replacement: '[REDACTED-EMAIL]',
      description: 'email address'
    },
    phone: {
      pattern: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
      replacement: '[REDACTED-PHONE]',
      description: 'phone number'
    },
    apiKey: {
      pattern: /\b[A-Za-z0-9-_]{20,}\b/g,
      replacement: '[REDACTED-API-KEY]',
      description: 'API key'
    },
    ipAddress: {
      pattern: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g,
      replacement: '[REDACTED-IP]',
      description: 'IP address'
    },
    password: {
      pattern: /password[=:]\s*\S+/gi,
      replacement: 'password=[REDACTED]',
      description: 'password'
    },
    secretKey: {
      pattern: /(secret|key|token)[=:]\s*\S+/gi,
      replacement: '$1=[REDACTED]',
      description: 'secret key'
    },
    creditCard: {
      pattern: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
      replacement: '[REDACTED-CARD]',
      description: 'credit card number'
    },
    ssn: {
      pattern: /\b\d{3}[-]?\d{2}[-]?\d{4}\b/g,
      replacement: '[REDACTED-SSN]',
      description: 'social security number'
    }
  };

  async validate(
    input: any,
    context: GuardrailContext
  ): Promise<ValidationResult> {
    const content = this.normalizeInput(input);
    const sensitiveData = this.findSensitiveData(content);
    
    if (sensitiveData.length > 0) {
      return this.failure([
        'Content contains sensitive information:',
        ...sensitiveData.map(type => `- Found potential ${type}`)
      ]);
    }

    const sanitized = this.sanitizeContent(content);
    return this.success(this.denormalizeOutput(sanitized, input));
  }

  /**
   * Converts input to string format for validation
   */
  private normalizeInput(input: any): string {
    if (typeof input === 'string') {
      return input;
    }
    try {
      return JSON.stringify(input, null, 2);
    } catch {
      return String(input);
    }
  }

  /**
   * Converts sanitized content back to original format
   */
  private denormalizeOutput(sanitized: string, original: any): any {
    if (typeof original === 'string') {
      return sanitized;
    }
    try {
      return JSON.parse(sanitized);
    } catch {
      return sanitized;
    }
  }

  /**
   * Finds any sensitive data in the content
   */
  private findSensitiveData(content: string): string[] {
    const found: string[] = [];
    
    for (const [key, { pattern, description }] of Object.entries(this.patterns)) {
      if (pattern.test(content)) {
        found.push(description);
      }
    }
    
    return found;
  }

  /**
   * Sanitizes content by replacing sensitive data with redacted markers
   */
  private sanitizeContent(content: string): string {
    let sanitized = content;
    
    for (const { pattern, replacement } of Object.values(this.patterns)) {
      sanitized = sanitized.replace(pattern, replacement);
    }
    
    return sanitized;
  }

  /**
   * Adds a custom pattern for content validation
   */
  addPattern(
    key: string, 
    pattern: RegExp, 
    replacement: string,
    description: string
  ): void {
    this.patterns[key] = { pattern, replacement, description };
  }

  /**
   * Removes a pattern from content validation
   */
  removePattern(key: string): void {
    delete this.patterns[key];
  }
}
