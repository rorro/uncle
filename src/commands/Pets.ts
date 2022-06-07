import { BaseCommandInteraction, Client } from 'discord.js';
import { Command, PETS } from '../types';

export const petsCommand: Command = {
  name: 'pets',
  description: 'Show all pet emotes',
  type: 'CHAT_INPUT',
  run: async (client: Client, interaction: BaseCommandInteraction) => {
    let content = '';
    PETS.forEach(pet => {
      content += '\\' + pet;
    });

    await interaction.reply({
      ephemeral: true,
      content: content
    });
  }
};
