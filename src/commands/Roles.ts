import {
  ChatInputCommandInteraction,
  Client,
  ApplicationCommandType,
  ApplicationCommandOptionType,
  AttachmentBuilder,
  EmbedBuilder,
  Guild
} from 'discord.js';
import { Command } from '../types';
import { hasRole, isStaff } from '../utils';
import config from '../config';

export const rolesCommand: Command = {
  name: 'roles',
  description: 'Get information about roles on the server.',
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      type: ApplicationCommandOptionType.Subcommand,
      name: 'get',
      description: 'Get all members with certain roles',
      options: [
        {
          name: 'roles',
          description: `Discord role IDs separated by commas. Example: 691419580438020168, 997287886313500683`,
          type: ApplicationCommandOptionType.String,
          required: true
        }
      ]
    },
    {
      type: ApplicationCommandOptionType.Subcommand,
      name: 'give',
      description: 'Give members a new role',
      options: [
        {
          name: 'currentrole',
          description: `The role to look for when fetching members`,
          type: ApplicationCommandOptionType.Role,
          required: true
        },
        {
          name: 'newrole',
          description: `The new role to assign to everyone`,
          type: ApplicationCommandOptionType.Role,
          required: true
        }
      ]
    }
  ],
  run: async (client: Client, interaction: ChatInputCommandInteraction) => {
    if (!interaction.inCachedGuild() || !interaction.isCommand()) return;

    if (!isStaff(interaction.member)) {
      await interaction.reply({
        content: 'You need to be a staff member to use this command!'
      });
      return;
    }

    await interaction.deferReply({});

    const subCommand = interaction.options.getSubcommand();

    switch (subCommand) {
      case 'get':
        const roles = interaction.options.getString('roles', true);

        const regex = new RegExp(/^\d+(,\d+)*$/);
        if (!regex.test(roles.replaceAll(' ', ''))) {
          await interaction.followUp({
            content: `The given format was wrong. Please use the following format: 691419580438020168,997287886313500683`
          });
          return;
        }

        const rolesToCheck = roles.split(',');

        const allMembers = await fetchMembersWithRole(interaction.guild, rolesToCheck);

        const amount = allMembers.size;
        let content = `Total matched: ${amount}\n\n`;
        allMembers.forEach(
          m =>
            (content += `${!!m.nickname ? m.nickname : m.user.username}, ${m.user.username}#${
              m.user.discriminator
            }, ${m.user.id}\n`)
        );

        const attchment = new AttachmentBuilder(Buffer.from(content), { name: 'matched.txt' });

        const embed = new EmbedBuilder();
        let description = `Found **${amount}** ${
          amount === 1 ? 'person' : 'people'
        } with the following roles: `;
        rolesToCheck.forEach(r => (description += `<@&${r}>`));
        embed.setDescription(description);

        await interaction.followUp({
          embeds: [embed],
          files: [attchment]
        });
        break;
      case 'give':
        const roleToFetch = interaction.options.getRole('currentrole', true);
        const newRole = interaction.options.getRole('newrole', true);

        const membersWithRole = await fetchMembersWithRole(interaction.guild, [roleToFetch.id]);

        for (const [memberId, member] of membersWithRole) {
          try {
            await member.roles.add(newRole);
          } catch (error) {
            console.log(`Skipped ${member.user.username} while giving role.`, error);
          }
        }

        const resultEmbed = new EmbedBuilder();
        resultEmbed.setDescription(
          `Gave **${membersWithRole.size}** ${
            membersWithRole.size === 1 ? 'person' : 'people'
          } the following role: ${newRole}`
        );

        await interaction.followUp({
          embeds: [resultEmbed]
        });
        break;
    }
  }
};

async function fetchMembersWithRole(guild: Guild, rolesToCheck: string[]) {
  let allMembers = await guild.members.fetch();

  for (const [memberId, member] of allMembers) {
    const memberRoles = member.roles.cache.map(r => r.id);
    if (memberRoles.length < rolesToCheck.length || !rolesToCheck.every(r => memberRoles.includes(r))) {
      allMembers.delete(memberId);
    }
  }

  return allMembers;
}
