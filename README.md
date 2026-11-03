# Cricket Routes: Express Routes & JSON

**Author:** Amar Jadhav

An Express server with three cricket routes that return JSON. They show plain routes, route parameters (`req.params`) and query strings (`req.query`).

## Routes

| Method | Route | What it returns |
|---|---|---|
| GET | `/team` | My favourite team and its captain |
| GET | `/player/:name` | A cheer for the player named in the URL |
| GET | `/run-rate?runs=180&overs=20` | The run rate (runs per over), rounded to 2 decimals |

### Validation
- `/run-rate` returns **400** with a JSON error if `runs` or `overs` is missing, `runs` is not a whole number, `overs` is `0`, or `overs` is not valid cricket notation.
- `overs` uses cricket notation: `19.4` means 19 overs and 4 balls (19.67 overs), so `.6` and above are rejected.
- `/player/:name` returns **400** for a blank name.
- Unknown routes return a JSON **404**.

All requests and responses are in [REVIEW.md](REVIEW.md).

## Setup and run

Requires Node.js 22 or later.

```bash
npm install
npm start          # or: node server.js
```

Then try it:

```bash
curl http://localhost:3000/team
curl http://localhost:3000/player/Virat
curl "http://localhost:3000/run-rate?runs=180&overs=20"
```

Use `PORT=4000 npm start` to run on another port.

## What I learned
- Creating routes with `app.get` and sending JSON with `res.json`
- Reading route parameters with `req.params`
- Reading query strings with `req.query` and validating them
- Sending the right status codes (200, 400, 404) with clear error messages
