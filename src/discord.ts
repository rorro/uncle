import {
  Client,
  Guild,
  EmbedBuilder,
  User,
  ChannelType,
  PermissionFlagsBits,
  TextChannel
} from 'discord.js';
import config from './config';
import { MessageOptions } from './types';
import dayjs from 'dayjs';
import { DATE_FORMAT } from './utils';
import { insertIntoSheet } from './api/googleHandler';
import db from './database/operations';

// Send a message in a specific channel
export async function sendMessageInChannel(client: Client, channelId: string, options?: MessageOptions) {
  if (channelId === undefined) return;
  const channel = client.channels.cache.get(channelId);
  if (channel?.type !== ChannelType.GuildText) return;

  const messageData: MessageOptions = {};
  if (options?.content) messageData.content = options.content;
  if (options?.embeds) messageData.embeds = options.embeds;
  if (options?.components) messageData.components = options.components;
  if (options?.files) messageData.files = options.files;

  const sent = await channel.send(messageData);
  return sent.id;
}

export async function createChannel(
  guild: Guild,
  categoryId: string,
  user: User,
  channelType: string
): Promise<TextChannel> {
  const channel = await guild.channels.create({
    name: `${user.username}${user.discriminator === '0' ? '' : user.discriminator}-${channelType}-${(
      Math.floor(Math.random() * 10000) + 10000
    )
      .toString()
      .substring(1)}`,
    type: ChannelType.GuildText,
    parent: categoryId,
    permissionOverwrites: [
      {
        id: config.guild.roles.staff,
        allow: [PermissionFlagsBits.ViewChannel]
      },
      {
        id: config.guild.roles.juniorStaff,
        allow: [PermissionFlagsBits.ViewChannel]
      },
      {
        id: guild.roles.everyone,
        deny: [PermissionFlagsBits.ViewChannel]
      },
      {
        id: user.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.EmbedLinks,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.AttachFiles
        ]
      }
    ]
  });
  return channel;
}

export async function sendScheduledMessages(client: Client) {
  const newMessages = db.getAllScheduledMessages();
  let newOptions: MessageOptions = {};
  for (const scheduled of newMessages) {
    const scheduledDate = dayjs(scheduled.date);
    const currentTimeInUTC = dayjs().utc().format(DATE_FORMAT);
    const datePassed = scheduledDate.diff(currentTimeInUTC, 'minute') <= 0;

    if (!datePassed) continue;

    // Replace because I'm too lazy to do it any other proper way.
    const message = JSON.parse(scheduled.message.replaceAll('\\\\u200B', '​'));

    newOptions.content = message.content ? message.content : undefined;
    newOptions.embeds =
      message.embed && Object.keys(message.embed).length !== 0
        ? [new EmbedBuilder(message.embed)]
        : undefined;

    await sendMessageInChannel(client, scheduled.channel, newOptions);
    db.deleteScheduledMessage(scheduled.id);
  }
}

export async function updateUsernameMapping(client: Client) {
  const members = await (await client.guilds.fetch(config.guild.id)).members.fetch();

  const dataToWrite: string[][] = members.map(m => {
    return [m.id, m.user.username, m.displayName];
  });
  await insertIntoSheet(config.googleDrive.newSplitsSheet, 'Username Mapping!A2', dataToWrite);
}
