import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('auth_data', (table: Knex.TableBuilder) => {
    table.string('access_token').primary().notNullable().unique();
    table.string('user').notNullable();
    table.string('refresh_token').notNullable();
    table.integer('expires_in').notNullable();
    table.integer('date').notNullable();
    table.string('token_type').notNullable();
    table.string('scope').notNullable();
  });
}

export async function down(knex: Knex): Promise<void> {}
