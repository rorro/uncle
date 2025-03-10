import { ChatInputCommandInteraction, Client, Interaction, MessageFlags, TextChannel } from 'discord.js';
import { commands } from '../commands';
import {
  cancelClose,
  closeChannel,
  comfirmClose,
  deleteChannel,
  startChannel,
  saveTranscript
} from '../interactions/channels';
import { SPEED_CATEGORIES } from '../utils';
import { denySplit, saveSplit } from '../interactions/splits';

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
      const [command, channel] = interaction.customId.split(':');

      switch (command) {
        case 'start_channel':
          await startChannel(interaction, channel);
          break;
        case 'close_channel':
          await closeChannel(client, interaction, channel);
          break;
        case 'close_close':
          await comfirmClose(client, interaction, channel);
          break;
        case 'close_cancel':
          await cancelClose(interaction);
          break;
        case 'delete_channel':
          await deleteChannel(interaction);
          break;
        case 'save_transcript':
          await saveTranscript(client, interaction, channel);
          break;
        case 'split_approve':
          await saveSplit(interaction);
          break;
        case 'split_deny':
          await denySplit(interaction);
          break;
      }
    }

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
