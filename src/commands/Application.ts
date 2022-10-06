import {
  ChatInputCommandInteraction,
  Client,
  ActionRowBuilder,
  ButtonBuilder,
  EmbedBuilder,
  ButtonStyle,
  ApplicationCommandType,
  ApplicationCommandOptionType,
  ChannelType
} from 'discord.js';
import { getConfigValue, insertIntoChannels } from '../database/handler';
import config from '../config';
import db from '../db';
import { Command } from '../types';
import { hasRole } from '../utils';

export const applicationCommand: Command = {
  name: 'application',
  description: 'All new application commands',
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      type: ApplicationCommandOptionType.Subcommand,
      name: 'send_application_message',
      description: 'Send the application message used to start application status',
      options: [
        {
          name: 'application_channel',
          description: 'The channel where application process is started from',
          type: ApplicationCommandOptionType.Channel,
          channelTypes: [ChannelType.GuildText],
          required: true
        }
      ]
    },
    {
      type: ApplicationCommandOptionType.Subcommand,
      name: 'set_transcript_channel',
      description: 'Where transcript messages will be sent',
      options: [
        {
          name: 'transcripts_channel',
          description: 'The channel channel where closed application transcript messages will be sent',
          type: ApplicationCommandOptionType.Channel,
          channelTypes: [ChannelType.GuildText],
          required: true
        }
      ]
    }
  ],
  run: async (client: Client, interaction: ChatInputCommandInteraction) => {
    if (!interaction.inCachedGuild() || !interaction.isCommand()) return;

    if (!hasRole(interaction.member, config.guild.roles.staff)) {
      await interaction.reply({
        ephemeral: true,
        content: 'You need to be a staff member to use this command!'
      });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    const subCommand = interaction.options.getSubcommand();
    let content = '';

    switch (subCommand) {
      case 'send_application_message':
        const selectedChannel = interaction.options.getChannel('application_channel', true);
        if (selectedChannel.type !== ChannelType.GuildText) return;

        const embed = new EmbedBuilder()
          .setTitle('Legacy Application')
          .setColor('DarkPurple')
          .setDescription('If you wish to apply, click the "Start Application" button below.');

        const clanIcon = await getConfigValue('clanIcon');
        if (clanIcon) embed.setThumbnail(clanIcon);

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId('start_channel:application')
            .setLabel('Start Application')
            .setEmoji('📝')
            .setStyle(ButtonStyle.Primary)
        );

        await selectedChannel.send({ embeds: [embed], components: [row] });
        await interaction.followUp({
          content: `A new application message has been sent in ${selectedChannel}.`
        });
        return;
      case 'set_transcript_channel':
        const transcriptsChannel = interaction.options.getChannel('transcripts_channel', true);

        await insertIntoChannels('transcriptsChannel', transcriptsChannel.id);

        await interaction.followUp({
          content: `Transcripts channel has been set to ${transcriptsChannel}`
        });
        return;
    }

    await interaction.followUp({
      content: content ? content : 'Something went wrong.'
    });
  }
};
