import { promises as fs } from 'fs';
import { join } from 'path';

/**
 * Utility functions for cleaning up generated files and directories
 */
export class CleanupUtil {
  /**
   * Clean up visualization output directory
   */
  public static async cleanVisualizationOutput(
    outputDir: string,
    options: {
      keepDirectory?: boolean;
      keepDotFiles?: boolean;
      keepHtmlFiles?: boolean;
    } = {}
  ): Promise<void> {
    try {
      const {
        keepDirectory = false,
        keepDotFiles = false,
        keepHtmlFiles = false
      } = options;

      // Check if directory exists
      try {
        await fs.access(outputDir);
      } catch {
        console.log('Output directory does not exist, nothing to clean');
        return;
      }

      // Read directory contents
      const files = await fs.readdir(outputDir);

      // Delete files based on options
      for (const file of files) {
        const filePath = join(outputDir, file);
        const ext = file.toLowerCase().split('.').pop();

        if (
          (ext === 'dot' && !keepDotFiles) ||
          (ext === 'html' && !keepHtmlFiles) ||
          (ext === 'png' && file.endsWith('.dot.png'))
        ) {
          await fs.unlink(filePath);
          console.log(`Deleted: ${file}`);
        }
      }

      // Delete directory if empty and not keeping it
      if (!keepDirectory) {
        const remainingFiles = await fs.readdir(outputDir);
        if (remainingFiles.length === 0) {
          await fs.rmdir(outputDir);
          console.log(`Deleted empty directory: ${outputDir}`);
        }
      }

    } catch (error) {
      console.error('Error during cleanup:', error);
      throw error;
    }
  }

  /**
   * Clean up all test and example outputs
   */
  public static async cleanAllOutputs(): Promise<void> {
    const directories = [
      join(__dirname, '..', 'examples', 'output'),
      join(__dirname, '..', 'test-utils', 'output')
    ];

    for (const dir of directories) {
      try {
        await CleanupUtil.cleanVisualizationOutput(dir);
        console.log(`Cleaned: ${dir}`);
      } catch (error) {
        console.error(`Error cleaning ${dir}:`, error);
      }
    }
  }

  /**
   * Clean up temporary files
   */
  public static async cleanTempFiles(): Promise<void> {
    try {
      const tempPatterns = [
        '*.dot.png',
        'temp-*.json',
        'graph-backup-*.json'
      ];

      for (const pattern of tempPatterns) {
        // Implementation would depend on the specific needs
        // Could use glob patterns to find and delete matching files
        console.log(`Would delete files matching: ${pattern}`);
      }
    } catch (error) {
      console.error('Error cleaning temporary files:', error);
      throw error;
    }
  }
}

// Add cleanup script to package.json scripts
if (require.main === module) {
  CleanupUtil.cleanAllOutputs()
    .then(() => {
      console.log('Cleanup completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('Cleanup failed:', error);
      process.exit(1);
    });
}
