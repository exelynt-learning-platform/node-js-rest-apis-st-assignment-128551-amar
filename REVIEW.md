# REVIEW: Cricket Routes

Requests made with curl against `node server.js` running on http://localhost:3000. Responses are pasted exactly as returned, with the HTTP status code.

## 1. GET /team

```bash
curl "http://localhost:3000/team"
```

Response (`200`):

```json
{"team":"India","captain":"Rohit Sharma"}
```

## 2. GET /player/:name

```bash
curl "http://localhost:3000/player/Virat"
```

Response (`200`):

```json
{"player":"Virat","cheer":"Well played, Virat! The whole stadium is cheering for you!"}
```

```bash
curl "http://localhost:3000/player/Virat%20Kohli"
```

Response (`200`):

```json
{"player":"Virat Kohli","cheer":"Well played, Virat Kohli! The whole stadium is cheering for you!"}
```

## 3. GET /run-rate?runs=180&overs=20

```bash
curl "http://localhost:3000/run-rate?runs=180&overs=20"
```

Response (`200`):

```json
{"runs":180,"overs":"20","runRate":9}
```

## 4. Edge cases

Overs in cricket notation (19.4 = 19 overs and 4 balls):

```bash
curl "http://localhost:3000/run-rate?runs=150&overs=19.4"
```

Response (`200`):

```json
{"runs":150,"overs":"19.4","runRate":7.63}
```

Missing `overs`:

```bash
curl "http://localhost:3000/run-rate?runs=180"
```

Response (`400`):

```json
{"error":"Both runs and overs query parameters are required"}
```

Non-numeric `runs`:

```bash
curl "http://localhost:3000/run-rate?runs=abc&overs=20"
```

Response (`400`):

```json
{"error":"runs must be a whole number of 0 or more"}
```

Zero overs (would divide by zero):

```bash
curl "http://localhost:3000/run-rate?runs=180&overs=0"
```

Response (`400`):

```json
{"error":"overs must be greater than 0"}
```

Invalid overs (an over has only 6 balls):

```bash
curl "http://localhost:3000/run-rate?runs=180&overs=19.7"
```

Response (`400`):

```json
{"error":"overs must be in cricket notation, for example 20 or 19.4"}
```

Blank player name:

```bash
curl "http://localhost:3000/player/%20"
```

Response (`400`):

```json
{"error":"Player name is required"}
```

Unknown route:

```bash
curl "http://localhost:3000/nope"
```

Response (`404`):

```json
{"error":"Route GET /nope not found"}
```

