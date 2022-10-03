import {
  ChatInputCommandInteraction,
  Client,
  EmbedBuilder,
  ApplicationCommandType,
  ApplicationCommandOptionType
} from 'discord.js';
import { Command } from 'src/types';
import { RWAPI, WOMAPI } from '../api/handler';
import { SnapshotSkill } from '../api/types';
import config from '../config';
import { getLevel, hasRole, SKILLS } from '../utils';
import db from '../db';

export const checkApplicantRequirementsCommand: Command = {
  name: 'check_requirements',
  description: 'Check if a new applicant meets the requirements to join the clan',
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: 'rsn',
      description: 'RSN of the applicant',
      type: ApplicationCommandOptionType.String,
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
    const trackUrl = `${config.wiseoldmanAPI}/players/track`;
    const getUrl = `${config.wiseoldmanAPI}/players/username/${rsn}`;

    const reply = new EmbedBuilder()
      .setTitle(`Requirements check for ${rsn}`)
      .setURL(`https://wiseoldman.net/players/${rsn.replace(' ', '%20')}`)
      .setThumbnail(db.database.getData('/config/clanIcon'));

    try {
      await WOMAPI.post(trackUrl, { username: rsn });
    } catch (e: any) {
      if (e.response?.data?.message) {
        reply.setDescription(e.response?.data?.message);
      } else {
        reply.setDescription(`${e.name}\n${e.message}`);
      }
      reply.setColor('#FF0000');
      await interaction.editReply({ embeds: [reply] });
      return;
    }

    let rwResult = '';
    try {
      const rwSearch = await RWAPI.get(`${config.runewatchAPI}${rsn}`);
      rwResult = `Type: ${rwSearch.data[0].type}\nDate: ${new Date(rwSearch.data[0].date_of_abuse * 1000)
        .toISOString()
        .slice(0, 10)}\nLink: ${rwSearch.data[0].url}`;
    } catch (e: any) {
      rwResult = 'No case found for that username';
    }

    try {
      const response = await WOMAPI.get(getUrl);

      let totalLevel = 0;
      Object.entries(response.data.latestSnapshot).forEach(([key, value]) => {
        if (SKILLS.includes(key)) {
          const val = value as SnapshotSkill;
          totalLevel += getLevel(val.experience);
        }
      });

      let data = response.data;
      const snapshot = data.latestSnapshot;
      data['totalLevel'] = totalLevel; // Add it here to make the loop below with less edge cases

      let description = '**Skills and Kill Counts**\n';

      config.requirements.forEach(requirement => {
        switch (requirement.type) {
          case 'other':
            description += `${data[requirement.metric] >= requirement.threshold ? '✅' : '❌'} ${
              requirement.threshold
            }${requirement.name} (${data[requirement.metric]})\n`;
            break;
          case 'skill':
            const level = getLevel(snapshot[requirement.metric].experience);
            description += `${level >= requirement.threshold ? '✅' : '❌'} ${requirement.threshold} ${
              requirement.name
            } (${level})\n`;
            break;
          case 'boss':
            const bossKc = Math.max(snapshot[requirement.metric].kills, 0);
            const alternativeKc = requirement.alternative
              ? Math.max(snapshot[requirement.alternative].kills, 0)
              : 0;
            description += `${bossKc + alternativeKc >= requirement.threshold ? '✅' : '❌'} ${
              requirement.threshold
            }kc ${requirement.name} (${bossKc}, ${alternativeKc})\n`;
            break;
        }
      });

      description += `\n**RuneWatch**\n${rwResult}`;

      reply.setDescription(description);

      reply.setColor('#00FF00');

      await interaction.editReply({
        embeds: [reply]
      });
    } catch (e: any) {
      if (e.response?.data?.message) {
        reply.setDescription(e.response?.data?.message);
      } else {
        reply.setDescription(`${e.name}\n${e.message}`);
      }
      reply.setColor('#FF0000');
      await interaction.editReply({ embeds: [reply] });
    }
  }
};
