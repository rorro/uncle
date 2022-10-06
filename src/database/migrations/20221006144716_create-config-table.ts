import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('config', (table: Knex.TableBuilder) => {
    table.increments('id').primary();
    table.string('config_key').notNullable().unique();
    table.string('config_value').notNullable();
  });
}

export async function down(knex: Knex): Promise<void> {}
