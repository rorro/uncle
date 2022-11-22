import { ChatInputCommandInteraction, Client, ApplicationCommandType } from 'discord.js';
import { Command } from '../types';
import KnexDB from '../database/knex';

export const helpCommand: Command = {
  name: 'help',
  description: 'All the helpful information about the bot',
  type: ApplicationCommandType.ChatInput,
  run: async (client: Client, interaction: ChatInputCommandInteraction) => {
    const content = 'So far I only do stuff for the staff members.';

    await KnexDB.getAllScheduledMessages();
    await interaction.reply({
      ephemeral: true,
      content: content
    });
  }
};
