import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('messages', (table: Knex.TableBuilder) => {
    table.increments('id').primary();
    table.string('name').notNullable().unique();
    table.string('message_id').notNullable().unique();
    table.integer('type').notNullable();
  });
}

export async function down(knex: Knex): Promise<void> {}
