// Single shared Knex connection for the whole app (admin CRUD routes,
// eventually DB-backed public product pages). Separate from
// server/db/knexfile.js, which is the CLI-only config knex
// migrate/seed reads - this module is what application code requires.
const path = require('path');
const knexConfig = require('../db/knexfile.js');

module.exports = require('knex')(knexConfig);
