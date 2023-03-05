import {
  ChatInputCommandInteraction,
  Client,
  ApplicationCommandType,
  ApplicationCommandOptionType,
  ChannelType
} from 'discord.js';
import { MessageType } from '../types';
import { getSheetData } from '../api/googleHandler';
import config from '../config';
import { sendMessageInChannel } from '../discord';
import { Command, LeaderboardRecord } from '../types';
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
    },
    {
      type: ApplicationCommandOptionType.Subcommand,
      name: 'search',
      description: 'See what pets a player has',
      options: [
        {
          name: 'rsn',
          description: 'In-game name of player',
          type: ApplicationCommandOptionType.String,
          required: true
        }
      ]
    }
  ],
  run: async (client: Client, interaction: ChatInputCommandInteraction) => {
    if (!interaction.inCachedGuild() || !interaction.isCommand()) return;

    await interaction.deferReply({ ephemeral: true });

    const subCommand = interaction.options.getSubcommand();
    let content = '';
    const petData = await getSheetData(
      config.googleDrive.leaderboardSheet,
      config.googleDrive.petSheetRange,
      'FORMATTED_VALUE'
    );
    const emojis = petData?.at(0);

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

        const [petHiscores, scores] = getTopPetsIndex(petData);

        for (let i in scores) {
          for (const j in petHiscores[+scores[i]]) {
            const index = petHiscores[+scores[i]][j];
            const data = petData?.at(index);
            const petMessage = buildMessage(emojis, data, +i + 1);
            const messageId = await sendMessageInChannel(client, leaderboardChannelId, {
              content: petMessage
            });
            if (messageId === undefined) {
              await interaction.followUp({ content: 'Something went wrong when sending message' });
              return;
            }

            await KnexDB.insertIntoMessages(
              `#${+i + 1} pets: ${data?.at(0)}`,
              messageId,
              `#${channel.name}`,
              MessageType.Pets
            );
            content = 'Pets hiscores updated.';
          }
        }

        break;
      case 'search':
        const username = interaction.options.getString('rsn', true).toLowerCase();

        for (const { index, value } of (petData as any[][]).map((value, index) => ({ index, value }))) {
          if (value.at(0).toLowerCase() === username) {
            const pets = petData?.at(index)?.at(1);
            const pluses = petData?.at(index)?.at(2);

            content = buildMessage(emojis, value, index);

            await interaction.followUp({
              content: content
            });
            return;
          }
        }
        await interaction.followUp({
          content: `**${username}** doesn't have any pets. Ask them to submit a screenshot of their pets to a staff member so they can be included.`
        });
        return;
    }

    await interaction.followUp({
      content: content ? content : 'Something went wrong.'
    });
  }
};

function buildMessage(emojiData: any, data: any, rank: number): string {
  let content = '';

  const rsn = data.at(0);
  const pets = data.at(1);

  content += '```ini\n[#' + rank + ']: ' + rsn + ' (' + pets + ')```';

  //Pets
  let petEmojis = '';
  for (
    let i = config.googleDrive.petDataOffset;
    i < config.googleDrive.petsAmount + config.googleDrive.petDataOffset;
    i++
  ) {
    const gotPet = data?.at(i) === 'TRUE';
    petEmojis += gotPet ? emojiData.at(i) + ' ' : '';
  }

  content += petEmojis ? petEmojis : '';
  return content;
}

function getTopPetsIndex(petData: any): [LeaderboardRecord, number[]] {
  let petsAmount: LeaderboardRecord = {};
  for (let i: number = 1; i < petData.length; i++) {
    const pets = petData[i].at(1);
    if (petsAmount[pets]) {
      petsAmount[pets].push(i);
    } else {
      petsAmount[pets] = [i];
    }
  }

  const topPets = Object.keys(petsAmount)
    .map(Number)
    .sort((a, b) => b - a)
    .slice(0, 5);

  return [petsAmount, topPets];
}
