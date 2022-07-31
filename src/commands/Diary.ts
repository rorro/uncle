import { BaseCommandInteraction, Client, MessageEmbed } from 'discord.js';
import { ApplicationCommandOptionTypes } from 'discord.js/typings/enums';
import { getSheetData } from '../api/googleHandler';
import { Command, PlayerSummary } from '../types';
import config from '../config';
import { getRank, hasRole } from '../utils';
import db from '../db';
import dayjs from 'dayjs';

export const diaryCommand: Command = {
  name: 'diary',
  description: 'Show various information about splits',
  type: 'CHAT_INPUT',
  options: [
    {
      type: ApplicationCommandOptionTypes.SUB_COMMAND,
      name: 'setmessage',
      description: 'Sets the message in which the top 10 Legacy diary completions will be shown',
      options: [
        {
          type: ApplicationCommandOptionTypes.STRING,
          name: 'message_id',
          description: 'Id of the message',
          required: true
        }
      ]
    },
    {
      type: ApplicationCommandOptionTypes.SUB_COMMAND,
      name: 'updatetop10',
      description: 'Update the diary task completion top 10 list'
    }
  ],
  run: async (client: Client, interaction: BaseCommandInteraction) => {
    if (!interaction.inCachedGuild() || !interaction.isCommand()) return;

    if (!hasRole(interaction.member, config.guild.roles.staff)) {
      await interaction.reply({
        content: 'You need to be a staff member to use this command!',
        ephemeral: true
      });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    const subCommand = interaction.options.getSubcommand();

    switch (subCommand) {
      case 'setmessage':
        const editMessageId = interaction.options.getString('message_id', true);
        db.leaderboard.push('/diarytop10', editMessageId);

        await interaction.followUp({
          content: `Top 10 diary message has been set to ${editMessageId}. Make sure this message is in <#${config.guild.channels.legacyDiary}>. If it's not, re-do this command.`
        });
        return;
      case 'updatetop10':
        const channel = client.channels.cache.get(config.guild.channels.legacyDiary);
        if (!channel?.isText()) return;

        try {
          const messageId = db.leaderboard.getData('/diarytop10');
          const summaryData = await getSheetData(
            config.googleDrive.splitsSheet,
            'Summary!A2:AA',
            'FORMATTED_VALUE'
          );
          const players = Object.values((summaryData as any[]).slice(12))
            .map(
              v => <PlayerSummary>{ name: v.at(0), points: v.at(1), diaryTasks: v.at(2), rank: v.at(4) }
            )
            .sort((a, b) => b.diaryTasks - a.diaryTasks);

          let uniqueScoresFound = 0;
          let lastScore = 0;
          let description = '';
          const embed = new MessageEmbed()
            .setTitle('Diary top 10 completion list')
            .setThumbnail('https://i.imgur.com/GtMFrRf.png')
            .setFooter({ text: `Last updated: ${dayjs().format('MMMM DD, YYYY')}` });

          for (let i in players) {
            const player = players[i];

            if (uniqueScoresFound === 10 && player.diaryTasks !== lastScore) {
              break;
            }

            if (lastScore !== player.diaryTasks) {
              description += `**${player.diaryTasks}**\n\u200b \u200b \u200b \u200b${getRank(
                player.rank
              )} ${player.name}\n`;
              lastScore = player.diaryTasks;
              uniqueScoresFound += 1;
            } else {
              description += `\u200b \u200b \u200b \u200b${getRank(player.rank)} ${player.name}\n`;
            }
          }

          embed.setDescription(description);
          await channel.messages.edit(messageId, { content: '\u200b', embeds: [embed] });

          await interaction.followUp({
            content: 'Top 10 diary completions updated.'
          });
        } catch (e) {
          console.error(e);
        }
    }
  }
};
