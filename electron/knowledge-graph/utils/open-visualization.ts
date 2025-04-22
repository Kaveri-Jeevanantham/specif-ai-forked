import { exec } from 'child_process';
import { platform } from 'os';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Opens a file in the default system browser
 */
export async function openInBrowser(filePath: string): Promise<void> {
  try {
    const command = getOpenCommand(filePath);
    await execAsync(command);
  } catch (error) {
    console.error('Error opening visualization:', error);
    throw error;
  }
}

/**
 * Get the appropriate command to open a file based on the operating system
 */
function getOpenCommand(filePath: string): string {
  switch (platform()) {
    case 'win32':
      return `start "" "${filePath}"`;
    case 'darwin':
      return `open "${filePath}"`;
    default:
      return `xdg-open "${filePath}"`;
  }
}

/**
 * Opens multiple files in the default system browser
 */
export async function openMultipleFiles(filePaths: string[]): Promise<void> {
  try {
    await Promise.all(filePaths.map(filePath => openInBrowser(filePath)));
  } catch (error) {
    console.error('Error opening visualizations:', error);
    throw error;
  }
}

/**
 * Opens the graph visualization files and prints instructions
 */
export async function openGraphVisualizations(dotPath: string, htmlPath: string): Promise<void> {
  console.log('\nOpening visualizations...');
  
  // Try to open the HTML visualization
  try {
    await openInBrowser(htmlPath);
    console.log('✓ Interactive visualization opened in your default browser');
  } catch (error) {
    console.error('Failed to open HTML visualization:', error);
    console.log(`Please open manually: ${htmlPath}`);
  }

  // Print instructions for DOT file
  console.log('\nTo view the DOT visualization:');
  console.log('1. Install Graphviz (https://graphviz.org/download/)');
  console.log('2. Run the following command:');
  console.log(`   dot -Tpng "${dotPath}" -o "${dotPath}.png"`);
  console.log(`3. Open the generated PNG file: ${dotPath}.png`);

  console.log('\nVisualization Tips:');
  console.log('- Use mouse wheel to zoom in/out');
  console.log('- Drag nodes to rearrange the layout');
  console.log('- Hover over nodes and edges to see details');
  console.log('- Use the controls to change the layout and physics settings');
}
