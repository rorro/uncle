import dayjs from 'dayjs';
import {
  ChatInputCommandInteraction,
  Client,
  EmbedBuilder,
  ApplicationCommandType,
  ApplicationCommandOptionType,
  MessageFlags
} from 'discord.js';
import { Command, ScheduledMessageEntry, ScheduledMessageType } from '../types';
import { getSheetData, insertIntoSheet } from '../api/googleHandler';
import config from '../config';
import { sendMessageInChannel } from '../discord';
import { isStaff } from '../utils';
import KnexDB from '../database/knex';
import { womClient } from '../api/handler';
import { Boss, BossValue, MapOf } from '@wise-old-man/utils';

export const acceptApplicationCommand: Command = {
  name: 'accept_application',
  description: 'Accept an applicant into the clan',
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: 'rsn',
      description: 'In-game name of the applicant',
      type: ApplicationCommandOptionType.String,
      required: true
    },
    {
      name: 'discord_user',
      description: 'Tag the user, example: @Rro',
      type: ApplicationCommandOptionType.User,
      required: true
    }
  ],

  run: async (client: Client, interaction: ChatInputCommandInteraction) => {
    if (!interaction.inCachedGuild() || !interaction.isCommand()) return;
    if (!isStaff(interaction.member)) {
      await interaction.reply({
        flags: MessageFlags.Ephemeral,
        content: 'You need to be a staff member to use this command!'
      });
      return;
    }

    await interaction.deferReply();
    const rsn = interaction.options.getString('rsn', true);
    const discordUser = interaction.options.getMember('discord_user');

    if (!discordUser) {
      throw Error('User not found');
    }

    const newMembersChannelId = (await KnexDB.getConfigItem('new_members_channel')) as string;
    if (!newMembersChannelId) {
      await interaction.followUp({
        flags: MessageFlags.Ephemeral,
        content:
          'New members channel where welcome messages are sent has not been configured. Please head over to the dashboard and configure it.'
      });
      return;
    }

    try {
      // Copy the diary sheet and give the user the correct roles
      const applicantRoles = [config.guild.roles.member];

      const data = await getSheetData(
        config.googleDrive.newSplitsSheet,
        'New Summary!A:Z',
        'FORMATTED_VALUE'
      );
      if (!data) {
        throw Error('Failed to fetch data from the splits sheet');
      }

      const usernames = data.map(value => value.at(0).toLowerCase()).filter(Boolean);
      const previousMember = usernames.includes(rsn.toLowerCase());
      const index = previousMember ? usernames.indexOf(rsn.toLowerCase()) : usernames.length + 1;

      const womData = await womClient.players.getPlayerDetails(rsn);
      const { ehb, latestSnapshot } = womData;
      if (!latestSnapshot) {
        throw Error('No Wise Old Man data found for this user. Did you check their stats first?');
      }

      let totalPoints = 0;
      const ehbPoints = getEhbPoints(ehb);
      const kcPoints = getKcPoints(latestSnapshot.data.bosses);
      totalPoints += ehbPoints + kcPoints;

      let description = '';

      if (previousMember) {
        // Include their previous clan points
        const playerData = data.at(index);
        const [, , , , , , , , pointsFromSplits, , pointsFromEvents] = playerData as string[];

        console.log(pointsFromSplits, pointsFromEvents);

        totalPoints += Number(pointsFromSplits) + Number(pointsFromEvents);
        description += `Points from splits: ${pointsFromSplits}\nPoints from events: ${pointsFromEvents}`;
      } else {
        await insertIntoSheet(config.googleDrive.newSplitsSheet, `New Splits Summary!A${index}`, [
          [rsn]
        ]);
      }
      description += `\nEHB points: ${ehbPoints}\nKC points: ${kcPoints}\n**Total points**: ${totalPoints}\n`;

      applicantRoles.push(getRank(totalPoints));

      await discordUser.setNickname(rsn);
      await discordUser.roles.add(applicantRoles);

      const reply = new EmbedBuilder()
        .setTitle(`Successfully accepted ${rsn}`)
        .addFields([
          { name: 'Roles Given', value: applicantRoles.map(roleId => `<@&${roleId}>`).join(' ') }
        ])
        .setDescription(description);

      const clanIcon = (await KnexDB.getConfigItem('clan_icon')) as string;
      if (clanIcon) reply.setThumbnail(clanIcon);

      const configData = await KnexDB.getAllConfigs();
      const introMessage = `${configData.welcome_base_message.replaceAll(
        '<@user>',
        `<@${discordUser.id}>`
      )}`;
      const personalMessage = `${configData.welcome_pm_message.replaceAll(
        '<@user>',
        `<@${discordUser.id}>`
      )}`;

      await sendMessageInChannel(client, newMembersChannelId, {
        content: introMessage
      });

      const inactivityCheckChannel = (await KnexDB.getConfigItem('inactivity_check_channel')) as string;
      if (inactivityCheckChannel) {
        const now = dayjs();
        const scheduledEmbed = new EmbedBuilder().setTitle(`30 day checkup: ${rsn}`).addFields([
          { name: 'Join date', value: now.format('YYYY-MM-DD HH:mm') },
          {
            name: 'Past month gains',
            value: `[Wise Old Man link](https://wiseoldman.net/players/${rsn.replaceAll(
              ' ',
              '%20'
            )}/gained/skilling?period=month)`
          },
          {
            name: 'Discord user',
            value: `${discordUser}`
          }
        ]);
        const scheduledMessage: ScheduledMessageEntry = {
          message: JSON.stringify({ content: '', embed: scheduledEmbed }),
          date: now.add(30, 'day').format('YYYY-MM-DD HH:mm'),
          channel: inactivityCheckChannel,
          type: ScheduledMessageType.Embed
        };
        await KnexDB.insertScheduledMessage(scheduledMessage);
      }

      interaction.followUp({
        content: personalMessage,
        embeds: [reply]
      });
    } catch (e) {
      interaction.followUp({ content: `Something went wrong: ${e}` });
      console.log(e);
    }
  }
};

function getKcPoints(bosses: MapOf<Boss, BossValue>): number {
  let bossPoints = 0;

  bossPoints += bosses.tzkal_zuk.kills >= 2 ? 5 : 0;
  bossPoints += bosses.sol_heredit.kills >= 5 ? 5 : 0;
  // Combined raids kc (excluding regular toa)
  const kc1k =
    bosses.chambers_of_xeric.kills +
      bosses.chambers_of_xeric_challenge_mode.kills +
      bosses.theatre_of_blood.kills +
      bosses.theatre_of_blood_hard_mode.kills +
      bosses.tombs_of_amascut_expert.kills >
    1000;
  bossPoints += kc1k ? 5 : 0;
  // 100kc and 200kc each raid (excluding regular toa)
  const kc100 =
    bosses.chambers_of_xeric.kills + bosses.chambers_of_xeric_challenge_mode.kills >= 100 &&
    bosses.theatre_of_blood.kills + bosses.theatre_of_blood_hard_mode.kills >= 100 &&
    bosses.tombs_of_amascut_expert.kills >= 100;
  bossPoints += kc100 ? 10 : 0;

  const kc200 =
    bosses.chambers_of_xeric.kills + bosses.chambers_of_xeric_challenge_mode.kills >= 200 &&
    bosses.theatre_of_blood.kills + bosses.theatre_of_blood_hard_mode.kills >= 200 &&
    bosses.tombs_of_amascut_expert.kills >= 200;
  bossPoints += kc200 ? 10 : 0;
  // 100kc cox cm and tob hm
  const kc100cmhm =
    bosses.chambers_of_xeric_challenge_mode.kills >= 100 &&
    bosses.theatre_of_blood_hard_mode.kills >= 100;
  bossPoints += kc100cmhm ? 10 : 0;

  console.log(kc100, kc200, kc1k, kc100cmhm);

  return bossPoints;
}

function getEhbPoints(ehb: number): number {
  return Math.min(Math.floor(ehb / 500) * 5, 20);
}

function getRank(points: number): string {
  if (points < 25) return config.guild.roles.protector;
  if (points < 50) return config.guild.roles.bulwark;
  if (points < 75) return config.guild.roles.justiciar;
  if (points < 100) return config.guild.roles.sentry;
  return config.guild.roles.guardian;
}
