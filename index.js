require('babel-core/register');
require('babel-polyfill');

const express = require('express');
const app = express();
const routes = require('./src/routes.js');

module.exports = app;

app.listen(3100, () => {
  console.log('Example app listening on port 3100!');
})

routes(app);

process.on('SIGTERM', function () {
  server.close(function () {
    process.exit(0);
  });
});
