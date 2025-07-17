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

      const skills = response.latestSnapshot.data.skills;
      const bosses = response.latestSnapshot.data.bosses;

      let description = '**Skills and Kill Counts**\n';

      description += `${response.combatLevel >= 115 ? '✅' : '❌'} 115+ Combat (${
        response.combatLevel
      })\n`;

      description += `${skills.prayer.level >= 70 ? '✅' : '❌'} 70 Prayer (${skills.prayer.level})\n`;

      description += `${skills.herblore.level >= 70 ? '✅' : '❌'} 78 Herblore (${
        skills.herblore.level
      })\n`;

      const cox =
        Math.max(0, bosses.chambers_of_xeric.kills) +
        Math.max(0, bosses.chambers_of_xeric_challenge_mode.kills);
      const tob =
        Math.max(0, bosses.theatre_of_blood.kills) +
        Math.max(0, bosses.theatre_of_blood_hard_mode.kills);
      const toa = bosses.tombs_of_amascut_expert.kills;
      const threshold = 25;

      description += `${
        cox >= threshold || tob >= threshold || toa >= threshold ? '✅' : '❌'
      } 25kc in any raid (CoX: ${cox}, ToB: ${tob}, ToA: ${toa})\n`;

      description += `\n**Other stats**\n`;
      description += `Range: ${skills.ranged.level}\n`;
      description += `Mage: ${skills.magic.level}\n`;
      description += `Slayer: ${skills.slayer.level}\n`;

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
