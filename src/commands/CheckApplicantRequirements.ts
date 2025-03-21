import {
  ChatInputCommandInteraction,
  Client,
  EmbedBuilder,
  ApplicationCommandType,
  ApplicationCommandOptionType,
  MessageFlags
} from 'discord.js';
import { Command } from 'src/types';
import { RWAPI, womClient } from '../api/handler';
import config from '../config';
import { isStaff } from '../utils';
import db from '../database/operations';

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

    if (!isStaff(interaction.member)) {
      await interaction.reply({
        flags: MessageFlags.Ephemeral,
        content: 'You need to be an application manager to use this command!'
      });
      return;
    }

    await interaction.deferReply();
    const rsn = interaction.options.getString('rsn', true);

    const reply = new EmbedBuilder()
      .setTitle(`Requirements check for ${rsn}`)
      .setURL(`https://wiseoldman.net/players/${rsn.replaceAll(' ', '%20')}`);

    const clanIcon = db.getConfigItem('clan_icon') as string;
    if (clanIcon) reply.setThumbnail(clanIcon);

    let recentlyUpdated = false;
    try {
      await womClient.players.updatePlayer(rsn);
    } catch (e: any) {
      if (e.name === 'RateLimitError' && e.message.includes('updated recently')) {
        recentlyUpdated = true;
      }
      if (!recentlyUpdated) {
        if (e.response?.data?.message) {
          reply.setDescription(e.response?.data?.message);
        } else {
          reply.setDescription(`${e.name}\n${e.message}`);
        }
        reply.setColor('#FF0000');
        await interaction.editReply({ embeds: [reply] });
        return;
      }
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
      if (response === null || response.latestSnapshot === null) return;

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
            }${requirement.name} (${skillValue.level})\n`;
            break;
          case 'boss':
            const boss = bosses.find(([name]) => name === requirement.metric);
            if (!boss) break;
            const [, bossValue] = boss;
            const bossKc = Math.max(bossValue.kills, 0);

            let altBossKc = 0;
            if (requirement.alternatives) {
              for (const alt of requirement.alternatives) {
                const altBoss = bosses.find(([name]) => name === alt);

                if (altBoss) {
                  const [, altBossValue] = altBoss;
                  altBossKc += Math.max(altBossValue.kills, 0);
                }
              }
            }

            description += `${bossKc + altBossKc >= requirement.threshold ? '✅' : '❌'} ${
              requirement.threshold
            }kc ${requirement.name} (${bossKc + (requirement.alternatives ? altBossKc : 0)})\n`;
            break;
          case 'warning':
            const warningMetric = bosses.find(([name]) => name === requirement.metric);
            if (!warningMetric) break;
            const [, warningMetricValue] = warningMetric;
            const wmv = Math.max(warningMetricValue.kills, 0);

            let amv = 0;
            if (requirement.alternatives) {
              for (const alt of requirement.alternatives) {
                const altMetric = bosses.find(([name]) => name === alt);

                if (altMetric) {
                  const [, altMetricValue] = altMetric;
                  amv = Math.max(altMetricValue.kills, 0);
                }
              }
            }

            description += `${
              wmv < requirement.threshold && amv < requirement.threshold
                ? '\n⚠️ SotE might not be completed\n'
                : ''
            }`;
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
