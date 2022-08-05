import { BaseCommandInteraction, Client } from 'discord.js';
import { ApplicationCommandOptionTypes } from 'discord.js/typings/enums';
import { getSheetData } from '../api/googleHandler';
import { Command, LeaderboardRecord } from '../types';
import config from '../config';
import { hasRole, sendMessageInChannel } from '../utils';
import db from '../db';

export const petsCommand: Command = {
  name: 'pets',
  description: 'Show all pet emotes',
  type: 'CHAT_INPUT',
  options: [
    {
      type: ApplicationCommandOptionTypes.SUB_COMMAND,
      name: 'updatetop5',
      description: 'Update pet leaderboard'
    },
    {
      type: ApplicationCommandOptionTypes.SUB_COMMAND,
      name: 'search',
      description: 'See what pets a player has',
      options: [
        {
          name: 'rsn',
          description: 'In-game name of player',
          type: ApplicationCommandOptionTypes.STRING,
          required: true
        }
      ]
    }
  ],
  run: async (client: Client, interaction: BaseCommandInteraction) => {
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

        const channel = client.channels.cache.get(config.guild.channels.leaderboard);
        if (!channel?.isText()) return;

        try {
          const messages = db.leaderboard.getData('/pets');
          for (const index in messages) {
            try {
              // Delete the old pet hiscore messages
              const messageToDelete = await (await channel.messages.fetch(messages[index])).delete();
            } catch (error) {
              console.error('Old pet message not found.');
            }
          }
        } catch (e) {
          console.error('No message IDs found.');
        }

        const [petHiscores, scores] = getTopPetsIndex(petData);

        let leaderboardMessages = [];
        for (let i in scores) {
          for (const j in petHiscores[+scores[i]]) {
            const index = petHiscores[+scores[i]][j];
            const petMessage = buildMessage(emojis, petData?.at(index), +i + 1);
            const messageId = await sendMessageInChannel(
              client,
              config.guild.channels.leaderboard,
              petMessage
            );
            leaderboardMessages.push(messageId);
            content = 'Pets hiscores updated.';
          }
        }
        db.leaderboard.push('/pets', leaderboardMessages);
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
  const pluses = data.at(2);

  content += '```ini\n[#' + rank + ']: ' + rsn + ' (' + pets + '+' + pluses + ')```';

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

  //Pluses
  let plusesEmojis = '';
  for (
    let i = config.googleDrive.petsAmount + config.googleDrive.petDataOffset;
    i <
    config.googleDrive.petsAmount + config.googleDrive.petPlusAmount + config.googleDrive.petDataOffset;
    i++
  ) {
    const gotPlus = data?.at(i) === 'TRUE';
    plusesEmojis += gotPlus ? emojiData.at(i) + ' ' : '';
  }

  content += petEmojis ? petEmojis : '';
  content += plusesEmojis ? '+ ' + plusesEmojis : '';
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
