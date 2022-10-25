import knex from 'knex';
import config from './config';

const knexDB = knex(config);

export default knexDB;
