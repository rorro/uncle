import dayjs from 'dayjs';
import {
  ChatInputCommandInteraction,
  Client,
  EmbedBuilder,
  ApplicationCommandType,
  ApplicationCommandOptionType,
  ChannelType
} from 'discord.js';
import { getSheetData } from '../api/googleHandler';
import config from '../config';
import { Command, PlayerSummary } from '../types';
import { getRank, hasRole } from '../utils';
import KnexDB from '../database/knex';

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

    const diaryChannelId = (await KnexDB.getConfigItem('diary_channel')) as string;
    console.log(diaryChannelId);

    if (!diaryChannelId) {
      await interaction.followUp({
        content: `A diary channel has not been configured.`
      });
      return;
    }

    const diaryChannel = client.channels.cache.get(diaryChannelId);
    if (!diaryChannel || diaryChannel.type !== ChannelType.GuildText) {
      await interaction.followUp({
        content: `The diary channel either doesn't exist or is not a text channel. Please re-configure it.`
      });
      return;
    }

    switch (subCommand) {
      case 'setmessage':
        const editMessageId = interaction.options.getString('message_id', true);

        try {
          const configuredMessage = await diaryChannel.messages.fetch(editMessageId);

          if (configuredMessage.author !== client.user) throw Error('not me');
        } catch (e: any) {
          if (e.message.includes('not me')) {
            await interaction.followUp({
              content: `This message was not sent by me, I will not be able to use it.`
            });
          } else {
            await interaction.followUp({
              content: `The selected message must be in ${diaryChannel}.`
            });
          }
          return;
        }

        await KnexDB.updateConfig('diary_top10_message', editMessageId);

        await interaction.followUp({
          content: `Top 10 diary message has been set to [this message](<https://discord.com/channels/${interaction.guildId}/${diaryChannelId}/${editMessageId}>).`
        });
        return;
      case 'updatetop10':
        try {
          const messageId = (await KnexDB.getConfigItem('diary_top10_message')) as string;

          if (!messageId) {
            await interaction.followUp({
              content: 'No diary message has been configured. Configure one with `/diary setmessage`'
            });
            return;
          }

          const message = await diaryChannel.messages.fetch(messageId);

          if (message.author !== client.user) {
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

          const clanIcon = (await KnexDB.getConfigItem('clan_icon')) as string;
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
          await diaryChannel.messages.edit(messageId, { content: '\u200b', embeds: [embed] });

          await interaction.followUp({
            content: `Top 10 diary completions updated. [Quick hop to message.](<https://discord.com/channels/${interaction.guildId}/${diaryChannelId}/${messageId}>)`
          });
        } catch (e) {
          await interaction.followUp({
            content: `Something went wrong. A diary message has probably not been set in the correct channel. Set one in <#${diaryChannel}> with \`/diary setmessage\``
          });
        }
    }
  }
};
