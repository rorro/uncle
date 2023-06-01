import {
  ChatInputCommandInteraction,
  Client,
  ApplicationCommandType,
  ApplicationCommandOptionType,
  ChannelType
} from 'discord.js';
import { MessageType, PetEntry, PetLeaderboardEntry } from '../types';
import config from '../config';
import { sendMessageInChannel } from '../discord';
import { Command } from '../types';
import { hasRole } from '../utils';
import KnexDB from '../database/knex';

export const petsCommand: Command = {
  name: 'pets',
  description: 'Show all pet emotes',
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      type: ApplicationCommandOptionType.Subcommand,
      name: 'updatetop5',
      description: 'Update pet leaderboard'
    }
  ],
  run: async (client: Client, interaction: ChatInputCommandInteraction) => {
    if (!interaction.inCachedGuild() || !interaction.isCommand()) return;

    await interaction.deferReply({ ephemeral: true });

    const subCommand = interaction.options.getSubcommand();
    let content = '';

    const emojis = await KnexDB.getAllPets();

    switch (subCommand) {
      case 'updatetop5':
        if (!hasRole(interaction.member, config.guild.roles.staff)) {
          await interaction.followUp({
            content: 'You need to be a staff member to use this command!'
          });
          return;
        }

        const leaderboardChannelId = (await KnexDB.getConfigItem('leaderboard_channel')) as string;
        if (!leaderboardChannelId) {
          await interaction.followUp({
            content: 'Leaderboard channel has not been configured.'
          });
          return;
        }

        const channel = client.channels.cache.get(leaderboardChannelId);
        if (channel?.type !== ChannelType.GuildText) {
          await interaction.followUp({
            content: `The configured leaderboard channel either doesn't exist or is not a text channel!`
          });
          return;
        }

        try {
          const messages = await KnexDB.getMessagesByType(MessageType.Pets);
          messages.forEach(async message => {
            try {
              // Delete the old pet hiscore messages
              await (await channel.messages.fetch(message.message_id)).delete();
            } catch (error) {
              console.error('Old pet message not found.');
            }
          });
          await KnexDB.deleteFromMessages({ type: MessageType.Pets });
        } catch (e) {
          console.error('No message IDs found.');
        }

        const [leaderboard, scores] = getTopPetsIndex(await KnexDB.getPetsLeaderboard());

        for (let i in scores) {
          const pets = scores[i];

          for (const j in leaderboard[scores[i]]) {
            const player = leaderboard[+scores[i]][j];
            const petMessage = buildMessage(emojis, player, +i + 1, pets);
            const messageId = await sendMessageInChannel(client, leaderboardChannelId, {
              content: petMessage
            });
            if (messageId === undefined) {
              await interaction.followUp({ content: 'Something went wrong when sending message' });
              return;
            }

            await KnexDB.insertIntoMessages(
              `#${+i + 1} pets: ${player.username}`,
              messageId,
              `#${channel.name}`,
              MessageType.Pets
            );
            content = 'Pets hiscores updated.';
          }
        }
        break;
    }

    await interaction.followUp({
      content: content ? content : 'Something went wrong.'
    });
  }
};

function buildMessage(
  emojiData: PetEntry[],
  player: PetLeaderboardEntry,
  rank: number,
  pets: number
): string {
  let content = '';

  content += '```ini\n[#' + rank + ']: ' + player.username + ' (' + pets + ')```';

  Object.entries(player)
    .filter(([key, val]) => key !== 'id' && val === 1)
    .forEach(pet => {
      const [name] = pet;

      content += emojiData.find(p => p.name === name)?.emoji + ' ';
    });

  return content;
}

interface PlayerPets {
  [key: number]: [PetLeaderboardEntry];
}

function getTopPetsIndex(players: PetLeaderboardEntry[]): [PlayerPets, number[]] {
  let allPets: PlayerPets = {};

  for (const player of players) {
    const pets = Object.entries(player).filter(([key, val]) => key !== 'id' && val === 1).length;

    if (allPets[pets]) {
      allPets[pets].push(player);
    } else {
      allPets[pets] = [player];
    }
  }

  const top5 = Object.keys(allPets)
    .map(Number)
    .sort((a, b) => b - a)
    .slice(0, 5);

  return [allPets, top5];
}
