import dayjs from 'dayjs';
import {
  ChatInputCommandInteraction,
  Client,
  EmbedBuilder,
  ApplicationCommandType,
  ApplicationCommandOptionType,
  ChannelType
} from 'discord.js';
import { getConfigValue, getMessageIdByName, insertIntoMessages } from '../database/handler';
import { MessageType } from '../database/types';
import { getSheetData } from '../api/googleHandler';
import config from '../config';
import db from '../db';
import { Command, PlayerSummary } from '../types';
import { getRank, hasRole } from '../utils';

export const diaryCommand: Command = {
  name: 'diary',
  description: 'Show various information about splits',
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      type: ApplicationCommandOptionType.Subcommand,
      name: 'setmessage',
      description: 'Sets the message in which the top 10 Legacy diary completions will be shown',
      options: [
        {
          type: ApplicationCommandOptionType.String,
          name: 'message_id',
          description: 'Id of the message',
          required: true
        }
      ]
    },
    {
      type: ApplicationCommandOptionType.Subcommand,
      name: 'updatetop10',
      description: 'Update the diary task completion top 10 list'
    }
  ],
  run: async (client: Client, interaction: ChatInputCommandInteraction) => {
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
        await insertIntoMessages('diarytop10', editMessageId, MessageType.Other);

        await interaction.followUp({
          content: `Top 10 diary message has been set to ${editMessageId}. Make sure this message is in <#${config.guild.channels.legacyDiary}>. If it's not, re-do this command.`
        });
        return;
      case 'updatetop10':
        const channel = client.channels.cache.get(config.guild.channels.legacyDiary);
        if (channel?.type !== ChannelType.GuildText) return;

        try {
          const messageId = await getMessageIdByName('diarytop10');

          if (messageId === undefined) {
            await interaction.followUp({
              content: 'No diary message has been configured. Configure one with `/diary setmessage`'
            });
            return;
          }

          const message = await channel.messages.fetch(messageId);

          if (message.author.id !== client.user?.id) {
            await interaction.followUp({
              content:
                'The diary message was not sent by me. You can send a new message with `/message send`'
            });
            return;
          }

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
          const embed = new EmbedBuilder()
            .setTitle('Diary top 10 completion list')
            .setFooter({ text: `Last updated: ${dayjs().format('MMMM DD, YYYY')}` });

          const clanIcon = await getConfigValue('clanIcon');
          if (clanIcon) embed.setThumbnail(clanIcon);

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
          await interaction.followUp({
            content: `Something went wrong. A diary message has probably not been set in the correct channel. Set one in <#${config.guild.channels.legacyDiary}> with \`/diary setmessage\``
          });
        }
    }
  }
};
