import {
  ChatInputCommandInteraction,
  Client,
  ApplicationCommandType,
  ApplicationCommandOptionType,
  AttachmentBuilder,
  EmbedBuilder
} from 'discord.js';
import { Command } from '../types';
import { hasRole } from '../utils';
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
    }
  ],
  run: async (client: Client, interaction: ChatInputCommandInteraction) => {
    if (!interaction.inCachedGuild() || !interaction.isCommand()) return;

    if (!hasRole(interaction.member, config.guild.roles.staff)) {
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

        await interaction.guild.members.fetch();

        let allMembers = await interaction.guild.members.fetch();

        for (const [memberId, member] of allMembers) {
          const memberRoles = member.roles.cache.map(r => r.id);
          if (
            memberRoles.length < rolesToCheck.length ||
            !rolesToCheck.every(r => memberRoles.includes(r))
          ) {
            allMembers.delete(memberId);
          }
        }

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
    }
  }
};
