import dayjs from 'dayjs';
import {
  ChatInputCommandInteraction,
  Client,
  EmbedBuilder,
  ApplicationCommandType,
  ApplicationCommandOptionType
} from 'discord.js';
import { Command } from 'src/types';
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
import { getApplicantRoles, getRoleName, hasRole } from '../utils';
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
    if (!hasRole(interaction.member, config.guild.roles.applicationManager)) {
      await interaction.reply({
        ephemeral: true,
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
        ephemeral: true,
        content: 'New members channel where welcome messages are sent has not been configured.'
      });
      return;
    }

    try {
      // Copy the diary sheet and give the user the correct roles
      const diaryId = (await copyDiary(rsn)) as string;
      await changePermissions(diaryId);
      const tasksCompleted = await getTasksCompleted(diaryId, rsn);
      const applicantRoles = getApplicantRoles(tasksCompleted);
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
          const [rank, diaryTasks, totalPoints, altAccount] = [
            value.at(3),
            value.at(14),
            value.at(17),
            value.at(8)
          ];

          let inputValues = [
            value.at(0), // name
            value.at(1), // rank icon
            value.at(2), // rank
            rank, // old rank
            'FALSE', // adv gear
            'FALSE', // max gear
            value.at(6), // adv cox/tob kc
            value.at(7), // max cox/tob kc
            altAccount, // alt account name
            value.at(9), // alt adv gear
            value.at(10), // alt max gear
            value.at(11), // alt rank icon
            value.at(12), // alt rank
            value.at(13), // alt old rank
            diaryTasks, // diary tasks
            todaysDate, // join date
            value.at(16), // diary link
            totalPoints // clan points
          ];

          for (let j = 18; j < value.length; j++) {
            inputValues.push(value.at(j));
          }

          insertIntoSheet(config.googleDrive.splitsSheet, `Data!A${index + 4}`, [inputValues]);
        }
      }

      if (!inSplitsSheet) {
        const rowToInsertInto = usernames?.slice(3).length as number;
        const inputValues = [
          rsn, // name
          players?.at(rowToInsertInto)?.at(1), // icon
          players?.at(rowToInsertInto)?.at(2), // rank
          getRoleName(applicantRoles[1]), // old rank
          'FALSE', // adv gear
          'FALSE', // max gear
          'FALSE', // adv cox&tob kc
          'FALSE', // max cox/tob kc
          '', // alt account name
          'FALSE', // alt adv gear
          'FALSE', // alt max gear
          players?.at(rowToInsertInto)?.at(11), //alt rank icon
          players?.at(rowToInsertInto)?.at(12), // alt rank
          players?.at(rowToInsertInto)?.at(13), // alt old rank
          tasksCompleted, // diary tasks
          todaysDate, // join date
          webViewLink // diary link
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

      const DM = `Hi! I'm the official bot of Legacy, Uncle. I'm giving you a copy of our Legacy Diary. Completing tasks and submitting this sheet is required for most of our rank ups. I have already filled in your main account and some tasks have automatically been completed but others will require screenshot evidence of personal bests. Talk to any of our staff if you have any questions!\n\nYour sheet can be found here: ${webViewLink}`;
      let introMessage = `Welcome <@${
        discordUser.id
      }>!\nFeel free to introduce yourself a little in this channel. Please check out <#${await KnexDB.getConfigItem(
        'assign_roles_channel'
      )}> and read <#${await KnexDB.getConfigItem(
        'rules_channel'
      )}>.\nA staff member can meet you in-game to invite you to the clan. Until then you should join the in-game clan "Legacy" as a guest. If you see a staff member <:staff:995767143159304252> online, ask them to meet you.\n`;

      const diaryChannelId = await KnexDB.getConfigItem('diary_channel');
      await discordUser
        .send({ content: DM })
        .then(() => {
          introMessage += `I sent you a Legacy Diary sheet in a PM. You can read more about that at <#${diaryChannelId}>.`;
        })
        .catch(e => {
          introMessage += `\nI wasn't able to send you a PM with the diary sheet link. Under privacy settings for the server, enable direct messages and a staff member will PM you the link.`;
        })
        .then(async () => {
          await sendMessageInChannel(client, newMembersChannelId, {
            content: introMessage
          });
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
