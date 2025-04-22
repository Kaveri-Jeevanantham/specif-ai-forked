export const HTML_TEMPLATE = `
<!DOCTYPE html>
<html>
<head>
  <title>Knowledge Graph Visualization</title>
  <script type="text/javascript" src="https://unpkg.com/vis-network/standalone/umd/vis-network.min.js"></script>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
      margin: 0;
      padding: 20px;
      background-color: #f5f5f5;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      padding: 20px;
    }

    .header {
      margin-bottom: 20px;
    }

    h1 {
      color: #333;
      margin: 0 0 10px 0;
    }

    .controls {
      margin-bottom: 20px;
      padding: 15px;
      background-color: #f8f9fa;
      border-radius: 4px;
      display: flex;
      gap: 15px;
      align-items: center;
    }

    .control-group {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    label {
      font-weight: 500;
      color: #555;
    }

    select, input {
      padding: 6px 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
    }

    button {
      padding: 8px 15px;
      background-color: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    }

    button:hover {
      background-color: #0056b3;
    }

    #graph {
      width: 100%;
      height: 600px;
      border: 1px solid #ddd;
      border-radius: 4px;
    }

    .legend {
      margin-top: 20px;
      padding: 15px;
      background-color: #f8f9fa;
      border-radius: 4px;
    }

    .legend-item {
      display: inline-flex;
      align-items: center;
      margin-right: 20px;
      margin-bottom: 10px;
    }

    .legend-color {
      width: 20px;
      height: 20px;
      border-radius: 4px;
      margin-right: 8px;
    }

    .stats {
      margin-top: 20px;
      padding: 15px;
      background-color: #f8f9fa;
      border-radius: 4px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-top: 10px;
    }

    .stat-item {
      padding: 10px;
      background-color: white;
      border-radius: 4px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .stat-label {
      font-size: 12px;
      color: #666;
      margin-bottom: 5px;
    }

    .stat-value {
      font-size: 18px;
      font-weight: 500;
      color: #333;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Knowledge Graph Visualization</h1>
    </div>

    <div class="controls">
      <div class="control-group">
        <label for="layout">Layout:</label>
        <select id="layout">
          <option value="standard">Standard</option>
          <option value="hierarchical">Hierarchical</option>
          <option value="circular">Circular</option>
        </select>
      </div>

      <div class="control-group">
        <label for="physics">Physics:</label>
        <input type="checkbox" id="physics" checked>
      </div>

      <div class="control-group">
        <button id="zoomFit">Fit View</button>
        <button id="centerGraph">Center</button>
      </div>
    </div>

    <div id="graph"></div>

    <div class="legend">
      <h3>Node Types</h3>
      <div id="nodeLegend"></div>
    </div>

    <div class="stats">
      <h3>Graph Statistics</h3>
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-label">Total Nodes</div>
          <div class="stat-value" id="nodeCount">-</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">Total Relationships</div>
          <div class="stat-value" id="edgeCount">-</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">Node Types</div>
          <div class="stat-value" id="nodeTypes">-</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">Relationship Types</div>
          <div class="stat-value" id="edgeTypes">-</div>
        </div>
      </div>
    </div>
  </div>

  <script>
    // Network configuration
    const container = document.getElementById('graph');
    let network = null;

    // Node colors (same as in GraphVisualizer)
    const nodeColors = {
      person: '#AED6F1',
      organization: '#F5B7B1',
      location: '#A2D9CE',
      project: '#D7BDE2',
      technology: '#FAD7A0',
      default: '#F2F3F4'
    };

    // Create legend
    const legendDiv = document.getElementById('nodeLegend');
    Object.entries(nodeColors).forEach(([type, color]) => {
      const item = document.createElement('div');
      item.className = 'legend-item';
      item.innerHTML = \`
        <div class="legend-color" style="background-color: \${color}"></div>
        <div>\${type.charAt(0).toUpperCase() + type.slice(1)}</div>
      \`;
      legendDiv.appendChild(item);
    });

    // Initialize the network
    function initNetwork(nodes, edges) {
      const data = { nodes, edges };
      const options = {
        nodes: {
          shape: 'box',
          font: {
            size: 14
          },
          borderWidth: 2,
          shadow: true
        },
        edges: {
          arrows: 'to',
          font: {
            size: 12,
            align: 'middle'
          },
          color: {
            color: '#666',
            highlight: '#000'
          },
          smooth: {
            type: 'continuous'
          }
        },
        physics: {
          enabled: true,
          solver: 'forceAtlas2Based',
          forceAtlas2Based: {
            gravitationalConstant: -50,
            springLength: 200
          },
          stabilization: {
            iterations: 200
          }
        },
        interaction: {
          hover: true,
          tooltipDelay: 300,
          zoomView: true,
          dragView: true
        }
      };

      network = new vis.Network(container, data, options);
      
      // Update statistics
      document.getElementById('nodeCount').textContent = nodes.length;
      document.getElementById('edgeCount').textContent = edges.length;
      document.getElementById('nodeTypes').textContent = new Set(nodes.map(n => n.group)).size;
      document.getElementById('edgeTypes').textContent = new Set(edges.map(e => e.label)).size;

      // Event listeners
      document.getElementById('layout').addEventListener('change', (e) => {
        const layout = e.target.value;
        if (layout === 'hierarchical') {
          network.setOptions({ layout: { hierarchical: { enabled: true, direction: 'LR' } } });
        } else if (layout === 'circular') {
          network.setOptions({ layout: { hierarchical: { enabled: false } } });
          network.once('stabilized', () => {
            const positions = network.getPositions();
            const nodeIds = Object.keys(positions);
            const radius = 300;
            const angle = (2 * Math.PI) / nodeIds.length;
            nodeIds.forEach((id, index) => {
              const x = radius * Math.cos(angle * index);
              const y = radius * Math.sin(angle * index);
              network.moveNode(id, x, y);
            });
          });
        } else {
          network.setOptions({ layout: { hierarchical: { enabled: false } } });
        }
      });

      document.getElementById('physics').addEventListener('change', (e) => {
        network.setOptions({ physics: { enabled: e.target.checked } });
      });

      document.getElementById('zoomFit').addEventListener('click', () => {
        network.fit();
      });

      document.getElementById('centerGraph').addEventListener('click', () => {
        network.moveTo({ position: { x: 0, y: 0 } });
      });
    }

    // Initialize with the provided data
    initNetwork(NODES, EDGES);
  </script>
</body>
</html>
`;
