import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('pets', (table: Knex.TableBuilder) => {
    table.string('name').primary();
    table.string('display_name');
    table.string('emoji');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.table('pets', table => {
    table.dropColumn('name');
    table.string('display_name');
    table.dropColumn('emoji');
  });
}
