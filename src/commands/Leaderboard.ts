import { BaseCommandInteraction, Client } from 'discord.js';
import { ApplicationCommandOptionTypes } from 'discord.js/typings/enums';
import { getSheetData } from '../api/googleHandler';
import { Command, LeaderboardRecord } from 'src/types';
import config from '../config';
import { hasRole, sendMessageInChannel, periodsInMillseconds } from '../utils';
import db from '../db';

export const leaderboardCommand: Command = {
  name: 'leaderboard',
  description: 'Leaderboard commands',
  type: 'CHAT_INPUT',
  options: [
    {
      type: ApplicationCommandOptionTypes.SUB_COMMAND,
      name: 'update',
      description: 'Update the Legacy speed leaderboards',
      options: [
        {
          name: 'leaderboard_metric',
          description: 'What leaderboard to update',
          type: ApplicationCommandOptionTypes.STRING,
          required: true,
          autocomplete: true
        }
      ]
    }
  ],

  run: async (client: Client, interaction: BaseCommandInteraction) => {
    if (!interaction.inCachedGuild() || !interaction.isCommand()) return;

    await interaction.deferReply({ ephemeral: true });

    const subCommand = interaction.options.getSubcommand();
    let content = '';

    switch (subCommand) {
      case 'update':
        if (!hasRole(interaction.member, config.guild.roles.staff)) {
          await interaction.followUp({
            content: 'You need to be a staff member to use this command!'
          });
          return;
        }

        const metric = interaction.options.getString('leaderboard_metric', true);

        const leaderboardData = await getSheetData(
          config.googleDrive.leaderboardSheet,
          'Speeds!A2:100',
          'FORMATTED_VALUE'
        );

        if (!leaderboardData) {
          await interaction.followUp({
            content: 'Could not fetch data from the leaderboard sheet.'
          });
          return;
        }

        const metricData = findMetric(leaderboardData, metric);
        if (!metricData) {
          await interaction.followUp({
            content: `No leaderboard data found for ${metric}`
          });
          return;
        }

        const metricName = metricData.category ? metricData.metric[0][0] : metricData.metric[0];
        const metricEmoji = metricData.category ? metricData.metric[0][2] : metricData.metric[2];
        let message = `${metricEmoji} ${metricName} ${metricEmoji}\n\`\`\`ini\n`;

        if (!metricData.category) {
          const data = getTopLeaderboardIndex(metricData.metric, 3);

          for (let i = 0; i < 3; i++) {
            if (data.top[i] === undefined) {
              message += `[#${+i + 1}] \n`;
            } else {
              message += `[#${+i + 1}] ( ${timeInHumanReadable(data.top[i])} )\n`;
              let names = [];
              for (let j in data.indexes[data.top[i]]) {
                const index = data.indexes[data.top[i]][j];
                const leaderboardEntry = data.times[index];
                names.push('  ' + leaderboardEntry.name);
              }

              message += `${names.join('\n')}\n`;
            }
          }

          message += `\`\`\``;
        } else {
          for (let i = 1; i < metricData.metric.length; i++) {
            const top = getTopLeaderboardIndex(metricData.metric[i], 1);
            const category = metricData.metric[i][0].split(': ')[1];
            message += `[${category}] ${
              top.top[0] === undefined ? '' : '( ' + timeInHumanReadable(top.top[0]) + ' )'
            }\n`;

            let names = [];
            for (let i = 0; i < top.times.length; i++) {
              if (top.times[i].time === top.top[0]) {
                names.push('  ' + top.times[i].name);
              }
            }

            message += names.length === 0 ? '' : `${names.join('\n')}\n`;
          }
          message += `\`\`\``;
        }

        try {
          const messageId = db.leaderboard.getData(`/speeds/${metricName}`);
          // Discord message exists and should be edited instead
          const channel = client.channels.cache.get(config.guild.channels.leaderboard);
          if (!channel?.isText()) return;

          await channel.messages.edit(messageId, { content: message });
        } catch {
          // message not found, send it and store message id
          const messageId = await sendMessageInChannel(
            client,
            config.guild.channels.leaderboard,
            message
          );
          db.leaderboard.push(`/speeds/${metricName}`, messageId);
        }

        await interaction.followUp({
          content: `Leaderboard for **${metricName}** has been updated`
        });
        break;
    }
  }
};

function findMetric(leaderboardData: any[][], metric: string) {
  for (const { index, value } of (leaderboardData as any[][]).map((value, index) => ({
    index,
    value
  }))) {
    if (value.at(0).toLowerCase() === metric) {
      if (value[3] === undefined || value[3].toLowerCase() !== 'category') {
        return { category: false, metric: value };
      } else {
        // 10 is just a random number because I don't think we'll ever have
        // more than 10 categories for a metric.
        for (let j = 1; j < 10; j++) {
          if (!(leaderboardData[index + j][0] as string).toLowerCase().includes('category')) {
            return { category: true, metric: leaderboardData.slice(index, index + j) };
          }
        }
      }
    }
  }
}

function getTopLeaderboardIndex(data: string[], places: number) {
  const times = data
    .slice(3)
    .map(entry => ({ name: entry.split('/')[0], time: timeInMilliseconds(entry.split('/')[1]) }))
    .sort((e1, e2) => e1.time - e2.time);

  let indexes: LeaderboardRecord = {};
  for (let i: number = 0; i < times.length; i++) {
    const { name, time } = times[i];
    if (indexes[time]) {
      indexes[time].push(i);
    } else {
      indexes[time] = [i];
    }
  }

  const top = Object.keys(indexes)
    .map(Number)
    .sort((a, b) => a - b)
    .slice(0, places);

  return { times, indexes, top };
}

function timeInMilliseconds(time: string) {
  const splitTime = time.split(':');
  const hours: number = Number(splitTime.at(-3))
    ? Number(splitTime.at(-3)) * periodsInMillseconds.hour
    : 0;
  const minutes: number = Number(splitTime.at(-2))
    ? Number(splitTime.at(-2)) * periodsInMillseconds.minute
    : 0;
  const seconds: number = Number(splitTime.at(-1)?.split('.')[0])
    ? Number(splitTime.at(-1)?.split('.')[0]) * periodsInMillseconds.second
    : 0;
  const milliseconds: number = Number(splitTime.at(-1)?.split('.')[1])
    ? Number(splitTime.at(-1)?.split('.')[1]) * 10
    : 0;

  return hours + minutes + seconds + milliseconds;
}

function timeInHumanReadable(time: number): string {
  const hours = Math.floor(time / periodsInMillseconds.hour);
  const minutes = Math.floor((time - hours * periodsInMillseconds.hour) / periodsInMillseconds.minute);
  const seconds = Math.floor(
    (time - hours * periodsInMillseconds.hour - minutes * periodsInMillseconds.minute) /
      periodsInMillseconds.second
  );
  const milliseconds =
    (time -
      hours * periodsInMillseconds.hour -
      minutes * periodsInMillseconds.minute -
      seconds * periodsInMillseconds.second) /
    10;

  let humanReadable = '';
  humanReadable += minutes > 0 ? `${padNumber(hours)}:` : '';
  humanReadable += seconds > 0 ? `${padNumber(minutes)}:` : '';
  humanReadable += `${padNumber(seconds)}`;
  humanReadable += milliseconds === 0 ? '' : `.${padNumber(milliseconds)}`;

  return humanReadable;
}

function padNumber(num: number): string {
  if (num < 10) {
    return '0' + num;
  } else {
    return num + '';
  }
}
