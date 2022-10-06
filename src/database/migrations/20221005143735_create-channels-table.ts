import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('channels', (table: Knex.TableBuilder) => {
    table.increments('id').primary();
    table.string('channel').notNullable().unique();
    table.string('channel_id').notNullable();
  });
}

export async function down(knex: Knex): Promise<void> {}
