const knex = require('knex')({
    client: 'pg',
    connection: {
        host: 'localhost',
        user: 'postgres',
        password: 'localhost',
        database: 'api_profile'
    }
});

module.exports = knex;