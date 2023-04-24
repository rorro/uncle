import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.table('configs', table => {
    table.string('application_embed');
    table.string('support_embed');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.table('configs', table => {
    table.dropColumn('application_embed');
    table.dropColumn('support_embed');
  });
}
