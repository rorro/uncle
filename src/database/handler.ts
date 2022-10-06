import { Message } from 'discord.js';
import knex from 'knex';
import knexDB from './knex';
import { ChannelResponse, MessagesResponse, MessageType, MessageOptions } from './types';

export async function getChannelId(channel: string): Promise<ChannelResponse | undefined> {
  const result = await knexDB('channels').select('channel_id').where('channel', channel);

  if (result.length > 0) {
    return result[0];
  }
  return;
}

export async function insertIntoChannels(channel: string, channel_id: string, type: MessageType) {
  await knexDB('channels').insert({ channel, channel_id }).onConflict('channel').merge();
}

export async function deleteFromChannels(channel: string) {
  await knexDB('channels').where('channel', channel).delete();
}

export async function getMessageByName(name: string): Promise<MessagesResponse | undefined> {
  const result = await knexDB('messages').where('name', name).select('name', 'message_id', 'type');

  return result ? result[0] : undefined;
}

export async function getMessagesByType(type: MessageType): Promise<MessagesResponse[] | undefined> {
  const result = await knexDB('messages').where('type', type).select('name', 'message_id', 'type');

  return result ? result : undefined;
}

export async function getAllMessages(): Promise<MessagesResponse[] | undefined> {
  const result = await knexDB('messages').select('name', 'message_id', 'type');

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

export async function insertIntoOpenApplications(user_id: string, channel_id: string) {
  await knexDB('messages').insert({ user_id, channel_id }).onConflict('name').merge();
}

// export async function getChannelId(channel: string): Promise<ChannelResponse | undefined> {
//   const result = await knexDB('channels').select('channel_id').where('channel', channel);

//   if (result.length > 0) {
//     return result[0];
//   }
//   return;
// }
