import { createTranscript, ExportReturnType } from 'discord-html-transcripts';
import {
  ButtonInteraction,
  Client,
  GuildTextBasedChannel,
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  EmbedBuilder,
  ButtonStyle,
  PermissionFlagsBits
} from 'discord.js';
import * as fs from 'fs';
import path from 'path';
import config from '../config';
import db from '../db';
import { createChannel } from '../discord';

export async function startChannel(interaction: ButtonInteraction, channelType: string) {
  if (!interaction.inCachedGuild()) return;

  await interaction.deferReply({ ephemeral: true });

  await interaction.editReply({ content: `Starting ${channelType} process...` });

  const parent = interaction.channel?.parentId;
  if (!parent) {
    interaction.editReply(
      `This channel is not in a category and will therefore not work. Ask a staff member for help.`
    );
    return;
  }

  const channelConfig =
    channelType === 'application'
      ? {
          databaseCategory: 'openApplications',
          description: `Post screenshots of **ONLY** the required items and prayers. Every screenshot **must** show your username.

    If a current Legacy member referred you to us, please mention their RSN.
              
    When done, or if you have any questions, please ping @Staff and we'll be with you shortly.`
        }
      : {
          databaseCategory: 'openSupportTickets',
          description: `Hi there, how can we help you?`
        };

  const applicantChannel = await createChannel(interaction.guild, parent, interaction.user, channelType);
  if (!applicantChannel.isTextBased()) return;

  await interaction.editReply({
    content: `Head over to ${applicantChannel} to continue.`
  });

  db.database.push(`/${channelConfig.databaseCategory}/${applicantChannel.id}`, interaction.user.id);

  const embed = new EmbedBuilder()
    .setColor('DarkPurple')
    .setThumbnail(db.database.getData('/config/clanIcon'))
    .setDescription(channelConfig.description);

  if (channelType === 'application') {
    embed.setImage(db.database.getData('/config/requirements'));
  }

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`close_channel:${channelType}`)
      .setLabel('Close')
      .setEmoji('🔒')
      .setStyle(ButtonStyle.Secondary)
  );

  await applicantChannel.send({
    content: `${interaction.user} Welcome to your ${channelType} channel.`,
    embeds: [embed],
    components: [row]
  });
}

export async function closeChannel(client: Client, interaction: ButtonInteraction, channelType: string) {
  await interaction.deferReply();
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`close_close:${channelType}`)
      .setLabel('Close')
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('close_cancel').setLabel('Cancel').setStyle(ButtonStyle.Secondary)
  );

  await interaction.followUp({
    content: `Are you sure you want to close this ${
      channelType === 'support' ? 'support ticket' : channelType
    }?`,
    components: [row]
  });
}

export async function cancelClose(interaction: ButtonInteraction) {
  if (!interaction.inCachedGuild()) return;

  interaction.message.delete();
}

export async function comfirmClose(client: Client, interaction: ButtonInteraction, channelType: string) {
  if (!interaction.inCachedGuild()) return;

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('delete_channel')
      .setLabel('Delete')
      .setStyle(ButtonStyle.Danger)
      .setEmoji('⛔')
  );

  const channel = interaction.channel;
  if (!channel) return;

  const databaseCategory = channelType === 'application' ? 'openApplications' : 'openSupportTickets';
  const descriptionName = channelType === 'application' ? 'Application' : 'Support ticket';

  const openApplication = db.database.exists(`/${databaseCategory}/${interaction.channelId}`);
  const applicantId = openApplication
    ? db.database.getData(`/${databaseCategory}/${interaction.channelId}`)
    : undefined;
  if (applicantId !== undefined) {
    await channel.edit({
      permissionOverwrites: [
        { id: config.guild.roles.staff, allow: [PermissionFlagsBits.ViewChannel] },
        { id: interaction.guild.roles.everyone, deny: [PermissionFlagsBits.ViewChannel] }
      ]
    });
  }

  db.database.delete(`/${databaseCategory}/${interaction.channelId}`);
  await interaction.message.delete();

  let description = `${descriptionName} closed by ${interaction.user}.`;

  if (channelType === 'application') {
    const transcriptsChannel = db.database.exists('/transcriptsChannel')
      ? (client.channels.cache.get(db.database.getData('/transcriptsChannel')) as GuildTextBasedChannel)
      : undefined;

    if (transcriptsChannel) {
      const transcriptSaved = await saveTranscript(client, channel, transcriptsChannel, applicantId);
      if (!transcriptSaved) {
        await channel.send({
          content:
            'Transcript was not saved because the applicant left the server before application was closed.',
          components: [row]
        });
        return;
      }
      description += ` Transcript saved to ${transcriptsChannel}.`;
    }
  }

  const embed = new EmbedBuilder().setDescription(description);
  await channel.send({ embeds: [embed], components: [row] });
  return;
}

export async function deleteChannel(interaction: ButtonInteraction) {
  await interaction.channel?.delete();
  return;
}

async function saveTranscript(
  client: Client,
  channel: GuildTextBasedChannel,
  transcriptsChannel: GuildTextBasedChannel,
  applicantId: string
): Promise<Boolean> {
  const applicant = client.users.cache.get(applicantId);
  if (!applicant) return false;

  const transcript = await createTranscript(channel, {
    returnType: ExportReturnType.Buffer,
    saveImages: true,
    poweredBy: false
  });

  const transcriptName = `transcript-${channel.name}.html`;
  fs.writeFileSync(path.join('.transcripts', transcriptName), transcript);

  const URL = config.API.url;
  const PORT = config.API.port;
  const transcriptUrl = `http://${URL}:${PORT}/transcripts/${transcriptName}`;

  const embed = new EmbedBuilder()
    .setAuthor({
      name: `${applicant?.username}#${applicant?.discriminator}`,
      iconURL: applicant.displayAvatarURL()
    })
    .addFields([
      { name: 'Ticket Owner', value: `${applicant}`, inline: true },
      { name: 'Ticket Name', value: channel.name, inline: true },
      { name: 'Direct Transcript', value: `[Direct Transcript](${transcriptUrl})`, inline: true }
    ]);

  await transcriptsChannel.send({
    embeds: [embed],
    files: [new AttachmentBuilder(transcript, { name: transcriptName })]
  });
  return true;
}
