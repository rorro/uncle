import Database from 'better-sqlite3';
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

class DatabaseService {
  private db: Database.Database;

  constructor() {
    this.db = new Database(`${__dirname}/../../.database.sqlite3`);
    this.db.pragma('journal_mode = WAL');
  }

  // Configs
  public getConfigItem(configItem: string): string | number | null {
    const stmt = this.db.prepare(`SELECT ${configItem} FROM configs where guild_id = ?`);
    const result = stmt.get(config.guild.id) as Record<string, any>;

    return result && configItem in result ? result[configItem] : null;
  }

  public updateConfig(configKey: string, configValue: string): void {
    const stmt = this.db.prepare(`UPDATE configs SET ${configKey} = ? WHERE guild_id = ?`);
    stmt.run(configValue, config.guild.id);
  }

  public getEmbedConfigs(): EmbedConfigs {
    const stmt = this.db.prepare(
      'SELECT application_embed, support_embed FROM configs where guild_id = ?'
    );
    const result = stmt.get(config.guild.id) as EmbedConfigs;

    return result;
  }

  public getAllConfigs(): ConfigEntry {
    const stmt = this.db.prepare(
      'SELECT \
      new_members_channel, \
      leaderboard_channel, \
      transcripts_channel, \
      welcome_base_message, \
      welcome_success_message, \
      welcome_error_message, \
      welcome_pm_message, \
      inactivity_check_channel, \
      logs_channel \
      FROM configs where guild_id = ?'
    );
    const result = stmt.get(config.guild.id) as ConfigEntry;

    return result;
  }

  // Embeds
  public updateEmbed(embedData: EmbedConfigData): void {
    const { name, data } = embedData;
    const stmt = this.db.prepare(`UPDATE configs SET ${name} = ? WHERE guild_id = ?`);
    stmt.run(data, config.guild.id);
  }

  // Messages
  public getAllMessages(): MessageEntry[] {
    const stmt = this.db.prepare('SELECT * FROM messages');
    const result = stmt.all() as MessageEntry[];

    return result;
  }

  public insertIntoMessages(name: string, message_id: string, channel: string, type: MessageType): void {
    const stmt = this.db.prepare(
      'INSERT INTO messages (name, message_id, channel, type) \
    VALUES (?, ?, ?, ?) \
    ON CONFLICT(name) DO UPDATE SET \
    message_id = excluded.message_id, channel = excluded.channel, type = excluded.type'
    );
    stmt.run(name, message_id, channel, type);
    console.log('new insert into messages');
  }

  public getMessageIdByName(name: string): string | undefined {
    const stmt = this.db.prepare('SELECT message_id FROM messages WHERE name = ?');
    const result = stmt.get(name) as Record<string, any>;

    return result && 'message_id' in result ? result.message_id : undefined;
  }

  public getMessagesByType(type: MessageType): MessageEntry[] {
    const stmt = this.db.prepare('SELECT * FROM messages WHERE type = ?');
    const result = stmt.all(type) as MessageEntry[];

    return result;
  }

  public deleteFromMessages(options: { name?: string; type?: MessageType }): void {
    const { name, type } = options;
    if (name) {
      const stmt = this.db.prepare('DELETE FROM messages WHERE name = ?');
      stmt.run(name);
    } else if (type) {
      const stmt = this.db.prepare('DELETE FROM messages WHERE type = ?');
      stmt.run(type);
    }
  }

  // Oauth
  public insertOauthData(data: OauthData): void {
    const stmt = this.db.prepare(
      'INSERT INTO auth_data (access_token, user, refresh_token, expires_in, date, token_type, scope) \
    VALUES (?, ?, ?, ?, ?, ?, ?) \
    ON CONFLICT(access_token) DO UPDATE SET \
    user=excluded.user, refresh_token = excluded.refresh_token, expires_in = excluded.expires_in, \
    date = excluded.date, token_type = excluded.token_type, scope = excluded.scope'
    );

    stmt.run(
      data.access_token,
      data.user,
      data.refresh_token,
      data.expires_in,
      data.date,
      data.token_type,
      data.scope
    );
  }

  public deleteFromOuathData(access_token: string): void {
    const stmt = this.db.prepare('DELETE FROM auth_data WHERE access_token = ?');
    stmt.run(access_token);
  }

  public getAccessTokens(): { access_token: string }[] {
    const stmt = this.db.prepare('SELECT access_token FROM auth_data');
    const result = stmt.all() as { access_token: string }[];

    return result;
  }

  public getOauthData(access_token: string): OauthData {
    const stmt = this.db.prepare('SELECT * FROM auth_data WHERE access_token = ?');
    const result = stmt.all(access_token) as OauthData[];

    return result[0];
  }

  // Channels
  public getOpenChannel(
    user_id: string,
    table: string
  ): { user: User; channel: TextChannel } | undefined {
    const stmt = this.db.prepare(`SELECT user, channel FROM ${table} WHERE user_id = ?`);
    const result = stmt.all(user_id) as { user: string; channel: string }[];
    if (result.length > 0) {
      const user: User = JSON.parse(result[0].user);
      const channel: TextChannel = JSON.parse(result[0].channel);

      return { user, channel };
    }

    return;
  }

  public getOpenChannelUser(
    channel_id: string,
    table: string
  ): { user: User; channel: TextChannel } | undefined {
    const stmt = this.db.prepare(`SELECT user, channel FROM ${table}`);
    const result = stmt.all() as { user: string; channel: string }[];

    if (result.length < 1) return;

    return result
      .map(r => {
        return { user: JSON.parse(r.user), channel: JSON.parse(r.channel) };
      })
      .filter(a => {
        return a.channel.id === channel_id;
      })[0];
  }

  public insertIntoOpenChannels(user_id: string, user: string, channel: string, table: string): void {
    const stmt = this.db.prepare(`INSERT INTO ${table} (user_id, user, channel) VALUES (?, ?, ?)`);

    stmt.run(user_id, user, channel);
  }

  public deleteFromOpenChannels(user_id: string, channel_id: string, table: string): void {
    const rows = this.db.prepare(`SELECT id, channel FROM ${table} WHERE user_id = ?`).all(user_id) as [
      { id: string; channel: string }
    ];

    for (const row of rows) {
      const channel = JSON.parse(row.channel);
      if (channel.id === channel_id) {
        this.db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(row.id);
        break;
      }
    }
  }

  // Scheduled Messages
  public insertScheduledMessage(entry: ScheduledMessageEntry | undefined): number | undefined {
    if (!entry) return;

    const { id, message, date, channel, type } = entry;

    if (id && id >= 1) {
      // Editing an existing scheduled message
      try {
        this.db
          .prepare(
            'UPDATE scheduled_messages SET message = ?, date = ?, channel = ?, type = ? WHERE id = ?'
          )
          .run(message, date, channel, type, id);

        return id;
      } catch (e) {
        return -1;
      }
    } else {
      const runResult = this.db
        .prepare('INSERT INTO scheduled_messages (message, date, channel, type) VALUES (?, ?, ?, ?)')
        .run(message, date, channel, type);

      return runResult.lastInsertRowid as number;
    }
  }

  public deleteScheduledMessage(id: number | undefined): void {
    if (!id) return;

    this.db.prepare('DELETE FROM scheduled_messages WHERE id = ?').run(id);
  }

  public getAllScheduledMessages(): ScheduledMessageEntry[] {
    const stmt = this.db.prepare('SELECT * FROM scheduled_messages');
    const result = stmt.all() as ScheduledMessageEntry[];

    return result;
  }

  // Pets and Speeds
  public getPetsLeaderboard(): PetLeaderboardEntry[] {
    const stmt = this.db.prepare('SELECT * FROM pets_leaderboard');
    const result = stmt.all() as PetLeaderboardEntry[];

    return result;
  }

  public getSpeedsLeaderboard(): SpeedsLeaderboardEntry[] {
    const stmt = this.db.prepare('SELECT * FROM speeds_leaderboard');
    const result = stmt.all() as SpeedsLeaderboardEntry[];

    return result;
  }

  public getSpeedBoard(boss: string) {
    const stmt = this.db.prepare('SELECT * FROM speeds_leaderboard WHERE boss = ?');
    const result = stmt.all(boss) as SpeedsLeaderboardEntry[];

    return result;
  }
}

const db = new DatabaseService();
export default db;
