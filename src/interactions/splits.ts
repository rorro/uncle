import {
  ActionRow,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonComponent,
  ButtonInteraction,
  ComponentType,
  EmbedBuilder,
  MessageActionRowComponent,
  MessageFlags
} from 'discord.js';
import { appendIntoSheet, getSheetData, insertIntoSheet } from '../api/googleHandler';
import config from '../config';
import { isStaff } from '../utils';

export async function saveSplit(interaction: ButtonInteraction) {
  if (!interaction.inCachedGuild()) return;

  if (!isStaff(interaction.member)) {
    await interaction.reply({
      content: 'You need to be a staff member to use this button.',
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  const originalRow = interaction.message.components[0];
  await interaction.update({ components: [disableButtons(originalRow, true)] });

  try {
    const toWrite = JSON.parse(interaction.message.content.replaceAll('||', '').slice(2));
    const embed = new EmbedBuilder(interaction.message.embeds[0].toJSON());

    await appendIntoSheet(config.googleDrive.newSplitsSheet, `Bot splits dump!A1`, [toWrite]);

    embed.setFooter({ text: `Approved by: ${interaction.user.displayName}` });
    await interaction.editReply({ content: '', embeds: [embed], components: [] });
  } catch (e) {
    console.log(`ERROR approving split, ${e}`);

    await interaction.editReply({ components: [disableButtons(originalRow, false)] });
    await interaction.followUp({
      content: `Something went wrong, show this to Rorro ${e}`,
      flags: MessageFlags.Ephemeral
    });
    return;
  }
}

export async function denySplit(interaction: ButtonInteraction) {
  if (!interaction.inCachedGuild()) return;

  if (!isStaff(interaction.member)) {
    await interaction.followUp({
      content: 'You need to be a staff member to use this button.',
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  const originalRow = interaction.message.components[0];
  await interaction.update({ components: [disableButtons(originalRow, true)] });

  try {
    const embed = new EmbedBuilder(interaction.message.embeds[0].toJSON());
    embed.setFooter({ text: `Denied by: ${interaction.user.displayName}` }).setColor('DarkRed');

    await interaction.editReply({ content: '', embeds: [embed], components: [] });
  } catch (e) {
    console.log(`ERROR denying split, ${e}`);
    await interaction.editReply({ components: [disableButtons(originalRow, false)] });

    await interaction.followUp({
      content: `Something went wrong, show this to Rorro ${e}`,
      flags: MessageFlags.Ephemeral
    });
    return;
  }
}

function disableButtons(
  originalRow: ActionRow<MessageActionRowComponent>,
  disable: boolean
): ActionRowBuilder<ButtonBuilder> {
  const newRow = new ActionRowBuilder<ButtonBuilder>();

  originalRow.components.forEach(button => {
    if (button.type !== ComponentType.Button) return;

    newRow.addComponents(ButtonBuilder.from(button as ButtonComponent).setDisabled(disable));
  });

  return newRow;
}
