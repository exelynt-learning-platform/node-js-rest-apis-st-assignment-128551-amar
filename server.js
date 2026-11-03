const http = require('node:http');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Chai is ready');
});

// Any other path gets a clear 404 instead of the default HTML page
app.use((req, res) => {
  res.status(404).send('Not found');
});

const server = http.createServer(app);

// Attach the error listener before listening so startup errors are always caught
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Stop the other server or set a different PORT.`);
  } else {
    console.error('Server failed to start:', error.message);
  }
  process.exit(1);
});

server.listen(PORT, () => {
  console.log(`Chai stall server running at http://localhost:${PORT}`);
});
