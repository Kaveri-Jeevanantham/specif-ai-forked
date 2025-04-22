import { NlpManager } from 'node-nlp';
import * as nlp from 'compromise';
import { v4 as uuidv4 } from 'uuid';
import {
  Entity,
  Relation,
  ProcessingResult,
  EntityExtractorConfig,
  DocumentMetadata,
  ProcessingError
} from '../types/entity.types';

export class EntityExtractor {
  private nlpManager: NlpManager;
  private config: EntityExtractorConfig;

  constructor(config?: Partial<EntityExtractorConfig>) {
    this.config = {
      minConfidence: 0.6,
      maxEntitiesPerDocument: 1000,
      supportedLanguages: ['en'],
      ...config
    };

    this.nlpManager = new NlpManager({
      languages: this.config.supportedLanguages,
      forceNER: true
    });

    this.initializeNLP();
  }

  private async initializeNLP(): Promise<void> {
    // Add built-in entities
    this.nlpManager.addBuiltinEntities([
      'email',
      'url',
      'number',
      'ordinal',
      'percentage',
      'date',
      'currency'
    ]);

    // Train the NLP manager
    await this.nlpManager.train();
  }

  public async extract(text: string, metadata: DocumentMetadata): Promise<ProcessingResult> {
    try {
      const [nlpEntities, compEntities] = await Promise.all([
        this.extractNLPEntities(text),
        this.extractCompromiseEntities(text)
      ]);

      // Merge and deduplicate entities
      const entities = this.mergeEntities(nlpEntities, compEntities);
      
      // Extract relations between entities
      const relations = await this.extractRelations(text, entities);

      return {
        entities: entities.slice(0, this.config.maxEntitiesPerDocument),
        relations,
        metadata
      };
    } catch (error) {
      const processingError: ProcessingError = {
        code: 'EXTRACTION_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error during extraction',
        details: error
      };
      throw processingError;
    }
  }

  private async extractNLPEntities(text: string): Promise<Entity[]> {
    const result = await this.nlpManager.process(text);
    return result.entities
      .filter(e => e.accuracy >= this.config.minConfidence)
      .map(e => ({
        id: uuidv4(),
        type: e.entity,
        name: e.utterance,
        properties: {
          accuracy: e.accuracy,
          sourceText: e.sourceText,
          position: e.position
        },
        sourceDocument: '',  // Will be filled by the caller
        confidence: e.accuracy
      }));
  }

  private extractCompromiseEntities(text: string): Entity[] {
    const doc = nlp(text);
    const entities: Entity[] = [];

    // Extract people names
    doc.people().forEach(match => {
      entities.push({
        id: uuidv4(),
        type: 'person',
        name: match.text(),
        properties: {
          position: match.offset(),
          tags: match.terms().map(t => t.tags)
        },
        sourceDocument: '',
        confidence: 0.8  // Default confidence for Compromise
      });
    });

    // Extract organizations
    doc.organizations().forEach(match => {
      entities.push({
        id: uuidv4(),
        type: 'organization',
        name: match.text(),
        properties: {
          position: match.offset(),
          tags: match.terms().map(t => t.tags)
        },
        sourceDocument: '',
        confidence: 0.8
      });
    });

    // Extract places
    doc.places().forEach(match => {
      entities.push({
        id: uuidv4(),
        type: 'place',
        name: match.text(),
        properties: {
          position: match.offset(),
          tags: match.terms().map(t => t.tags)
        },
        sourceDocument: '',
        confidence: 0.8
      });
    });

    return entities;
  }

  private mergeEntities(nlpEntities: Entity[], compEntities: Entity[]): Entity[] {
    const merged = [...nlpEntities];
    const existingNames = new Set(nlpEntities.map(e => e.name.toLowerCase()));

    // Add non-duplicate entities from Compromise
    compEntities.forEach(entity => {
      if (!existingNames.has(entity.name.toLowerCase())) {
        merged.push(entity);
        existingNames.add(entity.name.toLowerCase());
      }
    });

    return merged;
  }

  private async extractRelations(text: string, entities: Entity[]): Promise<Relation[]> {
    const relations: Relation[] = [];
    const doc = nlp(text);

    // Extract subject-verb-object patterns
    doc.clauses().forEach(clause => {
      const subject = clause.subject().text();
      const verb = clause.verb().text();
      const object = clause.object().text();

      const sourceEntity = entities.find(e => e.name.includes(subject));
      const targetEntity = entities.find(e => e.name.includes(object));

      if (sourceEntity && targetEntity) {
        relations.push({
          id: uuidv4(),
          type: 'action',
          source: sourceEntity.id,
          target: targetEntity.id,
          properties: {
            verb: verb,
            confidence: 0.7,
            context: clause.text()
          },
          sourceDocument: '',
          confidence: 0.7
        });
      }
    });

    return relations;
  }

  public async analyzeText(text: string): Promise<{
    sentiment: number;
    language: string;
    topics: string[];
  }> {
    const result = await this.nlpManager.process(text);
    const doc = nlp(text);

    return {
      sentiment: result.sentiment.score,
      language: result.language,
      topics: doc.topics().json().map((t: any) => t.text)
    };
  }
}
