#!/usr/bin/env bash
# One curl command for every route of the job applications API.
# 1. Start the server first: npm start
# 2. Then run:               bash requests.sh
# Use another address with:  BASE_URL=http://localhost:4000 bash requests.sh

BASE_URL="${BASE_URL:-http://localhost:3000}"
SHOW_STATUS="\nStatus: %{http_code}\n\n"

echo "1. GET /applications - list all applications"
curl -s -w "$SHOW_STATUS" "$BASE_URL/applications"

echo "2. GET /applications/1 - get one application"
curl -s -w "$SHOW_STATUS" "$BASE_URL/applications/1"

echo "3. POST /applications - create an application (201)"
curl -s -w "$SHOW_STATUS" -X POST "$BASE_URL/applications" \
  -H "Content-Type: application/json" \
  -d '{"company":"Freshworks","role":"API Developer Intern"}'

echo "4. PUT /applications/1 - move application 1 to the interview stage"
curl -s -w "$SHOW_STATUS" -X PUT "$BASE_URL/applications/1" \
  -H "Content-Type: application/json" \
  -d '{"status":"interview"}'

echo "5. DELETE /applications/2 - delete application 2"
curl -s -w "$SHOW_STATUS" -X DELETE "$BASE_URL/applications/2"

echo "6. GET /applications/999 - missing id (404)"
curl -s -w "$SHOW_STATUS" "$BASE_URL/applications/999"

echo "7. POST /applications with an empty company (400)"
curl -s -w "$SHOW_STATUS" -X POST "$BASE_URL/applications" \
  -H "Content-Type: application/json" \
  -d '{"company":"","role":"Intern"}'
