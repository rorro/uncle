import { ApplicationCommandOptionChoice, BaseCommandInteraction, Client, Interaction } from 'discord.js';
import { getSheetData } from '../api/googleHandler';
import { commands } from '../commands';
import config from '../config';
import { SPEED_CATEGORIES } from '../utils';

export default (client: Client): void => {
  client.on('interactionCreate', async (interaction: Interaction) => {
    if (interaction.isAutocomplete()) {
      const focused = interaction.options.getFocused(true);
      const currentValue = focused.value.toString();

      if (focused.name === 'leaderboard_metric') {
        const options = SPEED_CATEGORIES.filter(c =>
          !currentValue ? true : [c.toLowerCase()].some(str => str.includes(currentValue.toLowerCase()))
        ).map(category => ({
          name: category,
          value: category.toLowerCase()
        }));

        interaction.respond(options.slice(0, 25));
      }
    }

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
