import { ChannelType } from 'discord.js';
import client from './bot';
import KnexDB from './database/knex';
import { MessageType, PetLeaderboardEntry } from './types';
import Pets from './pets';
import { sendMessageInChannel } from './discord';

export async function updatePets(): Promise<string> {
  const leaderboardChannelId = (await KnexDB.getConfigItem('leaderboard_channel')) as string;
  if (!leaderboardChannelId) {
    return 'Leaderboard channel has not been configured. Head over to the config section.';
  }

  const channel = client.channels.cache.get(leaderboardChannelId);
  if (channel?.type !== ChannelType.GuildText) {
    return `The configured leaderboard channel either doesn't exist or is not a text channel!`;
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

  const data = (await KnexDB.getPetsLeaderboard()).filter(p => !p.removed);
  const [leaderboard, scores] = getTopPetsIndex(data);

  console.log(leaderboard, scores);

  for (let i in scores) {
    const pets = scores[i];

    for (const j in leaderboard[scores[i]]) {
      const player = leaderboard[+scores[i]][j];
      const petMessage = buildMessage(player, +i + 1, pets);
      const messageId = await sendMessageInChannel(client, leaderboardChannelId, {
        content: petMessage
      });
      if (messageId === undefined) {
        return `Something went wrong when sending message for ${player}`;
      }

      await KnexDB.insertIntoMessages(
        `#${+i + 1} pets: ${player.username}`,
        messageId,
        `#${channel.name}`,
        MessageType.Pets
      );
    }
  }
  return 'Successfully updated pets hiscores.';
}

function buildMessage(player: PetLeaderboardEntry, rank: number, pets: number): string {
  let content = '';

  content += '```ini\n[#' + rank + ']: ' + player.username + ' (' + pets + ')```';

  Object.entries(player)
    .filter(([key, val]) => key !== 'id' && val === 1)
    .forEach(pet => {
      const [name] = pet;

      content += Pets.find(p => p.name === name)?.emoji + ' ';
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
