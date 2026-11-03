# node-api-starter: Hello Node, Chai Stall

**Author:** Amar Jadhav

My first Node.js project for the Node.js & REST APIs Starter course: a script that prints chai stall details, and an Express server that answers `GET /`.

## Node version

```
$ node -v
v24.15.0
```

The course asks for Node.js 22 or later. `package.json` declares `"engines": { "node": ">=22" }`.

## Files
- `hello.js`: prints the chai stall name and its opening time with `console.log`
- `server.js`: an Express server on port 3000 that replies `Chai is ready` to `GET /`, and sends a 404 for any other path
- `package.json`: created with `npm init -y`, lists Express as a dependency

## Setup and run

```bash
npm install        # install Express
node hello.js      # or: npm run hello
node server.js     # or: npm start
```

Output of `node hello.js`:

```
Welcome to Amar Chai Stall!
We open every day at 7:00 AM.
```

Test the server in another terminal:

```bash
curl http://localhost:3000/
# Chai is ready
```

If port 3000 is busy, run on another port: `PORT=4000 node server.js`.

## What I learned
- Running JavaScript files from the terminal with `node`
- Creating a project with `npm init -y` and installing packages with npm
- Writing a basic Express server with `app.get` and `app.listen`
- Keeping `node_modules` out of Git with `.gitignore`
