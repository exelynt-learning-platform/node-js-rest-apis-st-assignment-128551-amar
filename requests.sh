#!/usr/bin/env bash
# One curl command for each of the five Tasks API routes.
# Start the server first (npm start), then run: bash requests.sh
# Use another address with: BASE_URL=http://localhost:4000 bash requests.sh

BASE_URL="${BASE_URL:-http://localhost:3000}"

echo "1. GET /tasks - list all tasks"
curl -s -w "\nStatus: %{http_code}\n\n" "$BASE_URL/tasks"

echo "2. POST /tasks - create a task"
curl -s -w "\nStatus: %{http_code}\n\n" -X POST "$BASE_URL/tasks" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test the API with requests.sh"}'

echo "3. GET /tasks/1 - get one task"
curl -s -w "\nStatus: %{http_code}\n\n" "$BASE_URL/tasks/1"

echo "4. PUT /tasks/1 - mark task 1 as done"
curl -s -w "\nStatus: %{http_code}\n\n" -X PUT "$BASE_URL/tasks/1" \
  -H "Content-Type: application/json" \
  -d '{"done":true}'

echo "5. DELETE /tasks/2 - delete task 2"
curl -s -w "\nStatus: %{http_code}\n\n" -X DELETE "$BASE_URL/tasks/2"
