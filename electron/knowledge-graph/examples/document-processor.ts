import { KnowledgeGraphHandler } from '../../handlers/knowledge-graph-handler';
import { SemanticQuery, StructuredQuery, HybridQuery } from '../types/query.types';
import { promises as fs } from 'fs';
import { join } from 'path';

/**
 * Example utility demonstrating the usage of the Knowledge Graph module
 * for processing documents and performing various types of queries.
 */
class DocumentProcessorExample {
  private kgHandler: KnowledgeGraphHandler;

  constructor() {
    this.kgHandler = new KnowledgeGraphHandler();
  }

  /**
   * Process a directory of documents and build a knowledge graph
   */
  async processDirectory(dirPath: string): Promise<void> {
    try {
      console.log(`Processing directory: ${dirPath}`);
      
      // Read all files in the directory
      const files = await fs.readdir(dirPath);
      const textFiles = files.filter(file => 
        ['.txt', '.md', '.doc', '.docx', '.pdf'].includes(file.toLowerCase().slice(-4))
      );

      console.log(`Found ${textFiles.length} documents to process`);

      // Process each file
      for (const file of textFiles) {
        const filePath = join(dirPath, file);
        console.log(`Processing file: ${file}`);
        
        await this.kgHandler.handleProcessDocument({} as any, filePath);
      }

      console.log('Directory processing complete');
    } catch (error) {
      console.error('Error processing directory:', error);
      throw error;
    }
  }

  /**
   * Demonstrate different types of queries
   */
  async runQueryExamples(): Promise<void> {
    try {
      // 1. Simple semantic query
      console.log('\nRunning semantic query...');
      const semanticQuery: SemanticQuery = {
        type: 'semantic',
        query: 'What companies are mentioned?',
        options: {
          useEmbeddings: false,
          similarityThreshold: 0.5,
          maxDistance: 2,
          contextWindow: 3
        }
      };
      const semanticResults = await this.kgHandler.handleQuery({} as any, semanticQuery);
      console.log('Semantic Query Results:', JSON.stringify(semanticResults, null, 2));

      // 2. Structured query for people and their roles
      console.log('\nRunning structured query...');
      const structuredQuery: StructuredQuery = {
        type: 'structured',
        patterns: {
          nodes: [
            { 
              label: 'person',
              properties: {}
            }
          ],
          edges: [
            {
              source: '.*',
              target: '.*',
              label: 'has_role'
            }
          ]
        }
      };
      const structuredResults = await this.kgHandler.handleQuery({} as any, structuredQuery);
      console.log('Structured Query Results:', JSON.stringify(structuredResults, null, 2));

      // 3. Hybrid query combining semantic and structured approaches
      console.log('\nRunning hybrid query...');
      const hybridQuery: HybridQuery = {
        type: 'hybrid',
        semantic: {
          query: 'Who are the leaders in the company?',
          options: {
            useEmbeddings: false,
            similarityThreshold: 0.5,
            maxDistance: 2,
            contextWindow: 3
          }
        },
        structured: {
          patterns: {
            nodes: [
              { 
                label: 'person',
                properties: {}
              }
            ],
            edges: [
              {
                source: '.*',
                target: '.*',
                label: 'leads|manages'
              }
            ]
          }
        },
        strategy: 'weighted'
      };
      const hybridResults = await this.kgHandler.handleQuery({} as any, hybridQuery);
      console.log('Hybrid Query Results:', JSON.stringify(hybridResults, null, 2));

    } catch (error) {
      console.error('Error running queries:', error);
      throw error;
    }
  }

  /**
   * Export the knowledge graph for visualization or backup
   */
  async exportGraph(outputPath: string): Promise<void> {
    try {
      await this.kgHandler.handleExport({} as any);
      console.log(`Graph exported to: ${outputPath}`);
    } catch (error) {
      console.error('Error exporting graph:', error);
      throw error;
    }
  }

  /**
   * Get statistics about the knowledge graph
   */
  async printGraphStats(): Promise<void> {
    try {
      const stats = await this.kgHandler.handleGetStats({} as any);
      console.log('\nKnowledge Graph Statistics:');
      console.log(JSON.stringify(stats, null, 2));
    } catch (error) {
      console.error('Error getting graph stats:', error);
      throw error;
    }
  }
}

// Example usage
async function runExample() {
  const processor = new DocumentProcessorExample();
  
  try {
    // Process documents
    await processor.processDirectory('./documents');
    
    // Run example queries
    await processor.runQueryExamples();
    
    // Export the graph
    await processor.exportGraph('./output/knowledge-graph.json');
    
    // Print statistics
    await processor.printGraphStats();
    
  } catch (error) {
    console.error('Example failed:', error);
  }
}

// Run the example if this file is executed directly
if (require.main === module) {
  runExample()
    .then(() => console.log('Example completed successfully'))
    .catch(error => {
      console.error('Example failed:', error);
      process.exit(1);
    });
}

export { DocumentProcessorExample };
