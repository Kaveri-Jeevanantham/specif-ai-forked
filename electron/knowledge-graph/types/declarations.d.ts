declare module 'node-nlp' {
  export class NlpManager {
    constructor(options: { languages: string[]; forceNER: boolean });
    addBuiltinEntities(entities: string[]): void;
    train(): Promise<void>;
    process(text: string): Promise<{
      entities: Array<{
        entity: string;
        utterance: string;
        accuracy: number;
        sourceText: string;
        position: number;
      }>;
      sentiment: {
        score: number;
      };
      language: string;
    }>;
  }
}

declare module 'compromise' {
  interface NLPResult {
    people(): MatchResult;
    organizations(): MatchResult;
    places(): MatchResult;
    clauses(): ClauseResult;
    topics(): { json(): Array<{ text: string }> };
  }

  interface MatchResult {
    text(): string;
    offset(): number;
    terms(): Array<{ tags: string[] }>;
    forEach(callback: (match: any) => void): void;
  }

  interface ClauseResult {
    forEach(callback: (clause: {
      subject(): { text(): string };
      verb(): { text(): string };
      object(): { text(): string };
      text(): string;
    }) => void): void;
  }

  function nlp(text: string): NLPResult;
  export = nlp;
}
