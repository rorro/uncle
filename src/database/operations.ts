import Database from 'better-sqlite3';
import config from '../config';
import {
  ConfigEntry,
  EmbedConfigData,
  EmbedConfigs,
  MessageEntry,
  MessageType,
  OauthData
} from '../types';
import { TextChannel, User } from 'discord.js';
import { brotliDecompress } from 'zlib';

const db = new Database(`${__dirname}/../../.database.sqlite3`);
db.pragma('journal_mode = WAL');

// Configs
export function getConfigItem(configItem: string): string | number | null {
  const stmt = db.prepare(`SELECT ${configItem} FROM configs where guild_id = ?`);
  const result = stmt.get(config.guild.id) as Record<string, any>;

  return result && configItem in result ? result[configItem] : null;
}

export function updateConfig(configKey: string, configValue: string): void {
  const stmt = db.prepare(`UPDATE configs SET ${configKey} = ? WHERE guild_id = ?`);
  stmt.run(configValue, config.guild.id);
}

export function getEmbedConfigs(): EmbedConfigs {
  const stmt = db.prepare('SELECT application_embed, support_embed FROM configs where guild_id = ?');
  const result = stmt.get(config.guild.id) as EmbedConfigs;

  return result;
}

export function getAllConfigs(): ConfigEntry {
  const stmt = db.prepare(
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
export function updateEmbed(embedData: EmbedConfigData): void {
  const { name, data } = embedData;
  const stmt = db.prepare(`UPDATE configs SET ${name} = ? WHERE guild_id = ?`);
  stmt.run(data, config.guild.id);
}

// Messages
export function getAllMessages(): MessageEntry[] {
  const stmt = db.prepare('SELECT * FROM messages');
  const result = stmt.all() as MessageEntry[];

  return result;
}

export function insertIntoMessages(
  name: string,
  message_id: string,
  channel: string,
  type: MessageType
): void {
  const stmt = db.prepare(
    'INSERT INTO messages (name, message_id, channel, type) \
    VALUES (?, ?, ?, ?) \
    ON CONFLICT(name) DO UPDATE SET \
    message_id = excluded.message_id, channel = excluded.channel, type = excluded.type'
  );
  stmt.run(name, message_id, channel, type);
  console.log('new insert into messages');
}

export function getMessageIdByName(name: string): string | undefined {
  const stmt = db.prepare('SELECT message_id FROM messages WHERE name = ?');
  const result = stmt.get(name) as Record<string, any>;

  return result && 'message_id' in result ? result.message_id : undefined;
}

export function getMessagesByType(type: MessageType): MessageEntry[] {
  const stmt = db.prepare('SELECT * FROM messages WHERE type = ?');
  const result = stmt.all(type) as MessageEntry[];

  return result;
}

export function deleteFromMessages(options: { name?: string; type?: MessageType }): void {
  const { name, type } = options;
  if (name) {
    const stmt = db.prepare('DELETE FROM messages WHERE name = ?');
    stmt.run(name);
  } else if (type) {
    const stmt = db.prepare('DELETE FROM messages WHERE type = ?');
    stmt.run(type);
  }
}

// Oauth
export function insertOauthData(data: OauthData): void {
  const stmt = db.prepare(
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

export function deleteFromOuathData(access_token: string): void {
  const stmt = db.prepare('DELETE FROM auth_data WHERE access_token = ?');
  stmt.run(access_token);
}

export function getAccessTokens(): { access_token: string }[] {
  const stmt = db.prepare('SELECT access_token FROM auth_data');
  const result = stmt.all() as { access_token: string }[];

  return result;
}

export function getOauthData(access_token: string): OauthData {
  const stmt = db.prepare('SELECT * FROM auth_data WHERE access_token = ?');
  const result = stmt.all(access_token) as OauthData[];

  return result[0];
}

// Channels
export function getOpenChannel(
  user_id: string,
  table: string
): { user: User; channel: TextChannel } | undefined {
  const stmt = db.prepare(`SELECT user, channel FROM ${table} WHERE user_id = ?`);
  const result = stmt.all(user_id) as { user: string; channel: string }[];
  if (result.length > 0) {
    const user: User = JSON.parse(result[0].user);
    const channel: TextChannel = JSON.parse(result[0].channel);

    return { user, channel };
  }

  return;
}

export function getOpenChannelUser(
  channel_id: string,
  table: string
): { user: User; channel: TextChannel } | undefined {
  const stmt = db.prepare(`SELECT user, channel FROM ${table}`);
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

export function insertIntoOpenChannels(
  user_id: string,
  user: string,
  channel: string,
  table: string
): void {
  const stmt = db.prepare(`INSERT INTO ${table} (user_id, user, channel) VALUES (?, ?, ?)`);

  stmt.run(user_id, user, channel);
}

export function deleteFromOpenChannels(user_id: string, channel_id: string, table: string): void {
  const rows = db.prepare(`SELECT id, channel FROM ${table} WHERE user_id = ?`).all(user_id) as [
    { id: string; channel: string }
  ];

  for (const row of rows) {
    const channel = JSON.parse(row.channel);
    if (channel.id === channel_id) {
      db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(row.id);
      break;
    }
  }
}
