import { BaseCommandInteraction, Client, MessageEmbed } from 'discord.js';
import { ApplicationCommandOptionTypes } from 'discord.js/typings/enums';
import { Command } from 'src/types';
import { getApplicantRoles, hasRole, sendMessageInChannel } from '../utils';
import { copyDiary, changePermissions, getTasksCompleted, getWebViewLink } from '../api/googleHandler';
import config from '../config';

export const acceptApplicationCommand: Command = {
  name: 'accept_application',
  description: 'Accept an applicant into the clan',
  type: 'CHAT_INPUT',
  options: [
    {
      name: 'rsn',
      description: 'In-game name of the applicant',
      type: ApplicationCommandOptionTypes.STRING,
      required: true
    },
    {
      name: 'discord_user',
      description: 'Tag the user, example: @Rro',
      type: ApplicationCommandOptionTypes.USER,
      required: true
    }
  ],

  run: async (client: Client, interaction: BaseCommandInteraction) => {
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
    const discordUser = interaction.options.getMember('discord_user', true);

    try {
      // Copy the diary sheet and give the user the correct roles
      const diaryId = (await copyDiary(rsn)) as string;
      await changePermissions(diaryId);
      const tasksCompleted = await getTasksCompleted(diaryId, rsn);
      const applicantRoles = getApplicantRoles(tasksCompleted);
      const webViewLink = await getWebViewLink(diaryId);

      await discordUser.setNickname(rsn);
      await discordUser.roles.add(applicantRoles);

      const reply = new MessageEmbed()
        .setTitle(`Successfully accepted ${rsn}`)
        .addField('Diary Tasks Completed', tasksCompleted)
        .addField('Roles Given', applicantRoles.map(roleId => `<@&${roleId}>`).join(' '))
        .addField('Diary Sheet Link', webViewLink ? webViewLink : 'No link could be created.');

      const DM = `Hi! I'm the official bot of Legacy, Uncle. I'm giving you a copy of our Legacy Diary. Completing tasks and submitting this sheet is required for most of our rank ups. I have already filled in your main account and some tasks have automatically been completed but others will require screenshot evidence of personal bests. Talk to any of our staff if you have any questions!\n\nYour sheet can be found here: ${webViewLink}`;
      let introMessage = `Welcome <@${discordUser.id}>!\nFeel free to introduce yourself a little in this channel. Please check out <#${config.guild.channels.assignRoles}> and read <#${config.guild.channels.rules}>.\nA staff member can meet you in-game to invite you to the clan. Until then you should join the in-game clan "Legacy" as a guest. If you see a staff member <:burnt:953065386130145331> online, ask them to meet you.\n`;

      await discordUser
        .send({ content: DM })
        .then(() => {
          introMessage += `I sent you a Legacy Diary sheet in a PM. You can read more about that at <#${config.guild.channels.legacyDiary}>.`;
        })
        .catch(e => {
          introMessage += `\nI wasn't able to send you a PM with the diary sheet link. Under privacy settings for the server, enable direct messages and a staff member will PM you the link.`;
        })
        .then(async () => {
          await sendMessageInChannel(client, config.guild.channels.newMembers, introMessage);
        });

      interaction.followUp({
        embeds: [reply]
      });
    } catch (e) {
      interaction.followUp({ content: `Something went wrong: ${e}` });
    }
  }
};
