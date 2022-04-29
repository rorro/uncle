import { BaseCommandInteraction, Client } from 'discord.js';
import { Command } from 'src/types';

export const helpCommand: Command = {
  name: 'help',
  description: 'Help a poor soul',
  type: 'CHAT_INPUT',
  run: async (client: Client, interaction: BaseCommandInteraction) => {
    const content =
      "I don't do anything yet. I will do loads of cool stuff soon, but for now I'm just your uncle.";

    await interaction.reply({
      ephemeral: true,
      content: content
    });
  }
};
