import { EntityExtractor } from '../core/entity-extractor';
import { GraphBuilder } from '../core/graph-builder';
import { QueryEngine } from '../core/query-engine';
import { PersistenceService } from '../services/persistence.service';
import { ProcessingResult, DocumentMetadata } from '../types/entity.types';
import { SemanticQuery, StructuredQuery, HybridQuery } from '../types/query.types';

async function runKnowledgeGraphTest() {
  try {
    console.log('Starting Knowledge Graph Test...');

    // Initialize components
    const entityExtractor = new EntityExtractor();
    const graphBuilder = new GraphBuilder();
    const queryEngine = new QueryEngine(graphBuilder);
    const persistenceService = new PersistenceService({
      path: './test-knowledge-graph'
    });

    // Test document
    const sampleDocument = `
      John Smith is the CEO of Tech Solutions Inc.
      The company was founded in 2020 and is based in San Francisco.
      They work on AI and machine learning projects.
      Sarah Johnson is the CTO and leads the engineering team.
      The company recently partnered with Data Analytics Corp on a new project.
    `;

    // Process document
    console.log('\nProcessing sample document...');
    const metadata: DocumentMetadata = {
      filename: 'sample.txt',
      type: '.txt',
      path: './sample.txt',
      processedAt: new Date()
    };

    const result: ProcessingResult = await entityExtractor.extract(sampleDocument, metadata);
    console.log('Extracted Entities:', result.entities.length);
    console.log('Extracted Relations:', result.relations.length);

    // Build graph
    console.log('\nBuilding knowledge graph...');
    await graphBuilder.addDocument(result);
    console.log('Graph Stats:', graphBuilder.getStats());

    // Test queries
    console.log('\nTesting different query types...');

    // 1. Semantic Query
    const semanticQuery: SemanticQuery = {
      type: 'semantic',
      query: 'Who is the CEO?',
      options: {
        useEmbeddings: false,
        similarityThreshold: 0.5,
        maxDistance: 2,
        contextWindow: 3
      }
    };

    const semanticResults = await queryEngine.executeQuery(semanticQuery);
    console.log('\nSemantic Query Results:');
    console.log(JSON.stringify(semanticResults, null, 2));

    // 2. Structured Query
    const structuredQuery: StructuredQuery = {
      type: 'structured',
      patterns: {
        nodes: [
          { label: 'person', properties: { name: 'John Smith' } }
        ],
        edges: []
      }
    };

    const structuredResults = await queryEngine.executeQuery(structuredQuery);
    console.log('\nStructured Query Results:');
    console.log(JSON.stringify(structuredResults, null, 2));

    // 3. Hybrid Query
    const hybridQuery: HybridQuery = {
      type: 'hybrid',
      semantic: {
        query: 'Who works at Tech Solutions?',
        options: {
          useEmbeddings: false,
          similarityThreshold: 0.5,
          maxDistance: 2,
          contextWindow: 3
        }
      },
      structured: {
        patterns: {
          nodes: [{ label: 'organization' }],
          edges: []
        }
      },
      strategy: 'weighted'
    };

    const hybridResults = await queryEngine.executeQuery(hybridQuery);
    console.log('\nHybrid Query Results:');
    console.log(JSON.stringify(hybridResults, null, 2));

    // Test persistence
    console.log('\nTesting persistence...');
    await persistenceService.saveGraph(graphBuilder.getGraphData(), 'test');
    console.log('Graph saved successfully');

    const loadedGraph = await persistenceService.loadGraph('test');
    console.log('Graph loaded successfully');
    console.log('Loaded nodes:', loadedGraph.nodes.length);
    console.log('Loaded edges:', loadedGraph.edges.length);

    // Clean up
    await persistenceService.deleteGraph('test');
    console.log('\nTest completed successfully!');

  } catch (error) {
    console.error('Test failed:', error);
    throw error;
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  runKnowledgeGraphTest()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Test failed:', error);
      process.exit(1);
    });
}

export { runKnowledgeGraphTest };
