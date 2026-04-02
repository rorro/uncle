import { ChatInputCommandInteraction, Client, Interaction, MessageFlags, TextChannel } from 'discord.js';
import { commands } from '../commands';

export default (client: Client): void => {
  client.on('interactionCreate', async (interaction: Interaction) => {
    if (!interaction.isChatInputCommand()) return;

    await handleSlashCommand(client, interaction);
  });
};

const handleSlashCommand = async (
  client: Client,
  interaction: ChatInputCommandInteraction
): Promise<void> => {
  const slashCommand = commands.find(c => c.name === interaction.commandName);

  if (!slashCommand) {
    interaction.followUp({ content: 'An error has occured.', flags: MessageFlags.Ephemeral });
    return;
  }

  slashCommand.run(client, interaction);
};
