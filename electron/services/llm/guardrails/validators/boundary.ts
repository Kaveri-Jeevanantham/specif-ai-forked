import { BaseValidator } from '../core/base-validator';
import { GuardrailContext, ValidationResult } from '../core/types';

/**
 * Configuration for system boundaries
 */
interface BoundaryConfig {
  /** Allowed file system paths */
  allowedPaths: string[];
  
  /** Restricted system commands */
  restrictedCommands: string[];
  
  /** Require SSL for network connections */
  requiresSSL: boolean;
}

/**
 * Default boundary configuration
 */
const DEFAULT_BOUNDARY_CONFIG: BoundaryConfig = {
  allowedPaths: [process.cwd()],
  restrictedCommands: [
    'rm -rf',
    'sudo',
    'chmod',
    'chown',
    'mkfs',
    'dd',
    'format'
  ],
  requiresSSL: true
};

/**
 * Validates system boundaries and permissions
 */
export class BoundaryValidator extends BaseValidator {
  readonly id = 'boundary-validator';
  readonly priority = 0; // Runs first

  constructor(
    private config: BoundaryConfig = DEFAULT_BOUNDARY_CONFIG
  ) {
    super();
  }

  async validate(
    input: any,
    context: GuardrailContext
  ): Promise<ValidationResult> {
    const content = typeof input === 'string' ? input : JSON.stringify(input);
    const violations = this.checkBoundaryViolations(content);

    if (violations.length > 0) {
      return this.failure([
        'Boundary violations detected:',
        ...violations
      ]);
    }

    return this.success(input);
  }

  /**
   * Checks for potential boundary violations in content
   */
  private checkBoundaryViolations(content: string): string[] {
    const violations: string[] = [];

    // Check for restricted system commands
    for (const cmd of this.config.restrictedCommands) {
      if (content.includes(cmd)) {
        violations.push(`Contains restricted command: ${cmd}`);
      }
    }

    // Check for file path violations
    const pathPattern = /(?:\/[\w.-]+)+/g;
    const paths = content.match(pathPattern) || [];
    
    for (const path of paths) {
      if (!this.isPathAllowed(path)) {
        violations.push(`Contains restricted file path: ${path}`);
      }
    }

    // Check for non-SSL URLs
    if (this.config.requiresSSL) {
      const httpPattern = /http:\/\/[\w.-]+/g;
      const insecureUrls = content.match(httpPattern) || [];
      
      if (insecureUrls.length > 0) {
        violations.push('Contains non-SSL URLs. Only HTTPS is allowed.');
      }
    }

    return violations;
  }

  /**
   * Checks if a file path is allowed
   */
  private isPathAllowed(path: string): boolean {
    return this.config.allowedPaths.some(
      allowedPath => path.startsWith(allowedPath)
    );
  }

  /**
   * Updates the boundary configuration
   */
  updateConfig(config: Partial<BoundaryConfig>): void {
    this.config = {
      ...this.config,
      ...config
    };
  }

  /**
   * Gets the current boundary configuration
   */
  getConfig(): BoundaryConfig {
    return { ...this.config };
  }
}
