import { BaseCommandInteraction, Client, Interaction } from 'discord.js';
import { commands } from '../commands';

export default (client: Client): void => {
  client.on('interactionCreate', async (interaction: Interaction) => {
    if (!interaction.isCommand()) return;

    await handleSlashCommand(client, interaction);
  });
};

const handleSlashCommand = async (
  client: Client,
  interaction: BaseCommandInteraction
): Promise<void> => {
  const slashCommand = commands.find(c => c.name === interaction.commandName);

  if (!slashCommand) {
    interaction.followUp({ content: 'An error has occured.', ephemeral: true });
    return;
  }

  slashCommand.run(client, interaction);
};
