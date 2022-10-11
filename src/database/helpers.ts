import knexDB from './knex';
import {
  ChannelResponse,
  MessagesResponse,
  MessageType,
  MessageOptions,
  OpenApplicationsResponse
} from './types';

export async function getChannelId(channel: string): Promise<string | undefined> {
  const result = await knexDB('channels').where('channel', channel).select('channel_id');

  if (result.length > 0) {
    return result[0].channel_id;
  }
  return;
}

export async function getAllChannels(): Promise<ChannelResponse[] | undefined> {
  const result = await knexDB('channels');

  return result ? result : undefined;
}

export async function insertIntoChannels(channel: string, channel_id: string) {
  await knexDB('channels').insert({ channel, channel_id }).onConflict('channel').merge();
}

export async function deleteFromChannels(channel: string) {
  await knexDB('channels').where('channel', channel).delete();
}

export async function getMessageIdByName(name: string): Promise<string | undefined> {
  const result = await knexDB('messages').where('name', name).select('message_id');

  if (result.length > 0) {
    return result[0].message_id;
  }
  return;
}

export async function getMessagesByType(type: MessageType): Promise<MessagesResponse[]> {
  return await knexDB('messages').where('type', type);
}

export async function getAllMessages(): Promise<MessagesResponse[] | undefined> {
  const result = await knexDB('messages');

  return result ? result : undefined;
}

export async function insertIntoMessages(name: string, message_id: string, type: MessageType) {
  await knexDB('messages').insert({ name, message_id, type }).onConflict('name').merge();
}

export async function deleteFromMessages(options: MessageOptions) {
  const { name, type } = options;
  if (name) {
    await knexDB('messages').where('name', name).delete();
  } else if (type) {
    await knexDB('messages').where('type', type).delete();
  }
}

export async function getOpenChannel(user_id: string, table: string): Promise<string | undefined> {
  const result = await knexDB(table).where('user_id', user_id).select('channel_id');

  if (result.length > 0) {
    return result[0].channel_id;
  }
  return;
}

export async function getOpenChannelUser(
  channel_id: string,
  table: string
): Promise<string | undefined> {
  const result = await knexDB(table).where('channel_id', channel_id).select('user_id');

  if (result.length > 0) {
    return result[0].user_id;
  }
  return;
}

export async function getAllOpenChannels(
  table: string
): Promise<OpenApplicationsResponse[] | undefined> {
  const result = await knexDB(table);

  return result ? result : undefined;
}

export async function insertIntoOpenChannels(user_id: string, channel_id: string, table: string) {
  return await knexDB(table).insert({ user_id, channel_id }, 'id').onConflict('user_id').merge();
}

export async function deleteFromOpenChannels(user_id: string, table: string) {
  await knexDB(table).where('user_id', user_id).delete();
}

export async function getConfigValue(config_key: string): Promise<string | undefined> {
  const result = await knexDB('config').where('config_key', config_key).select('config_value');

  if (result.length > 0) {
    return result[0].config_value;
  }
  return;
}

export async function insertIntoConfig(config_key: string, config_value: string) {
  await knexDB('config').insert({ config_key, config_value }).onConflict('config_key').merge();
}
