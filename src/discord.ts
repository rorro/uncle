import {
  Client,
  Guild,
  EmbedBuilder,
  User,
  ChannelType,
  PermissionFlagsBits,
  GuildTextBasedChannel
} from 'discord.js';
import db from './db';
import config from './config';
import { ScheduledMessage, MessageOptions } from './types';

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

export function sendScheduledMessages(client: Client) {
  const messages = db.getPassedMessages();
  messages.forEach((m: ScheduledMessage) => {
    let options: MessageOptions = {};
    switch (m.type) {
      case 'embed':
        options.message = m.content ? m.content : '';
        options.embeds = m.embed ? [new EmbedBuilder(m.embed)] : [];
        break;
      case 'simple':
        options.message = m.content;
        break;
    }
    sendMessageInChannel(client, m.channel, options);
  });
}
