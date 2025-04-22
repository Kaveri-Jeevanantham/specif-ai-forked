import { KnowledgeGraphHandler } from '../../handlers/knowledge-graph-handler';
import { SemanticQuery, StructuredQuery } from '../types/query.types';
import { GraphVisualizer } from '../utils/graph-visualizer';
import { openGraphVisualizations } from '../utils/open-visualization';
import { join } from 'path';
import { promises as fs } from 'fs';

async function runQuickTest() {
  try {
    console.log('Starting Knowledge Graph Quick Test...\n');

    // Create output directory if it doesn't exist
    const outputDir = join(__dirname, 'output');
    await fs.mkdir(outputDir, { recursive: true });

    // Initialize the handler
    const kgHandler = new KnowledgeGraphHandler();

    // Process the sample document
    const samplePath = join(__dirname, 'sample-documents', 'company-info.txt');
    console.log('Processing sample document:', samplePath);
    const result = await kgHandler.handleProcessDocument({} as any, samplePath);
    
    console.log('Extracted Entities:', result.entities.length);
    console.log('Extracted Relations:', result.relations.length);

    // Example queries to test the knowledge graph
    console.log('\nRunning test queries...');

    // 1. Find company leadership
    const leadershipQuery: SemanticQuery = {
      type: 'semantic',
      query: 'Who are the leaders of Tech Innovations Inc?',
      options: {
        useEmbeddings: false,
        similarityThreshold: 0.5,
        maxDistance: 2,
        contextWindow: 3
      }
    };
    
    console.log('\nQuery 1: Company Leadership');
    const leadershipResults = await kgHandler.handleQuery({} as any, leadershipQuery);
    console.log('Results:', JSON.stringify(leadershipResults, null, 2));

    // 2. Find technical details
    const techQuery: StructuredQuery = {
      type: 'structured',
      patterns: {
        nodes: [
          { 
            label: 'project',
            properties: {}
          }
        ],
        edges: [
          {
            source: '.*',
            target: '.*',
            label: 'involves|uses'
          }
        ]
      }
    };

    console.log('\nQuery 2: Technical Projects');
    const techResults = await kgHandler.handleQuery({} as any, techQuery);
    console.log('Results:', JSON.stringify(techResults, null, 2));

    // Get graph statistics
    console.log('\nKnowledge Graph Statistics:');
    const stats = await kgHandler.handleGetStats({} as any);
    console.log(JSON.stringify(stats, null, 2));

    // Generate visualizations
    console.log('\nGenerating graph visualizations...');
    
    // Get the current graph data
    const graphData = await kgHandler.handleExport({} as any);
    
    // Generate and save DOT format visualization
    const dotPath = join(outputDir, 'knowledge-graph.dot');
    await GraphVisualizer.saveVisualization(graphData, 'dot', dotPath);
    console.log('DOT visualization saved to:', dotPath);

    // Generate and save HTML visualization
    const htmlPath = join(outputDir, 'knowledge-graph.html');
    await GraphVisualizer.saveVisualization(graphData, 'html', htmlPath);
    console.log('HTML visualization saved to:', htmlPath);

    // Generate and print graph summary
    console.log('\nGraph Structure Summary:');
    console.log(GraphVisualizer.generateSummary(graphData));

    // Open visualizations in browser
    await openGraphVisualizations(dotPath, htmlPath);

  } catch (error) {
    console.error('Quick test failed:', error);
    throw error;
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  runQuickTest()
    .then(() => {
      console.log('\nTest completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('Test failed:', error);
      process.exit(1);
    });
}

export { runQuickTest };
