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
import {
  changePermissions,
  copyDiary,
  getSheetData,
  getTasksCompleted,
  getWebViewLink,
  insertIntoSheet
} from '../api/googleHandler';
import config from '../config';
import { sendMessageInChannel } from '../discord';
import { getRoleName, isStaff } from '../utils';
import KnexDB from '../database/knex';

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
        content: 'You need to be an application manager to use this command!'
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
        content: 'New members channel where welcome messages are sent has not been configured.'
      });
      return;
    }

    try {
      // Copy the diary sheet and give the user the correct roles
      const diaryId = (await copyDiary(rsn)) as string;
      await changePermissions(diaryId);
      const tasksCompleted = await getTasksCompleted(diaryId, rsn);
      const applicantRoles = [config.guild.roles.member, config.guild.roles.bulwark];
      const webViewLink = await getWebViewLink(diaryId);
      const todaysDate = `=DATE(${dayjs().format('YYYY,MM,DD')})`;

      const data = await getSheetData(config.googleDrive.splitsSheet, 'Data!1:900', 'FORMULA');
      const usernames = await getSheetData(
        config.googleDrive.splitsSheet,
        'Data!A1:A',
        'FORMATTED_VALUE'
      );
      const players = data?.slice(3);

      let inSplitsSheet = false;
      for (const { index, value } of (players as any[][]).map((value, index) => ({ index, value }))) {
        if (value.at(0).toString().toLowerCase() === rsn.toLowerCase()) {
          inSplitsSheet = true;
          const [rank, altAccount] = [value.at(3), value.at(7)];

          let inputValues = [
            value.at(0), // Primary account name, A
            value.at(1), // rank icon, B
            value.at(2), // rank, C
            rank, // old rank, D
            value.at(4), // Intro, E
            value.at(5), // Intermediate, F
            value.at(6), // Advanced, G
            altAccount, // Secondary account name, H
            value.at(8), // Alt Intro, I
            value.at(9), // Alt Intermediate, J
            value.at(10), // Alt Advanced. K
            value.at(11), // alt rank, L
            value.at(12), // alt old rank, M
            value.at(13), // Diary tasks (old), N
            tasksCompleted.split(' / ')[0], // Diary tasks, O
            todaysDate, // join date, P
            webViewLink // diary link, Q
          ];

          insertIntoSheet(config.googleDrive.splitsSheet, `Data!A${index + 4}`, [inputValues]);
        }
      }

      if (!inSplitsSheet) {
        const rowToInsertInto = usernames?.slice(3).length as number;
        const inputValues = [
          rsn, // name
          players?.at(rowToInsertInto)?.at(1), // icon
          players?.at(rowToInsertInto)?.at(2), // rank
          getRoleName(applicantRoles[1]), // old rank, 3
          0, // Intro, 4
          0, // Intermediate, 5
          0, // Advanced, 6
          '', // alt account name, 7
          0, // Alt Intro, 8
          0, // Alt Intermediate, 9
          0, // Alt Advanced, 10
          players?.at(rowToInsertInto)?.at(11), //alt rank
          players?.at(rowToInsertInto)?.at(12), // alt old rank
          players?.at(rowToInsertInto)?.at(13), // Diary tasks (old)
          tasksCompleted.split(' / ')[0], // diary tasks, 14
          todaysDate, // join date, 15
          webViewLink // diary link, 16
        ];

        insertIntoSheet(config.googleDrive.splitsSheet, `Data!A${rowToInsertInto + 4}`, [inputValues]);
      }

      await discordUser.setNickname(rsn);
      await discordUser.roles.add(applicantRoles);

      const reply = new EmbedBuilder().setTitle(`Successfully accepted ${rsn}`).addFields([
        { name: 'Diary Tasks Completed', value: tasksCompleted },
        { name: 'Roles Given', value: applicantRoles.map(roleId => `<@&${roleId}>`).join(' ') },
        { name: 'Diary Sheet Link', value: webViewLink ? webViewLink : 'No link could be created.' }
      ]);

      const clanIcon = (await KnexDB.getConfigItem('clan_icon')) as string;
      if (clanIcon) reply.setThumbnail(clanIcon);

      const configData = await KnexDB.getAllConfigs();
      const DM = `${configData.welcome_pm_message}\n\nYour sheet can be found here: ${webViewLink}`;
      let introMessage = `Welcome <@${discordUser.id}>!\n${configData.welcome_base_message}`;

      await discordUser
        .send({ content: DM })
        .then(() => {
          introMessage += configData.welcome_success_message;
        })
        .catch(e => {
          introMessage += configData.welcome_error_message;
        })
        .then(async () => {
          await sendMessageInChannel(client, newMembersChannelId, {
            content: introMessage
          });

          const inactivityCheckChannel = (await KnexDB.getConfigItem(
            'inactivity_check_channel'
          )) as string;
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
        });

      interaction.followUp({
        embeds: [reply]
      });
    } catch (e) {
      interaction.followUp({ content: `Something went wrong: ${e}` });
      console.log(e);
    }
  }
};
