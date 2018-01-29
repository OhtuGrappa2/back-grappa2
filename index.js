require('dotenv').config();

require('babel-core/register');
require('babel-polyfill');

const express = require('express');

const app = express();
const logger = require('./src/util/logger');
const gracefulExit = require('express-graceful-exit');
const routes = require('./src/routes.js');
const session = require('express-session');
const KnexSessionStore = require('connect-session-knex')(session);
const knex = require('./src/db/connection.js');
const server = require('http').createServer(app);
const errorHandler = require('./src/util/errorHandler');

const store = new KnexSessionStore({
    knex,
    tablename: 'sessions' // optional. Defaults to 'sessions'
});

module.exports = app;

app.listen(3100, () => {
    logger.info('Grappa app listening on port 3100!');
});

app.use(gracefulExit.middleware(app));
app.use(session({
    secret: 'keyboard cat',
    cookie: { maxAge: 6000000 },
    store,
    resave: false,
    saveUninitialized: false
}));

routes(app);

app.use(errorHandler);
app.disable('x-powered-by');

process.on('unhandledRejection', (reason, p) => {
    logger.error('Unhandled Rejection at: Promise', { promise: p, reason, stack: reason.stack });
    // application specific logging, throwing an error, or other logic here
});

process.on('SIGTERM', () => {
    gracefulExit.gracefulExitHandler(app, server, {
        socketio: app.settings.socketio
    });
});
