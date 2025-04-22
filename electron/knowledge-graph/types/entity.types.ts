export interface Entity {
  id: string;
  type: string;
  name: string;
  properties: Record<string, any>;
  sourceDocument: string;
  confidence: number;
}

export interface Relation {
  id: string;
  type: string;
  source: string; // Entity ID
  target: string; // Entity ID
  properties: Record<string, any>;
  sourceDocument: string;
  confidence: number;
}

export interface DocumentMetadata {
  filename: string;
  type: string;
  path: string;
  processedAt: Date;
}

export interface ProcessingResult {
  entities: Entity[];
  relations: Relation[];
  metadata: DocumentMetadata;
}

export interface EntityExtractorConfig {
  minConfidence: number;
  maxEntitiesPerDocument: number;
  supportedLanguages: string[];
}

export interface ProcessingError {
  code: string;
  message: string;
  details?: any;
}
