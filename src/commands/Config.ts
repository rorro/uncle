import { BaseCommandInteraction, Client } from 'discord.js';
import { Command } from '../types';
import { hasRole } from '../utils';
import config from '../config';
import db from '../db';
import { ApplicationCommandOptionTypes } from 'discord.js/typings/enums';
import { URL } from 'url';

export const configCommand: Command = {
  name: 'config',
  description: 'Configure various links',
  type: 'CHAT_INPUT',
  options: [
    {
      name: 'item',
      description: `What to configure`,
      type: ApplicationCommandOptionTypes.STRING,
      required: true,
      choices: [
        { name: 'Clan Icon', value: 'clanIcon' },
        { name: 'Requirements', value: 'requirements' }
      ]
    },
    {
      name: 'link',
      description: 'An imgur link works best',
      type: ApplicationCommandOptionTypes.STRING,
      required: true
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

    const toConfigure = interaction.options.getString('item', true);
    const link = interaction.options.getString('link', true);

    if (!isValidUrl(link)) {
      await interaction.followUp({ content: 'The URL provided is not valid.' });
      return;
    }

    db.database.push(`/config/${toConfigure}`, link);

    await interaction.followUp({
      content: `${toConfigure} has been configured to ${link}.`
    });
  }
};

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
}
