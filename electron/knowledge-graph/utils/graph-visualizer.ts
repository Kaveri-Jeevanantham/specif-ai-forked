import { GraphData, GraphNode, GraphEdge } from '../types/graph.types';
import { promises as fs } from 'fs';
import { join } from 'path';
import { HTML_TEMPLATE } from './visualization-template';

/**
 * Utility class to generate visualizations of the knowledge graph
 */
export class GraphVisualizer {
  /**
   * Generate a DOT format representation of the graph
   */
  public static toDOT(graphData: GraphData): string {
    const lines: string[] = ['digraph KnowledgeGraph {'];
    
    // Graph styling
    lines.push('  rankdir=LR;');
    lines.push('  node [style=filled, fontname="Arial"];');
    lines.push('  edge [fontname="Arial"];');

    // Add nodes
    graphData.nodes.forEach(node => {
      const label = this.formatNodeLabel(node);
      const color = this.getNodeColor(node.label);
      lines.push(`  "${node.id}" [label="${label}", fillcolor="${color}"];`);
    });

    // Add edges
    graphData.edges.forEach(edge => {
      const label = this.formatEdgeLabel(edge);
      lines.push(`  "${edge.source}" -> "${edge.target}" [label="${label}"];`);
    });

    lines.push('}');
    return lines.join('\n');
  }

  /**
   * Generate an HTML representation of the graph
   */
  public static toHTML(graphData: GraphData): string {
    // Convert nodes to vis.js format
    const nodes = graphData.nodes.map(node => ({
      id: node.id,
      label: this.formatNodeLabel(node),
      group: node.label.toLowerCase(),
      color: this.getNodeColor(node.label),
      title: this.generateNodeTooltip(node)
    }));

    // Convert edges to vis.js format
    const edges = graphData.edges.map(edge => ({
      from: edge.source,
      to: edge.target,
      label: edge.label,
      title: this.generateEdgeTooltip(edge)
    }));

    // Replace placeholders in template
    return HTML_TEMPLATE
      .replace('NODES', JSON.stringify(nodes))
      .replace('EDGES', JSON.stringify(edges));
  }

  /**
   * Save graph visualization to a file
   */
  public static async saveVisualization(
    graphData: GraphData,
    format: 'dot' | 'html',
    outputPath: string
  ): Promise<void> {
    const content = format === 'dot' 
      ? this.toDOT(graphData)
      : this.toHTML(graphData);

    await fs.writeFile(outputPath, content, 'utf-8');
  }

  /**
   * Generate a summary of the graph structure
   */
  public static generateSummary(graphData: GraphData): string {
    const nodeTypes = new Map<string, number>();
    const edgeTypes = new Map<string, number>();

    // Count node types
    graphData.nodes.forEach(node => {
      const count = nodeTypes.get(node.label) || 0;
      nodeTypes.set(node.label, count + 1);
    });

    // Count edge types
    graphData.edges.forEach(edge => {
      const count = edgeTypes.get(edge.label) || 0;
      edgeTypes.set(edge.label, count + 1);
    });

    // Generate summary text
    const lines: string[] = ['Knowledge Graph Summary:'];
    lines.push('\nNode Types:');
    nodeTypes.forEach((count, type) => {
      lines.push(`  ${type}: ${count}`);
    });

    lines.push('\nRelationship Types:');
    edgeTypes.forEach((count, type) => {
      lines.push(`  ${type}: ${count}`);
    });

    lines.push(`\nTotal Nodes: ${graphData.nodes.length}`);
    lines.push(`Total Relationships: ${graphData.edges.length}`);

    return lines.join('\n');
  }

  private static formatNodeLabel(node: GraphNode): string {
    const name = node.properties.name || node.label;
    return name;
  }

  private static formatEdgeLabel(edge: GraphEdge): string {
    return edge.label;
  }

  private static generateNodeTooltip(node: GraphNode): string {
    const lines = [
      `Type: ${node.label}`,
      `ID: ${node.id}`,
      'Properties:'
    ];

    Object.entries(node.properties)
      .filter(([key]) => key !== 'name')
      .forEach(([key, value]) => {
        lines.push(`  ${key}: ${value}`);
      });

    return lines.join('\n');
  }

  private static generateEdgeTooltip(edge: GraphEdge): string {
    const lines = [
      `Type: ${edge.label}`,
      `From: ${edge.source}`,
      `To: ${edge.target}`
    ];

    if (Object.keys(edge.properties).length > 0) {
      lines.push('Properties:');
      Object.entries(edge.properties).forEach(([key, value]) => {
        lines.push(`  ${key}: ${value}`);
      });
    }

    return lines.join('\n');
  }

  private static getNodeColor(type: string): string {
    const colors: Record<string, string> = {
      person: '#AED6F1',      // Light blue
      organization: '#F5B7B1', // Light red
      location: '#A2D9CE',    // Light green
      project: '#D7BDE2',     // Light purple
      technology: '#FAD7A0',  // Light orange
      default: '#F2F3F4'      // Light gray
    };

    return colors[type.toLowerCase()] || colors.default;
  }
}
