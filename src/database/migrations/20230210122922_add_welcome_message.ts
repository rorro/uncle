import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.table('configs', table => {
    table.string('welcome_base_message', 128);
    table.string('welcome_success_message', 128);
    table.string('welcome_error_message', 128);
    table.string('welcome_pm_message', 128);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.table('configs', table => {
    table.dropColumn('welcome_base_message');
    table.dropColumn('welcome_success_message');
    table.dropColumn('welcome_error_message');
    table.dropColumn('welcome_pm_message');
  });
}
