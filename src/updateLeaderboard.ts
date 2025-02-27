import { LeaderboardBoss, LeaderboardRecord, MessageType, SpeedsLeaderboardEntry } from './types';
import client from './bot';
import { ChannelType, EmbedBuilder } from 'discord.js';
import { timeInHumanReadable, timeInMilliseconds } from './utils';
import { sendMessageInChannel } from './discord';
import { createLeaderboardNav } from './leaderboardNav';
import config from './config';
import db from './database/operations';

const RANK_EMOJIS = [':first_place:', ':second_place:', ':third_place:'];

export async function updateSpeed(boss: LeaderboardBoss): Promise<string> {
  const leaderboardChannelId = db.getConfigItem('leaderboard_channel') as string;
  if (!leaderboardChannelId) {
    return 'Leaderboard channel has not been configured. Head over to the config section.';
  }

  const channel = client.channels.cache.get(leaderboardChannelId);
  if (!channel || channel.type !== ChannelType.GuildText) {
    return `The configured leaderboard channel either doesn't exist or is not a text channel`;
  }

  const speedsLeaderboard = db.getSpeedsLeaderboard();
  if (!speedsLeaderboard) {
    return 'Could not fetch leaderboard data.';
  }

  const bossBoard = speedsLeaderboard.filter(b => b.boss === boss.boss && !b.removed);

  const embed = new EmbedBuilder().setTitle(`${boss.emoji} ${boss.boss}`);
  let message = ``;

  if (!boss.categories) {
    if (!bossBoard.length) {
      for (let i = 0; i < 3; i++) {
        message += `${RANK_EMOJIS[i]} - \n`;
      }
    } else {
      const { values, indexes, top } = getTopSpeedIndexes(bossBoard, 3);

      for (let i = 0; i < 3; i++) {
        if (top[i] === undefined) {
          message += `${RANK_EMOJIS[i]} - \n`;
        } else {
          message += `${RANK_EMOJIS[i]} **${timeInHumanReadable(top[i])}** \n`;
          let names = [];
          for (let j in indexes[top[i]]) {
            const index = indexes[top[i]][j];
            const leaderboardEntry = values[index];
            names.push('  ' + leaderboardEntry.name);
            message += `${'\u200b '.repeat(7)} ${leaderboardEntry.name} - ${
              leaderboardEntry.proof ? '[Proof](' + leaderboardEntry.proof + ')' : 'Proof missing'
            } \n`;
          }
        }
      }
    }
  } else {
    for (const category of boss.categories) {
      const categoryBoard = bossBoard.filter(c => c.category === category && !c.removed);
      message += `**${category}**\n`;

      if (!categoryBoard.length) {
        for (let i = 0; i < 3; i++) {
          message += `${RANK_EMOJIS[i]} - \n`;
        }
        message += '\n';
        continue;
      }

      const { values, indexes, top } = getTopSpeedIndexes(categoryBoard, 3);

      for (let i = 0; i < 3; i++) {
        if (top[i] === undefined) {
          message += `${RANK_EMOJIS[i]} - \n`;
        } else {
          message += `${RANK_EMOJIS[i]} **${timeInHumanReadable(top[i])}** \n`;
          for (let j in indexes[top[i]]) {
            const index = indexes[top[i]][j];
            const leaderboardEntry = values[index];
            message += `${'\u200b '.repeat(7)} ${leaderboardEntry.name} - ${
              leaderboardEntry.proof ? '[Proof](' + leaderboardEntry.proof + ')' : 'Proof missing'
            } \n`;
          }
        }
      }
      message += '\n';
    }
  }
  embed.setDescription(message);

  let messageId = db.getMessageIdByName(boss.boss);

  try {
    if (!messageId) throw new Error('Message id not found');
    // Discord message exists and should be edited instead

    await channel.messages.edit(messageId, { embeds: [embed] });
    await createLeaderboardNav(channel);
  } catch {
    // message not found, send it and store message id
    const mId = await sendMessageInChannel(client, leaderboardChannelId, {
      embeds: [embed]
    });
    if (!mId) {
      return 'Something went wrong when sending the leaderboard message.';
    }
    messageId = mId;
    db.insertIntoMessages(boss.boss, messageId, `#${channel.name}`, MessageType.Leaderboard);
    await createLeaderboardNav(channel, true);
  }

  return `Successfully updated ${boss.boss}. Head over to Discord to check out the updated board.`;
}

export async function postChangelog(content: string): Promise<string> {
  const leaderboardChannelId = db.getConfigItem('leaderboard_channel') as string;
  if (!leaderboardChannelId) {
    return 'Leaderboard channel has not been configured. Head over to the config section.';
  }

  const channel = client.channels.cache.get(leaderboardChannelId);
  if (!channel || channel.type !== ChannelType.GuildText) {
    return `The configured leaderboard channel either doesn't exist or is not a text channel`;
  }

  const changelogThread = channel.threads.cache.get(config.guild.leaderboardChangelog);

  if (!changelogThread) {
    return 'The changelog thread could not be found.';
  }

  try {
    await changelogThread.send({ content: content });
    return 'Successfully posted changelog.';
  } catch (e) {
    return `Something went wrong while sending changelog. ${e}`;
  }
}

function getTopSpeedIndexes(data: SpeedsLeaderboardEntry[], places: number) {
  const values = data
    .map(entry => ({
      name: entry.username,
      value: timeInMilliseconds(entry.time),
      proof: entry.proof
    }))
    .sort((e1, e2) => e1.value - e2.value);

  let indexes: LeaderboardRecord = {};
  for (let i: number = 0; i < values.length; i++) {
    const { name, value } = values[i];
    if (indexes[value]) {
      indexes[value].push(i);
    } else {
      indexes[value] = [i];
    }
  }

  const top = Object.keys(indexes)
    .map(Number)
    .sort((a, b) => a - b)
    .slice(0, places);

  return { values, indexes, top };
}
