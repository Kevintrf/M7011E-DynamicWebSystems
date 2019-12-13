const express = require('express');
const APIroutes = require('./routes')
const app = express();

app.use(express.json());

const hostname = '127.0.0.1';
const port = 3000;

app.get('/', (req, res) => {
  res.send('Hello frontpage + nodemontest');
});


app.use('/api/test', APIroutes);

app.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});