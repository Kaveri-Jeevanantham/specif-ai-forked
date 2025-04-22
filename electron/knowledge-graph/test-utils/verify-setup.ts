import { KnowledgeGraphHandler } from '../../handlers/knowledge-graph-handler';
import { EntityExtractor } from '../core/entity-extractor';
import { GraphBuilder } from '../core/graph-builder';
import { QueryEngine } from '../core/query-engine';
import { PersistenceService } from '../services/persistence.service';
import { GraphVisualizer } from '../utils/graph-visualizer';
import { join } from 'path';
import { promises as fs } from 'fs';

async function verifySetup() {
  console.log('Verifying Knowledge Graph Module Setup...\n');

  try {
    // 1. Check core components
    console.log('1. Checking core components...');
    
    const entityExtractor = new EntityExtractor();
    console.log('✓ EntityExtractor initialized');
    
    const graphBuilder = new GraphBuilder();
    console.log('✓ GraphBuilder initialized');
    
    const queryEngine = new QueryEngine(graphBuilder);
    console.log('✓ QueryEngine initialized');
    
    const persistenceService = new PersistenceService();
    console.log('✓ PersistenceService initialized');

    // 2. Check handler initialization
    console.log('\n2. Checking handler initialization...');
    const handler = new KnowledgeGraphHandler();
    console.log('✓ KnowledgeGraphHandler initialized');

    // 3. Check directory structure
    console.log('\n3. Checking directory structure...');
    const directories = [
      'core',
      'services',
      'types',
      'utils',
      'examples',
      'test-utils',
      join('examples', 'sample-documents')
    ];

    for (const dir of directories) {
      const dirPath = join(__dirname, '..', dir);
      await fs.access(dirPath);
      console.log(`✓ Directory exists: ${dir}`);
    }

    // 4. Check sample documents
    console.log('\n4. Checking sample documents...');
    const samplePath = join(__dirname, '..', 'examples', 'sample-documents', 'company-info.txt');
    await fs.access(samplePath);
    console.log('✓ Sample document exists');

    // 5. Check visualization capabilities
    console.log('\n5. Checking visualization capabilities...');
    const testGraph = {
      nodes: [
        { id: 'test1', label: 'test', properties: { name: 'Test Node' } }
      ],
      edges: []
    };
    
    const dotOutput = GraphVisualizer.toDOT(testGraph);
    const htmlOutput = GraphVisualizer.toHTML(testGraph);
    
    console.log('✓ DOT visualization generation works');
    console.log('✓ HTML visualization generation works');

    // 6. Check output directory creation
    console.log('\n6. Checking output directory creation...');
    const outputDir = join(__dirname, 'output');
    await fs.mkdir(outputDir, { recursive: true });
    console.log('✓ Output directory created/exists');

    // Clean up test output
    await fs.rmdir(outputDir);

    console.log('\nSetup Verification Complete!');
    console.log('\nAll components are properly installed and initialized.');
    console.log('\nYou can now run:');
    console.log('- npm run kg:visualize   (for interactive visualization)');
    console.log('- npm run test:kg:all    (for comprehensive tests)');
    console.log('- npm run kg:example     (for document processing example)');

  } catch (error) {
    console.error('\n❌ Setup verification failed:', error);
    console.error('\nPlease check:');
    console.error('1. All dependencies are installed (npm install)');
    console.error('2. TypeScript is compiled (npm run build)');
    console.error('3. File permissions are correct');
    console.error('4. All required files are in place');
    throw error;
  }
}

// Run verification if executed directly
if (require.main === module) {
  verifySetup()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { verifySetup };
