import { createTranscript, ExportReturnType } from 'discord-html-transcripts';
import {
  ButtonInteraction,
  Client,
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  EmbedBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  ChannelType,
  TextChannel
} from 'discord.js';
import * as fs from 'fs';
import path from 'path';
import config from '../config';
import { createChannel } from '../discord';
import KnexDB from '../database/knex';

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

  const embedFromDB =
    channelType === 'application'
      ? await KnexDB.getConfigItem('application_embed')
      : await KnexDB.getConfigItem('support_embed');
  if (embedFromDB === null || typeof embedFromDB === 'number') return;
  const properEmbed = JSON.parse(embedFromDB);

  const channelConfig =
    channelType === 'application'
      ? {
          databaseCategory: 'open_applications',
          description: `Post screenshots of **ONLY** the required items and prayers. Every screenshot **must** show your username.

    If a current Legacy member referred you to us, please mention their RSN.
              
    When done, or if you have any questions, please ping @Staff and we'll be with you shortly.`
        }
      : {
          databaseCategory: 'open_support_tickets',
          description: `Hi there, how can we help you?`,
          footer: `This channel is visible only to you and staff members.`
        };

  const openApplication = await KnexDB.getOpenChannel(
    interaction.user.id,
    channelConfig.databaseCategory
  );

  if (openApplication && interaction.client.channels.cache.has(openApplication.channel.id)) {
    interaction.editReply(
      `You already have an open application. Head over to <#${openApplication.channel.id}> to continue.`
    );
    return;
  }

  const applicantChannel = await createChannel(interaction.guild, parent, interaction.user, channelType);
  if (applicantChannel.type !== ChannelType.GuildText) return;

  await interaction.editReply({
    content: `Head over to ${applicantChannel} to continue.`
  });

  await KnexDB.insertIntoOpenChannels(
    interaction.user.id,
    JSON.stringify(interaction.user),
    JSON.stringify(applicantChannel),
    channelConfig.databaseCategory
  );

  const embed = new EmbedBuilder().setColor('DarkPurple').setDescription(channelConfig.description);

  const clanIcon = (await KnexDB.getConfigItem('clan_icon')) as string;
  if (clanIcon) embed.setThumbnail(clanIcon);

  const requirementsImage = (await KnexDB.getConfigItem('requirements_image')) as string;
  if (requirementsImage && channelType === 'application') embed.setImage(requirementsImage);

  if (channelType === 'support' && channelConfig.footer) embed.setFooter({ text: channelConfig.footer });

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`close_channel:${channelType}`)
      .setLabel('Close')
      .setEmoji('🔒')
      .setStyle(ButtonStyle.Secondary)
  );

  await applicantChannel.send({
    content: `${interaction.user} ${properEmbed.content}`,
    embeds: [properEmbed.embed],
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

  const channel = interaction.channel;
  if (!channel || channel.type !== ChannelType.GuildText) return;

  const databaseCategory = channelType === 'application' ? 'open_applications' : 'open_support_tickets';
  const descriptionName = channelType === 'application' ? 'Application' : 'Support ticket';

  const applicant = await KnexDB.getOpenChannelUser(interaction.channelId, databaseCategory);
  if (!applicant) {
    await channel.send({
      content:
        'Applicant was not found for this application. You are free to remove the channel manually.'
    });
    return;
  }

  await channel.edit({
    permissionOverwrites: [
      { id: config.guild.roles.staff, allow: [PermissionFlagsBits.ViewChannel] },
      { id: interaction.guild.roles.everyone, deny: [PermissionFlagsBits.ViewChannel] }
    ]
  });

  await KnexDB.deleteFromOpenChannels(applicant.user.id, databaseCategory);
  await interaction.message.delete();

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`save_transcript:${channelType}/${applicant.user.id}`)
      .setLabel('Save Transcript')
      .setStyle(ButtonStyle.Primary)
      .setEmoji('🧾'),

    new ButtonBuilder()
      .setCustomId('delete_channel')
      .setLabel('Delete')
      .setStyle(ButtonStyle.Danger)
      .setEmoji('⛔')
  );

  await channel.send({
    content: `${descriptionName} closed by ${interaction.user}.`,
    components: [row]
  });
}

export async function deleteChannel(interaction: ButtonInteraction) {
  await interaction.channel?.delete();
  return;
}

export async function saveTranscript(
  client: Client,
  interaction: ButtonInteraction,
  channelInfo: string
): Promise<void> {
  if (!interaction.inCachedGuild()) return;

  await interaction.deferReply();
  await interaction.editReply('Saving transcript...');

  const channel = interaction.channel;
  if (!channel || channel.type !== ChannelType.GuildText) return;

  const [channelType, userId] = channelInfo.split('/');
  const descriptionName = channelType === 'application' ? 'Application' : 'Support';

  const applicant = await client.users.fetch(userId);
  if (!applicant) {
    await channel.send({
      content: 'Didnt find the applicant'
    });
    return;
  }

  const transcriptsChannelId = (await KnexDB.getConfigItem('transcripts_channel')) as string;

  const transcriptsChannel =
    transcriptsChannelId !== null
      ? (client.channels.cache.get(transcriptsChannelId) as TextChannel)
      : undefined;

  if (!transcriptsChannel) {
    await channel.send({
      content: 'Transcript was not saved because no transcript channel is set.'
    });
    return;
  }

  const transcriptName = `transcript-${channel.name}.html`;

  const URL = config.API.url;
  const PORT = config.API.port;
  const transcriptUrl = `${URL}:${PORT}/transcripts/${transcriptName}`;

  try {
    const transcript = await createTranscript(channel, {
      returnType: ExportReturnType.Buffer,
      saveImages: true,
      poweredBy: false
    });

    fs.writeFileSync(path.join('.transcripts', transcriptName), transcript);

    const embed = new EmbedBuilder()
      .setAuthor({
        name: `${descriptionName}: ${applicant.username}${
          applicant.discriminator === '0' ? '' : applicant.discriminator
        }`,
        iconURL: applicant.displayAvatarURL()
      })
      .setColor(channelType === 'application' ? 'DarkGold' : 'Navy')
      .addFields([
        { name: 'Ticket Owner', value: `${applicant}`, inline: true },
        { name: 'Ticket Name', value: channel.name, inline: true },
        { name: 'Direct Transcript', value: `[Direct Transcript](${transcriptUrl})`, inline: true }
      ]);

    await transcriptsChannel.send({
      embeds: [embed],
      files: [new AttachmentBuilder(transcript, { name: transcriptName })]
    });

    await interaction.editReply({
      content: `Transcript saved to ${transcriptsChannel}.`
    });
  } catch (e) {
    await channel.send({
      content: `Something went wrong while saving the transcript. The user probably left the server before closing channel.\n${e}`
    });
  }
}
