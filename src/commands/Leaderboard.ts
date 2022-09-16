import { BaseCommandInteraction, Client, MessageEmbed } from 'discord.js';
import { ApplicationCommandOptionTypes } from 'discord.js/typings/enums';
import { Command, LeaderboardRecord, LeaderboardType } from '../types';
import { getSheetData } from '../api/googleHandler';
import config from '../config';
import db from '../db';
import { sendMessageInChannel } from '../discord';
import { hasRole, PeriodsInMillseconds } from '../utils';

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
          if (!metricData.metric[3]) {
            for (let i = 0; i < 3; i++) {
              message += `[#${+i + 1}] \n`;
            }
          } else {
            const data = getTopLeaderboardIndex(metricData.metric, 3);

            for (let i = 0; i < 3; i++) {
              if (data.top[i] === undefined) {
                message += `[#${+i + 1}] \n`;
              } else {
                message += `[#${+i + 1}] ( ${
                  data.leaderboardType === LeaderboardType.TIME
                    ? timeInHumanReadable(data.top[i])
                    : data.top[i]
                } )\n`;
                let names = [];
                for (let j in data.indexes[data.top[i]]) {
                  const index = data.indexes[data.top[i]][j];
                  const leaderboardEntry = data.values[index];
                  names.push('  ' + leaderboardEntry.name);
                }

                message += `${names.join('\n')}\n`;
              }
            }
          }

          message += `\`\`\``;
        } else {
          for (let i = 1; i < metricData.metric.length; i++) {
            const category = metricData.metric[i][0].split(': ')[1];

            if (!metricData.metric[i][3]) {
              message += `[${category}]\n`;
              continue;
            }

            const data = getTopLeaderboardIndex(metricData.metric[i], 1);
            message += `[${category}] ${`( ${
              data.leaderboardType === LeaderboardType.TIME
                ? timeInHumanReadable(data.top[0])
                : data.top[0]
            } )`}\n`;

            let names = [];
            for (let i = 0; i < data.values.length; i++) {
              if (data.values[i].value === data.top[0]) {
                names.push('  ' + data.values[i].name);
              }
            }

            message += names.length === 0 ? '' : `${names.join('\n')}\n`;
          }
          message += `\`\`\``;
        }

        let messageId = '';
        try {
          messageId = db.database.getData(`/speeds/${metricName}`);
          // Discord message exists and should be edited instead
          const channel = client.channels.cache.get(config.guild.channels.leaderboard);
          if (!channel?.isText()) return;

          await channel.messages.edit(messageId, { content: message });
        } catch {
          // message not found, send it and store message id
          const mId = await sendMessageInChannel(client, config.guild.channels.leaderboard, {
            message: message
          });
          if (!mId) {
            await interaction.followUp({
              content: 'Something went wrong when sending the leaderboard message.'
            });
            return;
          }
          messageId = mId;
          db.database.push(`/speeds/${metricName}`, messageId);
        }

        await interaction.followUp({
          embeds: [
            new MessageEmbed().setDescription(
              `Leaderboard for ${metricEmoji} **${metricName}** ${metricEmoji} has been updated.\n[Quick hop to the leaderboard](https://discord.com/channels/${interaction.guildId}/${config.guild.channels.leaderboard}/${messageId})`
            )
          ]
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
          const nextLine = leaderboardData[index + j];
          if (!nextLine || !nextLine[0].toLowerCase().includes('category')) {
            return { category: true, metric: leaderboardData.slice(index, index + j) };
          }
        }
      }
    }
  }
}

function getTopLeaderboardIndex(data: string[], places: number) {
  const leaderboardType = data[3].split('/')[1].includes(':')
    ? LeaderboardType.TIME
    : LeaderboardType.REGULAR;
  const values = data
    .slice(3)
    .map(entry => ({
      name: entry.split('/')[0],
      value:
        leaderboardType === LeaderboardType.TIME
          ? timeInMilliseconds(entry.split('/')[1])
          : parseInt(entry.split('/')[1])
    }))
    .sort((e1, e2) =>
      leaderboardType === LeaderboardType.TIME ? e1.value - e2.value : e2.value - e1.value
    );

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
    .sort((a, b) => (leaderboardType === LeaderboardType.TIME ? a - b : b - a))
    .slice(0, places);

  return { values, indexes, top, leaderboardType };
}

function timeInMilliseconds(time: string) {
  const splitTime = time.split(':');
  const hours: number = Number(splitTime.at(-3))
    ? Number(splitTime.at(-3)) * PeriodsInMillseconds.hour
    : 0;
  const minutes: number = Number(splitTime.at(-2))
    ? Number(splitTime.at(-2)) * PeriodsInMillseconds.minute
    : 0;
  const seconds: number = Number(splitTime.at(-1)?.split('.')[0])
    ? Number(splitTime.at(-1)?.split('.')[0]) * PeriodsInMillseconds.second
    : 0;
  const milliseconds: number = Number(splitTime.at(-1)?.split('.')[1])
    ? Number(splitTime.at(-1)?.split('.')[1]) * 10
    : 0;

  return hours + minutes + seconds + milliseconds;
}

function timeInHumanReadable(time: number): string {
  const hours = Math.floor(time / PeriodsInMillseconds.hour);
  const minutes = Math.floor((time - hours * PeriodsInMillseconds.hour) / PeriodsInMillseconds.minute);
  const seconds = Math.floor(
    (time - hours * PeriodsInMillseconds.hour - minutes * PeriodsInMillseconds.minute) /
      PeriodsInMillseconds.second
  );
  const milliseconds =
    (time -
      hours * PeriodsInMillseconds.hour -
      minutes * PeriodsInMillseconds.minute -
      seconds * PeriodsInMillseconds.second) /
    10;

  let humanReadable = '';
  humanReadable += minutes > 0 || hours > 0 ? `${padNumber(hours)}:` : '';
  humanReadable += seconds > 0 || minutes > 0 ? `${padNumber(minutes)}:` : '';
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
