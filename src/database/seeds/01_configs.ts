import { Knex } from 'knex';
import config from '../../config';

export async function seed(knex: Knex): Promise<void> {
  // Deletes ALL existing entries
  await knex('configs').del();

  // Insert a default row with all values defaulted to null
  await knex('configs').insert([{ guild_id: config.guild.id }]);
}
