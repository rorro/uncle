import { ButtonInteraction, EmbedBuilder, MessageFlags } from 'discord.js';
import { getSheetData, insertIntoSheet } from '../api/googleHandler';
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

  const toWrite = JSON.parse(interaction.message.content.replaceAll('||', '').slice(2));
  const embed = new EmbedBuilder(interaction.message.embeds[0].toJSON());

  try {
    const currentData = await getSheetData(
      config.googleDrive.newSplitsSheet,
      'Bot splits dump!A1:A',
      'FORMATTED_VALUE'
    );
    const index = currentData?.length as number;
    await insertIntoSheet(config.googleDrive.newSplitsSheet, `Bot splits dump!A${index + 1}`, [toWrite]);

    embed.setFooter({ text: `Approved by: ${interaction.user.displayName}` });
    await interaction.update({ content: '', embeds: [embed], components: [] });
  } catch (e) {
    await interaction.reply({
      content: `Something went wrong, show this to Rorro ${e}`,
      flags: MessageFlags.Ephemeral
    });
  }
}

export async function denySplit(interaction: ButtonInteraction) {
  if (!interaction.inCachedGuild()) return;

  if (!isStaff(interaction.member)) {
    await interaction.reply({
      content: 'You need to be a staff member to use this button.',
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  const embed = new EmbedBuilder(interaction.message.embeds[0].toJSON());

  try {
    embed.setFooter({ text: `Denied by: ${interaction.user.displayName}` }).setColor('DarkRed');
    await interaction.update({ content: '', embeds: [embed], components: [] });
  } catch (e) {
    await interaction.reply({
      content: `Something went wrong, show this to Rorro ${e}`,
      flags: MessageFlags.Ephemeral
    });
  }
}
