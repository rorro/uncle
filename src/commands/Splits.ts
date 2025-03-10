import {
  ChatInputCommandInteraction,
  Client,
  EmbedBuilder,
  ApplicationCommandType,
  ApplicationCommandOptionType,
  Attachment,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags
} from 'discord.js';
import { Command } from '../types';

export const splitsCommand: Command = {
  name: 'splits',
  description: 'Show various information about splits.',
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: 'value',
      description: 'The total value of the item in millions.',
      type: ApplicationCommandOptionType.Number,
      required: true
    },
    {
      name: 'screenshot',
      description: 'Screenshot of drop.',
      type: ApplicationCommandOptionType.Attachment,
      required: true
    },
    {
      name: 'player1',
      description: '1st player you split with.',
      type: ApplicationCommandOptionType.User,
      required: true
    },
    {
      name: 'player2',
      description: '2nd player you split with.',
      type: ApplicationCommandOptionType.User,
      required: false
    },
    {
      name: 'player3',
      description: '3rd player you split with.',
      type: ApplicationCommandOptionType.User,
      required: false
    },
    {
      name: 'player4',
      description: '4th player you split with.',
      type: ApplicationCommandOptionType.User,
      required: false
    },
    {
      name: 'player5',
      description: '5th player you split with.',
      type: ApplicationCommandOptionType.User,
      required: false
    },
    {
      name: 'player6',
      description: '6th player you split with.',
      type: ApplicationCommandOptionType.User,
      required: false
    },
    {
      name: 'player7',
      description: '7th player you split with.',
      type: ApplicationCommandOptionType.User,
      required: false
    }
  ],
  run: async (client: Client, interaction: ChatInputCommandInteraction) => {
    if (!interaction.inCachedGuild() || !interaction.isCommand()) return;

    await interaction.deferReply({});
    const screenshot = interaction.options.getAttachment('screenshot', true);

    if (!isImageAttachment(screenshot)) {
      await interaction.followUp({
        content: `Invalid screenshot. Please make sure you attach the correct screenshot when submitting a split.`,
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    const value = interaction.options.getNumber('value', true);
    const player1 = interaction.options.getUser('player1', true);

    const teamMates = ['player2', 'player3', 'player4', 'player5', 'player6', 'player7'].map(p => {
      return interaction.options.getUser(p, false);
    });

    const members = await interaction.guild.members.fetch();

    const p1 = members.get(player1.id);
    const teamMateNicknames = teamMates
      .map(t => t && `"${members.get(t.id)?.displayName}"`)
      .filter(n => n)
      .join(',');

    const embed = new EmbedBuilder()
      .setTitle(`${interaction.member.displayName} is splitting ${value}m`)
      .setDescription(
        '**Item recipient**\n' +
          `${interaction.user}\n\n` +
          `**Split value**\n` +
          `${value}m\n\n` +
          '**Splitting with**\n' +
          `${player1} ${teamMates.filter(p => p)}`
      )
      .setImage(screenshot.url)
      .setColor('DarkGreen');

    const createdAt = interaction.createdAt;
    const date = `${createdAt.getFullYear()},${createdAt.getMonth() + 1},${createdAt.getDate()}`;

    const content =
      `[${value},` +
      `"=DATE(${date})",` +
      `"${interaction.member.displayName}",` +
      `"${p1?.displayName}",${teamMateNicknames}` +
      `]`;

    const actions = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId('split_approve').setLabel('Approve').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`split_deny`).setLabel('Deny').setStyle(ButtonStyle.Danger)
    );

    await interaction.followUp({
      content: `-# ||${content}||`,
      embeds: [embed],
      components: [actions]
    });
  }
};

export function isImageAttachment(attachment: Attachment): boolean {
  return (
    attachment.contentType !== null &&
    attachment.contentType.startsWith('image/') &&
    attachment.width !== null &&
    attachment.height !== null
  );
}
