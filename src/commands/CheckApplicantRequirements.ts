import { BaseCommandInteraction, Client, MessageEmbed } from 'discord.js';
import { ApplicationCommandOptionTypes } from 'discord.js/typings/enums';
import { SnapshotSkill } from '../api/types';
import { Command } from 'src/types';
import { WOMAPI, RWAPI } from '../api/handler';
import config from '../config';
import { getLevel, isApplicationManager, SKILLS } from '../utils';

export const checkApplicantRequirementsCommand: Command = {
  name: 'check_requirements',
  description: 'Check if a new applicant meets the requirements to join the clan',
  type: 'CHAT_INPUT',
  options: [
    {
      name: 'rsn',
      description: 'RSN of the applicant',
      type: ApplicationCommandOptionTypes.STRING,
      required: true
    }
  ],

  run: async (client: Client, interaction: BaseCommandInteraction) => {
    if (!interaction.inCachedGuild()) return;

    if (!isApplicationManager(interaction.member)) {
      await interaction.reply({
        ephemeral: true,
        content: 'You need to be an application manager to use this command!'
      });
      return;
    }

    await interaction.deferReply();
    const rsn = interaction.options.get('rsn', true).value;
    const trackUrl = `${config.wiseoldmanAPI}/players/track`;
    const getUrl = `${config.wiseoldmanAPI}/players/username/${rsn}`;

    const reply = new MessageEmbed().setTitle(`Requirements check for ${rsn}`);

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
      await WOMAPI.post(trackUrl, { username: rsn });
    } catch (e: any) {
      reply.setDescription(e.response?.data?.message);
      reply.setColor('#FF0000');
      await interaction.editReply({ embeds: [reply] });
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

      const data = response.data;
      const snapshot = data.latestSnapshot;
      const requirements = [
        {
          name: `${config.requirements.combatLevel}+ Combat`,
          value: data.combatLevel >= config.requirements.combatLevel
        },
        {
          name: `${config.requirements.totalLevel}+ Total`,
          value: totalLevel >= config.requirements.totalLevel
        },
        // Skills
        {
          name: `${config.requirements.prayer} Prayer`,
          value: getLevel(snapshot.prayer.experience) >= config.requirements.prayer
        },
        {
          name: `${config.requirements.ranged} Ranged`,
          value: getLevel(snapshot.ranged.experience) >= config.requirements.ranged
        },
        {
          name: `${config.requirements.magic} Magic`,
          value: getLevel(snapshot.magic.experience) >= config.requirements.magic
        },
        {
          name: `${config.requirements.agility} Agility`,
          value: getLevel(snapshot.agility.experience) >= config.requirements.agility
        },
        {
          name: `${config.requirements.herblore} Herblore`,
          value: getLevel(snapshot.herblore.experience) >= config.requirements.herblore
        },
        // Bosses
        {
          name: `${config.requirements.chambers_of_xeric}kc CoX or ${config.requirements.theatre_of_blood}kc ToB`,
          value:
            Math.max(snapshot.chambers_of_xeric.kills, 0) +
              Math.max(snapshot.chambers_of_xeric_challenge_mode.kills, 0) >=
              config.requirements.chambers_of_xeric ||
            Math.max(snapshot.theatre_of_blood.kills, 0) +
              Math.max(snapshot.theatre_of_blood_hard_mode.kills, 0) >=
              config.requirements.theatre_of_blood
        }
      ];

      let description = '**Skills and Kill Counts**\n';
      requirements.forEach(requirement => {
        description += `${requirement.value ? '✅' : '❌'} ${requirement.name}\n`;
      });

      description += `\n**RuneWatch**\n${rwResult}`;

      reply.setDescription(description);

      reply.setColor('#00FF00');

      await interaction.editReply({
        embeds: [reply]
      });
    } catch (e: any) {
      reply.setDescription(
        e.response?.data?.message || "Something went wrong. Maybe the username doesn't exist."
      );
      reply.setColor('#FF0000');
      await interaction.editReply({ embeds: [reply] });
    }
  }
};
