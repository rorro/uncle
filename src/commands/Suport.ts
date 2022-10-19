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
import { getConfigValue } from '../database/handler';
import config from '../config';
import db from '../db';
import { Command } from '../types';
import { hasRole } from '../utils';

export const supportCommand: Command = {
  name: 'support',
  description: 'All support commands',
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      type: ApplicationCommandOptionType.Subcommand,
      name: 'send_support_message',
      description: 'Send the support message used to open a support ticket',
      options: [
        {
          name: 'support_channel',
          description: 'The channel where support process is started from',
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
      case 'send_support_message':
        const selectedChannel = interaction.options.getChannel('support_channel', true);
        if (selectedChannel.type !== ChannelType.GuildText) return;

        const embed = new EmbedBuilder()
          .setTitle('Legacy Support')
          .setColor('DarkPurple')
          .setDescription('If you wish to open a support ticket, click the "Open Ticket" button below.');

        const clanIcon = await getConfigValue('clanIcon');
        if (clanIcon) embed.setThumbnail(clanIcon);

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId('start_channel:support')
            .setLabel('Open Ticket')
            .setEmoji('🎟️')
            .setStyle(ButtonStyle.Primary)
        );

        await selectedChannel.send({ embeds: [embed], components: [row] });
        await interaction.followUp({
          content: `A new support ticket message has been sent in ${selectedChannel}.`
        });
        return;
    }

    await interaction.followUp({
      content: content ? content : 'Something went wrong.'
    });
  }
};
