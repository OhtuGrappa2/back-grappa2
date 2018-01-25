const config = require('./knexfile.js');

const env = process.env.NODE_ENV ? process.env.NODE_ENV : 'not working';
console.log('ENVIRONMENT IS', env);

const knex = require('knex')(config[env]);

if (env !== 'test') {
    knex.migrate.latest().then((msg) => {
        console.log('KNEX MIGRATE SUCCESS', msg);
    }).catch((err) => {
        console.log('KNEX MIGRATE FAILURE', err);
    });
}

module.exports = knex;
