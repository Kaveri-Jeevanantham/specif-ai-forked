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

// Electron IPC types
declare namespace Electron {
  interface IpcMain {
    handle(channel: string, listener: (event: IpcMainInvokeEvent, ...args: any[]) => Promise<any> | any): void;
  }
}

// Knowledge Graph specific types
declare namespace KnowledgeGraph {
  interface Config {
    minConfidence: number;
    maxEntitiesPerDocument: number;
    supportedLanguages: string[];
    persistence: {
      format: 'json' | 'sqlite';
      path: string;
      compression?: boolean;
      backup?: boolean;
    };
  }

  interface Stats {
    graphStats: {
      totalGraphs: number;
      totalSize: number;
      lastModified: Date;
    };
    queryStats: {
      totalQueries: number;
      averageExecutionTime: number;
      successRate: number;
      commonPatterns: Array<{
        pattern: string;
        count: number;
      }>;
    };
  }
}

// Visualization types
declare namespace Visualization {
  interface Options {
    layout: 'standard' | 'hierarchical' | 'circular';
    physics: boolean;
    nodeSize: number;
    edgeWidth: number;
    colors: {
      [key: string]: string;
    };
  }

  interface ExportOptions {
    format: 'dot' | 'html';
    path: string;
    includeStats: boolean;
  }
}
