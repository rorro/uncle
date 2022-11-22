import {
  Client,
  Guild,
  EmbedBuilder,
  User,
  ChannelType,
  PermissionFlagsBits,
  GuildTextBasedChannel
} from 'discord.js';
import config from './config';
import { MessageOptions } from './types';
import KnexDB from './database/knex';
import dayjs from 'dayjs';
import { DATE_FORMAT } from './utils';

// Send a message in a specific channel
export async function sendMessageInChannel(client: Client, channelId: string, options?: MessageOptions) {
  if (channelId === undefined) return;
  const channel = client.channels.cache.get(channelId);
  if (channel?.type !== ChannelType.GuildText) return;

  const sent = await channel.send({
    content: options?.message ? options?.message : '\u200b',
    embeds: options?.embeds ? options?.embeds : [],
    components: options?.components ? options?.components : [],
    files: options?.files ? options.files : []
  });
  return sent.id;
}

export async function createChannel(
  guild: Guild,
  categoryId: string,
  user: User,
  channelType: string
): Promise<GuildTextBasedChannel> {
  const channel = await guild.channels.create({
    name: `${user.username}${user.discriminator}-${channelType}-${(
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
  const newMessages = await KnexDB.getAllScheduledMessages();
  let newOptions: MessageOptions = {};
  for (const scheduled of newMessages) {
    const scheduledDate = dayjs(scheduled.date);
    const currentTimeInUTC = dayjs().utc().format(DATE_FORMAT);
    const datePassed = scheduledDate.diff(currentTimeInUTC, 'minute') <= 0;

    if (!datePassed) continue;

    const message = JSON.parse(scheduled.message);
    newOptions.message = message.content ? message.content : '';
    newOptions.embeds = message.embed ? [new EmbedBuilder(message.embed)] : [];

    await sendMessageInChannel(client, scheduled.channel, newOptions);
    await KnexDB.deleteScheduledMessage(scheduled.id);
  }
}
