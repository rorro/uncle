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

  // Scheduled Messages
  async insertScheduledMessage(
    entry: ScheduledMessageEntry | undefined
  ): Promise<{ newId: number } | undefined> {
    if (!entry) return;

    const { id, message, date, channel, type } = entry;

    if (id && id >= 1) {
      // Editing an existing scheduled message
      try {
        const messageId: { id: number }[] = await this.db('scheduled_messages')
          .update({ message, date, channel, type })
          .where('id', id)
          .returning('id');

        return messageId ? { newId: messageId[0].id } : { newId: -1 };
      } catch (e) {
        return { newId: -1 };
      }
    } else {
      const messageId: { id: number }[] = await this.db('scheduled_messages')
        .insert({ message, date, channel, type })
        .returning('id');

      return messageId ? { newId: messageId[0].id } : { newId: -1 };
    }
  }

  async deleteScheduledMessage(id: number | undefined) {
    if (!id) return;

    await this.db('scheduled_messages').where('id', id).delete();
  }

  async getAllScheduledMessages(): Promise<ScheduledMessageEntry[]> {
    const messages = await this.db('scheduled_messages');
    return messages;
  }

  // Pets and Speeds
  async getPetsLeaderboard(): Promise<PetLeaderboardEntry[]> {
    return await this.db('pets_leaderboard');
  }

  async getSpeedsLeaderboard(): Promise<SpeedsLeaderboardEntry[]> {
    return await this.db('speeds_leaderboard');
  }

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
