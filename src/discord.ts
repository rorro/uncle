import {
  Client,
  Guild,
  MessageActionRow,
  MessageAttachment,
  MessageEmbed,
  Permissions,
  User
} from 'discord.js';
import { ChannelTypes } from 'discord.js/typings/enums';
import db from './db';

// Send a message in a specific channel
export async function sendMessageInChannel(
  client: Client,
  channelId: string,
  options?: {
    message?: string;
    embeds?: MessageEmbed[];
    components?: MessageActionRow[];
    files?: MessageAttachment[];
  }
) {
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
