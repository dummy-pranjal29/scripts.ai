import express from 'express';
import { resolve } from 'path';
import fs from 'fs';
import chokidar from 'chokidar';
import { fileURLToPath } from 'url';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, '..');

const app = express();
const port = 3010;

// Track current content files
let currentContent = {
  html: fs.readFileSync(resolve(__dirname, 'pages/index.html'), 'utf8'),
  css: fs.readFileSync(resolve(__dirname, 'static/style.css'), 'utf8')
};

// Store connected EventSource clients
let connectedClients = new Set();

// Notify all connected clients of file changes
const notifyClients = () => {
  console.log(`Notifying ${connectedClients.size} connected clients of file change`);
  connectedClients.forEach(client => {
    try {
      client.write('data: file-changed\n\n');
      client.write('event: refresh\n\n');
    } catch (error) {
      console.error('Error notifying client:', error);
    }
  });
};

app.use(express.static('static'));

// Serve the main HTML file with live reload script
app.get('/', (req, res) => {
  const htmlContent = currentContent.html.replace(
    '</head>',
    `
    <script>
      const eventSource = new EventSource('/api/content');
      
      eventSource.onmessage = (event) => {
        if (event.data === 'refresh') {
          window.location.reload();
        }
      };
      
      eventSource.onerror = (error) => {
        console.error('EventSource failed:', error);
      };
      
      eventSource.onopen = () => {
        console.log('EventSource connected');
      };
    </script>
    </head>`
  );
  
  res.setHeader('Content-Type', 'text/html');
  res.send(htmlContent);
});

// API endpoint to get current content
app.get('/api/content', (req, res) => {
  res.json(currentContent);
});

// API endpoint to update content (for live reload)
app.post('/api/content', express.json({ type: '*/*' }), (req, res) => {
  try {
    currentContent = req.body;
    console.log('Content updated:', currentContent);
    
    // Notify all connected clients to refresh
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    res.write('data: update\n\n');
    res.write(`event: content-updated\n`);
    res.write(`data: ${JSON.stringify(currentContent)}\n\n`);
    
    // Trigger refresh for all clients
    notifyClients();
    
    res.end();
  } catch (error) {
    console.error('Error updating content:', error);
    res.status(500).json({ error: 'Failed to update content' });
  }
});

// Handle EventSource connections for live reload
app.get('/api/content', (req, res) => {
  // Handle EventSource connections
  if (req.headers.accept && req.headers.accept.includes('text/event-stream')) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    // Add client to connected list
    const clientId = Date.now().toString();
    connectedClients.add(clientId);
    
    // Send initial connection message
    res.write(`data: connected\n\n`);
    res.write(`event: client-connected\n\n`);
    res.write(`data: ${JSON.stringify({ clientId })}\n\n`);
    
    // Handle client disconnect
    req.on('close', () => {
      connectedClients.delete(clientId);
      console.log(`Client ${clientId} disconnected`);
    });
    
    // Keep connection alive
    const heartbeat = setInterval(() => {
      try {
        res.write(': keepalive\n\n');
      } catch (error) {
        clearInterval(heartbeat);
      }
    }, 30000);
    
    req.on('close', () => {
      clearInterval(heartbeat);
      connectedClients.delete(clientId);
    });
  } else {
    // Regular JSON request for content
    res.json(currentContent);
  }
});

// Write updated content to files
const updateFiles = (content) => {
  if (content.html) {
    fs.writeFileSync(resolve(__dirname, 'pages/index.html'), content.html);
    currentContent.html = content.html;
  }
  if (content.css) {
    fs.writeFileSync(resolve(__dirname, 'static/style.css'), content.css);
    currentContent.css = content.css;
  }
};

// Watch for file changes (for development)
if (process.env.NODE_ENV !== 'production') {
  try {
    
  const watcher = chokidar.watch([
    resolve(__dirname, 'pages/index.html'),
    resolve(__dirname, 'static/style.css')
  ]);

  watcher.on('change', (filename) => {
    console.log(`File changed: ${filename}`);
    // Re-read and update current content
    if (filename.endsWith('index.html')) {
      currentContent.html = fs.readFileSync(resolve(__dirname, 'pages/index.html'), 'utf8');
    }
    if (filename.endsWith('style.css')) {
      currentContent.css = fs.readFileSync(resolve(__dirname, 'static/style.css'), 'utf8');
    }
    // Notify all connected clients immediately
    notifyClients();
  });

  watcher.on('error', (error) => {
    console.error('Watcher error:', error);
  });
  } catch (error) {
    console.error('Failed to setup file watcher:', error);
  }
}

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
