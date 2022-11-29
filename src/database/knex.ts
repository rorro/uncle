import knex, { Knex } from 'knex';
import knexfile from './knexfile';
import config from '../config';
import {
  ConfigEntry,
  MessageEntry,
  MessageType,
  OauthData,
  ScheduledMessageEntry,
  ScheduledMessageType
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
      // Object.entries(configEntry).map(([key, value]) => {});
    } else {
      // await this.db('configs').where('guild_id', config.guild.id).update(configKey: configValue);

      const query = `UPDATE configs SET ${configKey} = '${configValue}' WHERE guild_id=${config.guild.id}`;
      console.log(query);

      await this.db.raw(query);
    }
  }

  async getConfigItem(configItem: string): Promise<string | number | null> {
    const result: ConfigEntry = (await this.db('configs'))[0];
    return result[configItem as keyof ConfigEntry];
  }

  async getAllConfigs(): Promise<ConfigEntry> {
    return (
      await this.db('configs').select(
        'new_members_channel',
        'assign_roles_channel',
        'rules_channel',
        'diary_channel',
        'leaderboard_channel',
        'transcripts_channel',
        'clan_icon',
        'requirements_image',
        'diary_top10_message'
      )
    )[0];
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
    console.log(`args: ${user_id}, ${table}`);

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
    return await this.db(table).insert({ user_id, user, channel }, 'id').onConflict('user_id').merge();
  }

  async deleteFromOpenChannels(user_id: string, table: string) {
    await this.db(table).where('user_id', user_id).delete();
  }

  // Scheduled Messages
  async insertScheduledMessage(entry: ScheduledMessageEntry) {
    const { id, message, date, channel, type } = entry;
    if (id) {
      // Editing an existing scheduled message
      console.log(`Editing existing scheduled message: ${id}`);

      await this.db('scheduled_messages').update({ message, date, channel, type }).where('id', id);
    } else {
      console.log(`Inserting new scheduled message`);
      console.log(entry);

      await this.db('scheduled_messages').insert({ message, date, channel, type });
    }
  }

  async deleteScheduledMessage(id: number) {
    await this.db('scheduled_messages').where('id', id).delete();
  }

  async getAllScheduledMessages(): Promise<ScheduledMessageEntry[]> {
    const messages = await this.db('scheduled_messages');
    return messages;
  }
}

export default new KnexDB();
