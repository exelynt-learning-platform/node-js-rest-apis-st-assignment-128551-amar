const http = require('node:http');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

const favouriteTeam = {
  team: 'India',
  captain: 'Rohit Sharma',
};

const BALLS_PER_OVER = 6;

// Converts cricket overs notation (e.g. "19.4" = 19 overs and 4 balls) to a number of overs.
// Returns null when the value is not valid overs notation.
function parseOvers(value) {
  if (!/^\d+(\.[0-5])?$/.test(value)) {
    return null;
  }
  const [completeOvers, extraBalls = '0'] = value.split('.');
  return Number(completeOvers) + Number(extraBalls) / BALLS_PER_OVER;
}

// GET /team - favourite team and its captain
app.get('/team', (req, res) => {
  res.json(favouriteTeam);
});

// GET /player/:name - a cheer for the player in the URL
app.get('/player/:name', (req, res) => {
  const playerName = req.params.name.trim();

  if (!playerName) {
    return res.status(400).json({ error: 'Player name is required' });
  }

  res.json({
    player: playerName,
    cheer: `Well played, ${playerName}! The whole stadium is cheering for you!`,
  });
});

// GET /run-rate?runs=180&overs=20 - runs scored per over
app.get('/run-rate', (req, res) => {
  const { runs, overs } = req.query;

  if (runs === undefined || overs === undefined) {
    return res.status(400).json({ error: 'Both runs and overs query parameters are required' });
  }

  if (!/^\d+$/.test(runs)) {
    return res.status(400).json({ error: 'runs must be a whole number of 0 or more' });
  }

  const oversBowled = parseOvers(overs);

  if (oversBowled === null) {
    return res.status(400).json({ error: 'overs must be in cricket notation, for example 20 or 19.4' });
  }

  if (oversBowled === 0) {
    return res.status(400).json({ error: 'overs must be greater than 0' });
  }

  const runRate = Number((Number(runs) / oversBowled).toFixed(2));

  res.json({
    runs: Number(runs),
    overs,
    runRate,
  });
});

// Unknown routes get a JSON 404
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
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
  console.log(`Cricket API running at http://localhost:${PORT}`);
});
