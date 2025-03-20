import { EmbedBuilder, TextChannel } from 'discord.js';
import { sendMessageInChannel } from './discord';
import { MessageType } from './types';
import client from './bot';
import config from './config';
import LeaderboardBosses from './leaderboardBosses';
import db from './database/operations';

export const NAV_MESSAGE_NAME = 'Quick Hop Links';

export async function createLeaderboardNav(leaderboardChannel: TextChannel, remove: boolean = false) {
  const leaderboardMessages = db.getMessagesByType(MessageType.Leaderboard);

  const embed = new EmbedBuilder().setTitle(NAV_MESSAGE_NAME);
  let description = '';

  leaderboardMessages.map(e => {
    const bossEmoji = LeaderboardBosses.find(b => b.boss === e.name);
    description += `${bossEmoji?.emoji} [${e.name}](https://discord.com/channels/${config.guild.id}/${leaderboardChannel.id}/${e.message_id})\n`;
  });

  embed.setDescription(description);

  const storedMessageId = db.getMessageIdByName(NAV_MESSAGE_NAME);
  if (storedMessageId !== undefined) {
    // nav message exists
    if (remove) {
      try {
        // Delete the old pet hiscore messages
        await (await leaderboardChannel.messages.fetch(storedMessageId)).delete();
      } catch (error) {
        console.error('Old nav message not found.');
      }
      db.deleteFromMessages({ name: NAV_MESSAGE_NAME });
      await sendNavMessage(leaderboardChannel, embed);
    } else {
      await leaderboardChannel.messages.edit(storedMessageId, { embeds: [embed] });
    }
  } else {
    await sendNavMessage(leaderboardChannel, embed);
  }
}

async function sendNavMessage(leaderboardChannel: TextChannel, embed: EmbedBuilder) {
  const messageId = await sendMessageInChannel(client, leaderboardChannel.id, { embeds: [embed] });

  if (messageId === undefined) {
    return `Something went wrong when sending nav message`;
  }

  db.insertIntoMessages(NAV_MESSAGE_NAME, messageId, `#${leaderboardChannel.name}`, MessageType.Other);
}
