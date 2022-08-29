import {
  BaseCommandInteraction,
  Client,
  MessageActionRow,
  MessageButton,
  MessageEmbed
} from 'discord.js';
import { ApplicationCommandOptionTypes, ChannelTypes } from 'discord.js/typings/enums';
import config from '../config';
import db from '../db';
import { Command } from '../types';
import { hasRole } from '../utils';

export const applicationCommand: Command = {
  name: 'application',
  description: 'All new application commands',
  type: 'CHAT_INPUT',
  options: [
    {
      type: ApplicationCommandOptionTypes.SUB_COMMAND,
      name: 'send_application_message',
      description: 'Send the application message used to start application status',
      options: [
        {
          name: 'application_channel',
          description: 'The channel where application process is started from',
          type: ApplicationCommandOptionTypes.CHANNEL,
          channelTypes: [ChannelTypes.GUILD_TEXT],
          required: true
        }
      ]
    },
    {
      type: ApplicationCommandOptionTypes.SUB_COMMAND,
      name: 'set_transcript_channel',
      description: 'Where transcript messages will be sent',
      options: [
        {
          name: 'transcripts_channel',
          description: 'The channel channel where closed application transcript messages will be sent',
          type: ApplicationCommandOptionTypes.CHANNEL,
          channelTypes: [ChannelTypes.GUILD_TEXT],
          required: true
        }
      ]
    }
  ],
  run: async (client: Client, interaction: BaseCommandInteraction) => {
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
        if (!selectedChannel.isText()) return;

        const embed = new MessageEmbed()
          .setTitle('Legacy Application')
          .setColor('DARK_PURPLE')
          .setDescription('If you wish to apply, click the "Start Application" button below.')
          .setThumbnail('https://i.imgur.com/a6cXmdO.png');

        const row = new MessageActionRow().addComponents(
          new MessageButton()
            .setCustomId('start_application')
            .setLabel('Start Application')
            .setEmoji('📝')
            .setStyle('PRIMARY')
        );

        await selectedChannel.send({ embeds: [embed], components: [row] });
        return;
      case 'set_transcript_channel':
        const transcriptsChannel = interaction.options.getChannel('transcripts_channel', true);

        db.database.push('/transcriptsChannel', transcriptsChannel.id);

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
