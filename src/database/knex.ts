import knex, { Knex } from 'knex';
import knexfile from './knexfile';
import config from '../config';
import {
  ConfigEntry,
  EmbedConfigData,
  EmbedConfigs,
  MessageEntry,
  MessageType,
  OauthData,
  PetLeaderboardEntry,
  ScheduledMessageEntry,
  SpeedsLeaderboardEntry
} from '../types';
import { TextChannel, User } from 'discord.js';

class KnexDB {
  private db: Knex<any, unknown[]>;

  constructor() {
    this.db = knex(knexfile);
  }

  // Pets and Speeds
  async truncateAndInsert<T>(data: T[]): Promise<string> {
    try {
      await this.db.transaction(async trx => {
        const newDataWithoutId = data.map(d => {
          const { id, ...dataWithoutId } = d as any;
          return dataWithoutId;
        });

        const tableName = this.getTableName<T>(data[0]);

        await trx(tableName).truncate();
        await trx(tableName).insert(newDataWithoutId);
        await trx.commit();
      });

      return `Successfully saved the leaderboard.`;
    } catch (error) {
      console.log('Error saving leaderboard', error);
      return 'Something went wrong while saving the leaderboard.';
    }
  }

  getTableName<T>(data: T): string {
    if (typeof data === 'object' && data !== null) {
      if ('boss' in data) {
        return 'speeds_leaderboard';
      } else if ('abyssal_sire' in data) {
        return 'pets_leaderboard';
      }
    }
    throw new Error('Unknown interface type');
  }
}

export default new KnexDB();
