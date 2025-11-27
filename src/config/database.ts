import knex, { Knex } from 'knex';
const knexConfig = require('../../knexfile');

const environment = process.env.NODE_ENV || 'production';
const config = knexConfig[environment];

const db: Knex = knex(config);

export default db;