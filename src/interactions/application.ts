import * as discordTranscripts from 'discord-html-transcripts';
import {
  ButtonInteraction,
  Client,
  GuildTextBasedChannel,
  MessageActionRow,
  MessageAttachment,
  MessageButton,
  MessageEmbed,
  Permissions
} from 'discord.js';
import * as fs from 'fs';
import path from 'path';
import config from '../config';
import db from '../db';
import { createChannel } from '../discord';

export async function startApplication(interaction: ButtonInteraction) {
  if (!interaction.inCachedGuild()) return;

  await interaction.deferReply({ ephemeral: true });

  await interaction.editReply({ content: 'Starting application process...' });

  const parent = interaction.channel?.parentId;
  if (!parent) {
    interaction.editReply(
      `This channel is not in a category and will therefore not work. Ask a staff member for help.`
    );
    return;
  }

  const applicantChannel = await createChannel(interaction.guild, parent, interaction.user);
  await interaction.editReply({
    content: `Head over to ${applicantChannel} to continue with the application.`
  });

  db.database.push(`/openApplications/${applicantChannel.id}`, interaction.user.id);

  const embed = new MessageEmbed()
    .setColor('DARK_PURPLE')
    .setThumbnail(db.database.getData('/config/clanIcon'))
    .setImage(db.database.getData('/config/requirements'))
    .setDescription(
      `Post screenshots of **ONLY** the required items and prayers. Every screenshot **must** show your username.

If a current Legacy member referred you to us, please mention their RSN.
          
When done, or if you have any questions, please ping @Staff and we'll be with you shortly.`
    );

  const row = new MessageActionRow().addComponents(
    new MessageButton()
      .setCustomId('application_close')
      .setLabel('Close')
      .setEmoji('🔒')
      .setStyle('SECONDARY')
  );
  await applicantChannel.send({
    content: `${interaction.user} Welcome to your application channel.`,
    embeds: [embed],
    components: [row]
  });
}

export async function closeApplication(client: Client, interaction: ButtonInteraction) {
  await interaction.deferReply();
  const row = new MessageActionRow().addComponents(
    new MessageButton().setCustomId('close_close').setLabel('Close').setStyle('DANGER'),
    new MessageButton().setCustomId('close_cancel').setLabel('Cancel').setStyle('SECONDARY')
  );
  await interaction.followUp({
    content: 'Are you sure you want to close this application?',
    components: [row]
  });
}

export async function cancelClose(interaction: ButtonInteraction) {
  if (!interaction.inCachedGuild()) return;

  interaction.message.delete();
}

export async function comfirmClose(client: Client, interaction: ButtonInteraction) {
  if (!interaction.inCachedGuild()) return;

  const row = new MessageActionRow().addComponents(
    new MessageButton()
      .setCustomId('delete_application')
      .setLabel('Delete')
      .setStyle('DANGER')
      .setEmoji('⛔')
  );

  const channel = interaction.channel;
  if (!channel) return;

  const openApplication = db.database.exists(`/openApplications/${interaction.channelId}`);
  const applicantId = openApplication
    ? db.database.getData(`/openApplications/${interaction.channelId}`)
    : undefined;
  if (applicantId !== undefined) {
    await channel.edit({
      permissionOverwrites: [
        { id: config.guild.roles.staff, allow: [Permissions.FLAGS.VIEW_CHANNEL] },
        { id: interaction.guild.roles.everyone, deny: [Permissions.FLAGS.VIEW_CHANNEL] }
      ]
    });
  }

  db.database.delete(`/openApplications/${interaction.channelId}`);
  await interaction.message.delete();

  const transcriptsChannel = db.database.exists('/transcriptsChannel')
    ? (client.channels.cache.get(db.database.getData('/transcriptsChannel')) as GuildTextBasedChannel)
    : undefined;

  let description = `Application closed by ${interaction.user}.`;
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

  const embed = new MessageEmbed().setDescription(description);
  await channel.send({ embeds: [embed], components: [row] });
  return;
}

export async function deleteApplication(interaction: ButtonInteraction) {
  interaction.channel?.delete();
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

  const transcript = await discordTranscripts.createTranscript(channel, {
    returnType: 'buffer',
    minify: true,
    useCDN: true,
    saveImages: true
  });

  const transcriptName = `transcript-${channel.name}.html`;
  fs.writeFileSync(path.join('.transcripts', transcriptName), transcript);

  const URL = config.API.url;
  const PORT = config.API.port;
  const transcriptUrl = `http://${URL}:${PORT}/transcripts/${transcriptName}`;

  const embed = new MessageEmbed()
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
    files: [new MessageAttachment(transcript, transcriptName)]
  });
  return true;
}
