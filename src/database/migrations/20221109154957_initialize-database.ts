import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('configs', (table: Knex.TableBuilder) => {
    table.increments('id').primary();
    table.string('guild_id').defaultTo(null);
    table.string('new_members_channel').defaultTo(null);
    table.string('assign_roles_channel').defaultTo(null);
    table.string('rules_channel').defaultTo(null);
    table.string('diary_channel').defaultTo(null);
    table.string('leaderboard_channel').defaultTo(null);
    table.string('transcripts_channel').defaultTo(null);
    table.string('clan_icon').defaultTo(null);
    table.string('requirements_image').defaultTo(null);
    table.string('diary_top10_message').defaultTo(null);
    table.integer('channels_count').notNullable().defaultTo(0);
  });
}

export async function down(knex: Knex): Promise<void> {}
