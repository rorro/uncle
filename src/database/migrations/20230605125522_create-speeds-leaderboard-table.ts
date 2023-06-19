import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('speeds_leaderboard', (table: Knex.TableBuilder) => {
    table.increments('id').primary();
    table.string('username').defaultTo(null);
    table.string('boss').defaultTo(null);
    table.string('category').defaultTo(null);
    table.string('time').defaultTo(null);
    table.boolean('removed').defaultTo(false);
  });
}

export async function down(knex: Knex): Promise<void> {}
