import { NlpManager } from 'node-nlp';
import compromise from 'compromise';
import { ProcessingResult, DocumentMetadata, Entity, Relation } from '../types/entity.types';
import { v4 as uuidv4 } from 'uuid';

interface Term {
  tags: string[];
}

interface Match {
  text(): string;
  terms(): Term[];
}

interface Clause {
  subject(): { text(): string } | null;
  verb(): { text(): string } | null;
  object(): { text(): string } | null;
  text(): string;
}

export class EntityExtractor {
  private nlpManager: NlpManager;

  constructor() {
    this.nlpManager = new NlpManager({
      languages: ['en'],
      forceNER: true
    });
    this.nlpManager.addBuiltinEntities(['email', 'url', 'number', 'date']);
  }

  public async extract(text: string, metadata: DocumentMetadata): Promise<ProcessingResult> {
    const doc = compromise(text);
    const entities: Entity[] = [];
    const relations: Relation[] = [];

    // Extract people
    doc.people().forEach((match: Match) => {
      entities.push({
        id: uuidv4(),
        type: 'person',
        name: match.text(),
        properties: {
          tags: match.terms().map((t: Term) => t.tags)
        },
        sourceDocument: metadata.path,
        confidence: 1.0
      });
    });

    // Extract organizations
    doc.organizations().forEach((match: Match) => {
      entities.push({
        id: uuidv4(),
        type: 'organization',
        name: match.text(),
        properties: {
          tags: match.terms().map((t: Term) => t.tags)
        },
        sourceDocument: metadata.path,
        confidence: 1.0
      });
    });

    // Extract places
    doc.places().forEach((match: Match) => {
      entities.push({
        id: uuidv4(),
        type: 'location',
        name: match.text(),
        properties: {
          tags: match.terms().map((t: Term) => t.tags)
        },
        sourceDocument: metadata.path,
        confidence: 1.0
      });
    });

    // Extract additional entities using NLP.js
    const nlpResult = await this.nlpManager.process(text);
    nlpResult.entities.forEach(entity => {
      entities.push({
        id: uuidv4(),
        type: entity.entity,
        name: entity.utterance,
        properties: {
          accuracy: entity.accuracy,
          sourceText: entity.sourceText,
          position: entity.position
        },
        sourceDocument: metadata.path,
        confidence: entity.accuracy
      });
    });

    // Extract relationships from clauses
    doc.clauses().forEach((clause: Clause) => {
      const subject = clause.subject()?.text();
      const verb = clause.verb()?.text();
      const object = clause.object()?.text();

      if (subject && verb && object) {
        relations.push({
          id: uuidv4(),
          type: verb,
          source: subject,
          target: object,
          properties: {
            context: clause.text()
          },
          sourceDocument: metadata.path,
          confidence: 1.0
        });
      }
    });

    // Create extended metadata
    const extendedMetadata: DocumentMetadata = {
      ...metadata,
      type: metadata.type || 'text/plain'
    };

    return {
      entities,
      relations,
      metadata: extendedMetadata
    };
  }
}
