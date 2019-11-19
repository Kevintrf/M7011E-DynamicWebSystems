const express = require('express');

const app = express();

app.use(express.json());

const hostname = '127.0.0.1';
const port = 3000;


/*
        -här vill vi skicka json ist för http-
const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Goodbye World\n');
});
*/

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});