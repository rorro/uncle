import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('open_support_tickets', (table: Knex.TableBuilder) => {
    table.increments('id').primary();
    table.string('user_id').notNullable().unique();
    table.string('channel_id').notNullable().unique();
  });
}

export async function down(knex: Knex): Promise<void> {}
