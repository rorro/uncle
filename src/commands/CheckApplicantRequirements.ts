import {
  ChatInputCommandInteraction,
  Client,
  EmbedBuilder,
  ApplicationCommandType,
  ApplicationCommandOptionType
} from 'discord.js';
import { Command } from 'src/types';
import { RWAPI, womClient } from '../api/handler';
import config from '../config';
import { hasRole } from '../utils';
import db from '../db';
import { getConfigValue } from '../database/handler';

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

    const reply = new EmbedBuilder()
      .setTitle(`Requirements check for ${rsn}`)
      .setURL(`https://wiseoldman.net/players/${rsn.replaceAll(' ', '%20')}`);

    const clanIcon = await getConfigValue('clanIcon');
    if (clanIcon) reply.setThumbnail(clanIcon);

    try {
      await womClient.players.updatePlayer(rsn);
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
      const response = await womClient.players.getPlayerDetails(rsn);
      if (response === null) return;

      const skills = Object.entries(response.latestSnapshot.data.skills);
      const bosses = Object.entries(response.latestSnapshot.data.bosses);

      let description = '**Skills and Kill Counts**\n';

      config.requirements.forEach(requirement => {
        switch (requirement.type) {
          case 'other': // right now only combat level is others
            description += `${response.combatLevel >= requirement.threshold ? '✅' : '❌'} ${
              requirement.threshold
            }${requirement.name} (${response.combatLevel})\n`;
            break;
          case 'skill':
            const skill = skills.find(([name]) => name === requirement.metric);
            if (!skill) break;
            const [, skillValue] = skill;
            description += `${skillValue.level >= requirement.threshold ? '✅' : '❌'} ${
              requirement.threshold
            } ${requirement.name} (${skillValue.level})\n`;
            break;
          case 'boss':
            const boss = bosses.find(([name]) => name === requirement.metric);
            if (!boss) break;
            const [, bossValue] = boss;
            const bossKc = Math.max(bossValue.kills, 0);

            let altBossKc = 0;
            if (requirement.alternative) {
              const altBoss = bosses.find(([name]) => name === requirement.alternative);
              if (altBoss) {
                const [, altBossValue] = altBoss;
                altBossKc = Math.max(altBossValue.kills, 0);
              }
            }

            description += `${bossKc + altBossKc >= requirement.threshold ? '✅' : '❌'} ${
              requirement.threshold
            }kc ${requirement.name} (${bossKc}, ${altBossKc})\n`;
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
        reply.setDescription(e.response.data.message);
      } else {
        reply.setDescription(`${e.name}\n${e.message}`);
      }
      reply.setColor('#FF0000');
      await interaction.followUp({ embeds: [reply] });
    }
  }
};
