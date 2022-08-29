import { BaseCommandInteraction, Client, Interaction } from 'discord.js';
import { commands } from '../commands';
import {
  cancelClose,
  closeApplication,
  comfirmClose,
  deleteApplication,
  startApplication
} from '../interactions/application';
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
    } else if (interaction.isButton()) {
      switch (interaction.customId) {
        case 'start_application':
          await startApplication(interaction);
          break;
        case 'application_close':
          await closeApplication(client, interaction);
          break;
        case 'close_close':
          await comfirmClose(client, interaction);
          break;
        case 'close_cancel':
          await cancelClose(interaction);
          break;
        case 'delete_application':
          await deleteApplication(interaction);
          break;
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
