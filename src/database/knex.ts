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

  // Configs
  async updateConfig(configKey: string, configValue: string, configEntry?: ConfigEntry) {
    if (configEntry) {
      await this.db('configs').update(configEntry).where('guild_id', config.guild.id);
    } else {
      const query = `UPDATE configs SET ${configKey} = '${configValue}' WHERE guild_id=${config.guild.id}`;
      await this.db.raw(query);
    }
  }

  async getConfigItem(configItem: string): Promise<string | number | null> {
    const result: ConfigEntry = (await this.db('configs'))[0];
    return result[configItem as keyof ConfigEntry];
  }

  async getEmbedConfigs(): Promise<EmbedConfigs> {
    return (await this.db('configs').select('application_embed', 'support_embed'))[0];
  }

  async getAllConfigs(): Promise<ConfigEntry> {
    return (
      await this.db('configs').select(
        'new_members_channel',
        'leaderboard_channel',
        'transcripts_channel',
        'welcome_base_message',
        'welcome_pm_message',
        'inactivity_check_channel',
        'logs_channel'
      )
    )[0];
  }

  // Embeds
  async updateEmbed(input: EmbedConfigData): Promise<void> {
    const { name, data } = input;

    try {
      switch (name) {
        case 'application_embed':
          await this.db('configs').update({ application_embed: data });
          break;
        case 'support_embed':
          await this.db('configs').update({ support_embed: data });
          break;
      }
    } catch (e) {
      console.log(e);
    }
  }

  // Messages
  async getAllMessages(): Promise<MessageEntry[]> {
    return await this.db('messages');
  }

  async insertIntoMessages(name: string, message_id: string, channel: string, type: MessageType) {
    await this.db('messages').insert({ name, message_id, channel, type }).onConflict('name').merge();
  }

  async getMessageIdByName(name: string): Promise<string | undefined> {
    const result = await this.db('messages').where('name', name).select('message_id');

    if (result.length > 0) {
      return result[0].message_id;
    }
    return;
  }

  async getMessagesByType(type: MessageType): Promise<MessageEntry[]> {
    return await this.db('messages').where('type', type);
  }

  async deleteFromMessages(options: { name?: string; type?: MessageType }) {
    const { name, type } = options;
    if (name) {
      await this.db('messages').where('name', name).delete();
    } else if (type) {
      await this.db('messages').where('type', type).delete();
    }
  }

  // Oauth
  async insertOauthData(data: OauthData) {
    await this.db('auth_data').insert(data).onConflict('access_token').merge();
  }

  async deleteFromOuathData(access_token: string) {
    await this.db('auth_data').where('access_token', access_token).delete();
  }

  async getAccessTokens(): Promise<{ access_token: string }[]> {
    return await this.db('auth_data').select('access_token');
  }

  async getOauthData(access_token: string): Promise<OauthData[]> {
    return await this.db('auth_data').where('access_token', access_token);
  }

  // Channels
  async insertIntoChannels(channel: string, channel_id: string) {
    await this.db('channels').insert({ channel, channel_id }).onConflict('channel').merge();
  }

  async getOpenChannel(
    user_id: string,
    table: string
  ): Promise<{ user: User; channel: TextChannel } | undefined> {
    const result = await this.db(table).where('user_id', user_id).select('user', 'channel');

    if (result.length > 0) {
      const user: User = JSON.parse(result[0].user);
      const channel: TextChannel = JSON.parse(result[0].channel);

      return { user, channel };
    }
    return;
  }

  async getOpenChannelUser(
    channel_id: string,
    table: string
  ): Promise<{ user: User; channel: TextChannel } | undefined> {
    const result = await this.db(table).select('user', 'channel');

    if (result.length < 1) return;

    return result
      .map(r => {
        return { user: JSON.parse(r.user), channel: JSON.parse(r.channel) };
      })
      .filter(a => {
        return a.channel.id === channel_id;
      })[0];
  }

  async insertIntoOpenChannels(user_id: string, user: string, channel: string, table: string) {
    return await this.db(table).insert({ user_id, user, channel }, 'id');
  }

  async deleteFromOpenChannels(user_id: string, channel_id: string, table: string) {
    const rows = await this.db(table).select('id', 'channel').where('user_id', user_id);

    for (const row of rows) {
      const channel = JSON.parse(row.channel);
      if (channel.id === channel_id) {
        await this.db(table).where('id', row.id).delete();
        break;
      }
    }
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
