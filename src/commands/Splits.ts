import {
  ChatInputCommandInteraction,
  Client,
  EmbedBuilder,
  ApplicationCommandType,
  ApplicationCommandOptionType
} from 'discord.js';
import { getSheetData } from '../api/googleHandler';
import config from '../config';
import { Command, PlayerSummary } from '../types';
import { getRank } from '../utils';
import db from '../db';

export const splitsCommand: Command = {
  name: 'splits',
  description: 'Show various information about splits',
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      type: ApplicationCommandOptionType.Subcommand,
      name: 'summary',
      description: 'View summary of clan splits'
    },
    {
      type: ApplicationCommandOptionType.Subcommand,
      name: 'search',
      description: 'See split information of a player',
      options: [
        {
          name: 'rsn',
          description: 'In-game name of player',
          type: ApplicationCommandOptionType.String,
          required: true
        }
      ]
    }
  ],
  run: async (client: Client, interaction: ChatInputCommandInteraction) => {
    if (!interaction.inCachedGuild() || !interaction.isCommand()) return;

    await interaction.deferReply({ ephemeral: true });

    const subCommand = interaction.options.getSubcommand();
    let content = '';

    switch (subCommand) {
      case 'summary':
        try {
          const summaryData = await getSheetData(
            config.googleDrive.splitsSheet,
            'Summary!A2:AA',
            'FORMATTED_VALUE'
          );
          const totalSplits = summaryData?.at(1)?.at(2);
          const currentMonthTotalSplits = summaryData?.at(4)?.at(2);
          const currentMonth = summaryData?.at(4)?.at(4);
          const currentMonthlySplitter = summaryData?.at(7)?.at(2).split(':');

          const players = Object.values((summaryData as any[]).slice(12)).map(
            v => <PlayerSummary>{ name: v.at(0), points: v.at(1), diaryTasks: v.at(2), rank: v.at(4) }
          );

          let topThreePoints = '';
          players
            .sort((a, b) => b.points - a.points)
            .slice(0, 3)
            .forEach(p => {
              topThreePoints += `${getRank(p.rank)} ${p.name}: ${p.points}\n`;
            });

          let topThreeDiary = '';
          players
            .sort((a, b) => b.diaryTasks - a.diaryTasks)
            .slice(0, 3)
            .forEach(p => {
              topThreeDiary += `${getRank(p.rank)} ${p.name}: ${p.diaryTasks}\n`;
            });

          const embed = new EmbedBuilder()
            .setTitle('Legacy Splits Summary')
            .setFooter({ text: `Current month: ${currentMonth}` })
            .setThumbnail(db.database.getData('/config/clanIcon'))
            .setURL(
              'https://docs.google.com/spreadsheets/d/1Cuc6_MB9E1-6nFXbv6pDxKlwCjS9mXDG5kaPV4B_Wq8/edit?usp=sharing'
            )
            .addFields([
              { name: 'Total splits', value: totalSplits },
              { name: 'Current month total splits', value: currentMonthTotalSplits },
              { name: 'Current month top splitter', value: currentMonthlySplitter.join(': ') },
              { name: 'Top 3 Legacy points', value: topThreePoints, inline: true },
              { name: 'Top 3 Legacy diary tasks completed', value: topThreeDiary, inline: true }
            ]);

          await interaction.followUp({
            embeds: [embed]
          });
        } catch (e) {
          console.log(e);
        }
        return;
      case 'search':
        const username = interaction.options.getString('rsn', true).toLowerCase();
        const data = await getSheetData(config.googleDrive.splitsSheet, 'Data!1:900', 'FORMATTED_VALUE');
        const players = data?.slice(3);

        for (const { index, value } of (players as any[][]).map((value, index) => ({
          index,
          value
        }))) {
          if (value.at(0).toLowerCase() === username) {
            const [
              rank,
              diaryTasks,
              joinDate,
              advCoxTob,
              maxCoxTob,
              advGear,
              maxGear,
              totalPoints,
              botw
            ] = [
              value.at(3),
              value.at(14).length > 0 ? value.at(14) : '--',
              value.at(15).length > 0 ? value.at(15) : '--',
              value.at(6),
              value.at(7),
              value.at(4),
              value.at(5),
              value.at(17),
              value.slice(18, 21)
            ];

            const embed = new EmbedBuilder()
              .setTitle(`Showing player data for ${value.at(0)}`)
              .setThumbnail(db.database.getData('/config/clanIcon'))
              .setFooter({ text: `Joined Legacy at ${joinDate}` })
              .setURL(
                'https://docs.google.com/spreadsheets/d/1Cuc6_MB9E1-6nFXbv6pDxKlwCjS9mXDG5kaPV4B_Wq8/edit?usp=sharing'
              )
              .addFields([
                { name: 'Total points', value: totalPoints, inline: true },
                { name: 'Diary tasks completed', value: diaryTasks, inline: true },
                { name: '\u200b', value: '\u200b' },
                {
                  name: 'CoX and ToB KC',
                  value: `Advanced ${isTrue(advCoxTob)}, Max ${isTrue(maxCoxTob)}`,
                  inline: true
                },
                {
                  name: 'Gear',
                  value: `Advanced ${isTrue(advGear)}, Max ${isTrue(maxGear)}`,
                  inline: true
                },
                { name: '\u200b', value: '\u200b' },
                {
                  name: 'Boss of the Week',
                  value: `${botw.at(0) ? botw.at(0) : 0}🥇 / ${botw.at(1) ? botw.at(1) : 0}🥈 / ${
                    botw.at(2) ? botw.at(2) : 0
                  }🥉`,
                  inline: true
                },
                { name: 'Rank', value: `${getRank(rank)} ${rank}`, inline: true }
              ]);

            await interaction.followUp({
              embeds: [embed]
            });
            return;
          }
        }

        await interaction.followUp({
          content: 'Player not found.'
        });
        return;
    }

    await interaction.followUp({
      content: content ? content : 'Something went wrong.'
    });
  }
};

function isTrue(val: string) {
  return val === 'TRUE' ? '✅' : '❌';
}
