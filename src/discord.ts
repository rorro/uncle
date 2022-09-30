import { Client, Guild, MessageEmbed, Permissions, User } from 'discord.js';
import { ChannelTypes } from 'discord.js/typings/enums';
import db from './db';
import config from './config';
import { ScheduledMessage, MessageOptions } from './types';

// Send a message in a specific channel
export async function sendMessageInChannel(client: Client, channelId: string, options?: MessageOptions) {
  if (channelId === undefined) return;
  const channel = client.channels.cache.get(channelId);
  if (!channel?.isText()) return;

  const sent = await channel.send({
    content: options?.message ? options?.message : '\u200b',
    embeds: options?.embeds ? options?.embeds : [],
    components: options?.components ? options?.components : [],
    files: options?.files ? options.files : []
  });
  return sent.id;
}

export async function createChannel(guild: Guild, categoryId: string, user: User) {
  const applicationId = !db.database.exists('/applicationId')
    ? 1
    : db.database.getData('/applicationId') + 1;

  const channel = await guild.channels.create(
    `${user.username}${user.discriminator}-app-${applicationId}`,
    {
      type: ChannelTypes.GUILD_TEXT,
      parent: categoryId,
      permissionOverwrites: [
        {
          id: config.guild.roles.staff,
          allow: [Permissions.FLAGS.VIEW_CHANNEL]
        },
        {
          id: guild.roles.everyone,
          deny: [Permissions.FLAGS.VIEW_CHANNEL]
        },
        {
          id: user.id,
          allow: [
            Permissions.FLAGS.VIEW_CHANNEL,
            Permissions.FLAGS.SEND_MESSAGES,
            Permissions.FLAGS.EMBED_LINKS,
            Permissions.FLAGS.READ_MESSAGE_HISTORY,
            Permissions.FLAGS.ATTACH_FILES
          ]
        }
      ]
    }
  );
  db.database.push('/applicationId', applicationId);
  return channel;
}

export function sendScheduledMessages(client: Client) {
  const messages = db.getPassedMessages();
  messages.forEach((m: ScheduledMessage) => {
    let options: MessageOptions = {};
    switch (m.type) {
      case 'embed':
        options.message = m.content ? m.content : '';
        options.embeds = m.embed ? [new MessageEmbed(m.embed)] : [];
        break;
      case 'simple':
        options.message = m.content;
        break;
    }
    sendMessageInChannel(client, m.channel, options);
  });
}
