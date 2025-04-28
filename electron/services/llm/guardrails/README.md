# Guardrails System

A security and validation system for LLM and Agent operations that enforces content safety and system boundaries.

## Core Features

- Content validation (PII, sensitive data)
- File system boundary enforcement
- Restricted command prevention
- SSL requirement enforcement
- Support for both LLM and Agent workflows

## Usage Examples

### LLM Integration

```typescript
import { LLMGuardrailIntegration } from './integration';

// Initialize guardrails
const guardrails = new LLMGuardrailIntegration();

// Example 1: Process messages
const messages = [
  { role: 'user', content: 'My password is secret123' }
];

try {
  const safeMessages = await guardrails.processMessages(messages);
  // Output: [{ role: 'user', content: 'My password is [REDACTED]' }]
} catch (error) {
  console.error('Validation failed:', error.message);
}

// Example 2: Validate response
const response = await guardrails.validateResponse(
  'Use sudo rm -rf to delete files'
);
// Throws GuardrailError: Contains restricted command
```

### Agent Integration

```typescript
import { AgentGuardrailIntegration } from './integration';

const guardrails = new AgentGuardrailIntegration();

// Example 1: Validate agent state
try {
  const state = {
    currentPath: '/etc/system',
    command: 'chmod 777 file.txt'
  };
  
  await guardrails.validateState(state, 'file_operation');
  // Throws GuardrailError: Contains restricted path and command
} catch (error) {
  console.error('State validation failed:', error.message);
}

// Example 2: Validate tool usage
try {
  const args = {
    url: 'http://insecure-site.com',
    data: { email: 'user@example.com' }
  };
  
  await guardrails.validateToolUse('api_call', args);
  // Throws GuardrailError: Non-SSL URL and contains sensitive data
} catch (error) {
  console.error('Tool validation failed:', error.message);
}
```

## Configuration

### Content Validator
```typescript
const contentValidator = new ContentValidator();

// Add custom pattern
contentValidator.addPattern(
  'custom_secret',
  /MY_SECRET_\w+/g,
  '[REDACTED-SECRET]',
  'custom secret pattern'
);
```

### Boundary Validator
```typescript
const boundaryValidator = new BoundaryValidator({
  allowedPaths: [
    process.cwd(),
    '/safe/path'
  ],
  restrictedCommands: [
    'rm -rf',
    'chmod',
    'sudo'
  ],
  requiresSSL: true
});
```

## Best Practices

1. **Always Validate Both Input and Output**
   ```typescript
   // Validate input
   const safeInput = await guardrails.processMessages(messages);
   
   // Process with LLM
   const response = await llm.process(safeInput);
   
   // Validate output
   const safeResponse = await guardrails.validateResponse(response);
   ```

2. **Handle Errors Appropriately**
   ```typescript
   try {
     await guardrails.validateState(state, operation);
   } catch (error) {
     if (error instanceof GuardrailError) {
       // Handle validation failure
       logValidationError(error);
       return fallbackBehavior();
     }
     // Handle other errors
     throw error;
   }
   ```

3. **Configure Based on Context**
   ```typescript
   // Development
   const devGuardrails = new Guardrail([
     new BoundaryValidator({
       allowedPaths: [process.cwd()],
       requiresSSL: false
     })
   ]);

   // Production
   const prodGuardrails = new Guardrail([
     new BoundaryValidator({
       allowedPaths: ['/app'],
       requiresSSL: true
     })
   ]);
   ```

## Error Handling

```typescript
catch (error) {
  if (error instanceof GuardrailError) {
    switch (error.context.type) {
      case 'llm':
        // Handle LLM-specific violations
        break;
      case 'agent':
        // Handle agent-specific violations
        break;
    }
  }
}
```

## Integration with Existing Code

```typescript
// In your LLM handler
class YourLLMHandler {
  private guardrails = new LLMGuardrailIntegration();
  
  async process(messages: Message[]): Promise<string> {
    // 1. Validate input
    const safeMessages = await this.guardrails.processMessages(messages);
    
    // 2. Process with LLM
    const response = await this.llm.generate(safeMessages);
    
    // 3. Validate output
    return this.guardrails.validateResponse(response);
  }
}
