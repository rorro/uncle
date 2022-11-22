import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('scheduled_messages', (table: Knex.TableBuilder) => {
    table.increments('id').primary();
    table.string('message');
    table.string('date');
    table.string('channel');
    table.integer('type');
  });
}

export async function down(knex: Knex): Promise<void> {}
