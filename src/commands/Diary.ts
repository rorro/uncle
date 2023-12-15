import dayjs from 'dayjs';
import {
  ChatInputCommandInteraction,
  Client,
  EmbedBuilder,
  ApplicationCommandType,
  ApplicationCommandOptionType,
  ChannelType,
  TextChannel
} from 'discord.js';
import { getSheetData } from '../api/googleHandler';
import config from '../config';
import { Command, MessageType, PlayerSummary } from '../types';
import { getRank, hasRole } from '../utils';
import KnexDB from '../database/knex';
import { sendMessageInChannel } from '../discord';

const DIARY_MESSAGE_NAME = 'Diary Top 10';

export const diaryCommand: Command = {
  name: 'diary',
  description: 'Show various information about splits',
  type: ApplicationCommandType.ChatInput,
  options: [
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

    const leaderboardChannelId = (await KnexDB.getConfigItem('leaderboard_channel')) as string;
    if (!leaderboardChannelId) {
      await interaction.followUp({ content: `Leaderboard channel has not been configured.` });
      return;
    }

    const leaderboardChannel = client.channels.cache.get(leaderboardChannelId);
    if (!leaderboardChannel || leaderboardChannel.type !== ChannelType.GuildText) {
      await interaction.followUp({
        content: `The configured leaderboard channel either doesn't exist or is not a text channel.`
      });
      return;
    }

    switch (subCommand) {
      case 'updatetop10':
        try {
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

          const embed = await buildMessage(players);

          let messageId = await KnexDB.getMessageIdByName(DIARY_MESSAGE_NAME);

          if (messageId) {
            try {
              await leaderboardChannel.messages.fetch(messageId);
              await leaderboardChannel.messages.edit(messageId, { content: '\u200b', embeds: [embed] });
            } catch {
              await sendNewMessage(client, interaction, leaderboardChannel, embed);
            }
          } else {
            await sendNewMessage(client, interaction, leaderboardChannel, embed);
          }

          await interaction.followUp({
            content: `Top 10 diary completions updated. [Quick hop to message.](<https://discord.com/channels/${interaction.guildId}/${leaderboardChannelId}/${messageId}>)`
          });
        } catch (e) {
          await interaction.followUp({
            content: `Something went wrong. A diary message has probably not been set in the correct channel. Set one in <#${leaderboardChannel}> with \`/diary setmessage\``
          });
        }
    }
  }
};

async function sendNewMessage(
  client: Client,
  interaction: ChatInputCommandInteraction,
  leaderboardChannel: TextChannel,
  embed: EmbedBuilder
) {
  const mId = await sendMessageInChannel(client, leaderboardChannel.id, {
    embeds: [embed]
  });

  if (!mId) {
    await interaction.followUp({
      content: 'Something went wrong when sending the leaderboard message.'
    });
    return;
  }
  await KnexDB.insertIntoMessages(
    DIARY_MESSAGE_NAME,
    mId,
    `#${leaderboardChannel.name}`,
    MessageType.Leaderboard
  );
}

async function buildMessage(players: PlayerSummary[]): Promise<EmbedBuilder> {
  const embed = new EmbedBuilder()
    .setTitle('Diary top 10 completion list')
    .setFooter({ text: `Last updated: ${dayjs().format('MMMM DD, YYYY')}` });

  const clanIcon = (await KnexDB.getConfigItem('clan_icon')) as string;
  if (clanIcon) embed.setThumbnail(clanIcon);

  let uniqueScoresFound = 0;
  let lastScore = 0;
  let description = '';

  for (let i in players) {
    const player = players[i];

    if ((uniqueScoresFound === 10 && player.diaryTasks !== lastScore) || !player.diaryTasks) {
      break;
    }

    if (lastScore !== player.diaryTasks) {
      description += `**${player.diaryTasks}**\n\u200b \u200b \u200b \u200b${getRank(player.rank)} ${
        player.name
      }\n`;
      lastScore = player.diaryTasks;
      uniqueScoresFound += 1;
    } else {
      description += `\u200b \u200b \u200b \u200b${getRank(player.rank)} ${player.name}\n`;
    }
  }

  embed.setDescription(description);

  return embed;
}
