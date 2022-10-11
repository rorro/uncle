import { ChatInputCommandInteraction, Client, ApplicationCommandType } from 'discord.js';
import {
  deleteFromMessages,
  getAllMessages,
  getMessageIdByName,
  getMessagesByType,
  insertIntoMessages
} from '../database/helpers';
import { MessageType } from '../database/types';
import { Command } from 'src/types';

export const helpCommand: Command = {
  name: 'help',
  description: 'All the helpful information about the bot',
  type: ApplicationCommandType.ChatInput,
  run: async (client: Client, interaction: ChatInputCommandInteraction) => {
    const content = 'So far I only do stuff for the staff members.';

    await interaction.reply({
      ephemeral: true,
      content: content
    });
  }
};
