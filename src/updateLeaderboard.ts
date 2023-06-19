import { LeaderboardBoss, LeaderboardRecord, MessageType, SpeedsLeaderboardEntry } from './types';
import KnexDB from './database/knex';
import client from './bot';
import { ChannelType } from 'discord.js';
import { timeInHumanReadable, timeInMilliseconds } from './utils';
import { sendMessageInChannel } from './discord';

export async function updateSpeed(boss: LeaderboardBoss): Promise<string> {
  const leaderboardChannelId = (await KnexDB.getConfigItem('leaderboard_channel')) as string;
  if (!leaderboardChannelId) {
    return 'Leaderboard channel has not been configured. Head over to the config section.';
  }

  const channel = client.channels.cache.get(leaderboardChannelId);
  if (!channel || channel.type !== ChannelType.GuildText) {
    return `The configured leaderboard channel either doesn't exist or is not a text channel`;
  }

  const speedsLeaderboard = await KnexDB.getSpeedsLeaderboard();
  if (!speedsLeaderboard) {
    return 'Could not fetch data from the leaderboard sheet.';
  }

  const bossBoard = speedsLeaderboard.filter(b => b.boss === boss.boss && !b.removed);
  let message = `${boss.emoji} ${boss.boss} ${boss.emoji}\n\`\`\`ini\n`;

  if (!boss.categories) {
    if (!bossBoard.length) {
      for (let i = 0; i < 3; i++) {
        message += `[#${+i + 1}] \n`;
      }
    } else {
      const { values, indexes, top } = getTopSpeedIndexes(bossBoard, 3);

      for (let i = 0; i < 3; i++) {
        if (top[i] === undefined) {
          message += `[#${+i + 1}] \n`;
        } else {
          message += `[#${+i + 1}] ( ${timeInHumanReadable(top[i])} )\n`;
          let names = [];
          for (let j in indexes[top[i]]) {
            const index = indexes[top[i]][j];
            const leaderboardEntry = values[index];
            names.push('  ' + leaderboardEntry.name);
          }

          message += `${names.join('\n')}\n`;
        }
      }
    }
    message += `\`\`\``;
  } else {
    for (const category of boss.categories) {
      const categoryBoard = bossBoard.filter(c => c.category === category && !c.removed);

      if (!categoryBoard.length) {
        message += `[${category}]\n`;
        continue;
      }

      const { values, top } = getTopSpeedIndexes(categoryBoard, 1);
      message += `[${category}] ${`( ${timeInHumanReadable(top[0])} )`}\n`;

      let names = [];
      for (let i = 0; i < values.length; i++) {
        if (values[i].value === top[0]) {
          names.push('  ' + values[i].name);
        }
      }

      message += names.length === 0 ? '' : `${names.join('\n')}\n`;
    }
    message += `\`\`\``;
  }

  let messageId = await KnexDB.getMessageIdByName(boss.boss);
  try {
    if (!messageId) throw new Error('Message id not found');

    // Discord message exists and should be edited instead

    await channel.messages.edit(messageId, { content: message });
  } catch {
    // message not found, send it and store message id
    const mId = await sendMessageInChannel(client, leaderboardChannelId, {
      content: message
    });
    if (!mId) {
      return 'Something went wrong when sending the leaderboard message.';
    }
    messageId = mId;
    await KnexDB.insertIntoMessages(boss.boss, messageId, `#${channel.name}`, MessageType.Leaderboard);
  }

  console.log(message);

  return `Successfully updated ${boss.boss}. Head over to Discord to check out the updated board.`;
}

function getTopSpeedIndexes(data: SpeedsLeaderboardEntry[], places: number) {
  const values = data
    .map(entry => ({
      name: entry.username,
      value: timeInMilliseconds(entry.time)
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
