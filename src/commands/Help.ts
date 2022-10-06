import { ChatInputCommandInteraction, Client, ApplicationCommandType } from 'discord.js';
import {
  getMessagesByType,
  getMessageByName,
  getAllMessages,
  insertIntoMessages,
  deleteFromMessages
} from '../database/handler';
import { Command } from 'src/types';
import { MessageType } from '../database/types';

export const helpCommand: Command = {
  name: 'help',
  description: 'All the helpful information about the bot',
  type: ApplicationCommandType.ChatInput,
  run: async (client: Client, interaction: ChatInputCommandInteraction) => {
    const content = 'So far I only do stuff for the staff members.';

    await insertIntoMessages('zulrah', '3123123123', MessageType.Leaderboard);
    await insertIntoMessages('vorkath', '654', MessageType.Leaderboard);
    await insertIntoMessages('cox', '2432', MessageType.Leaderboard);
    await insertIntoMessages('pets leaderboard', '98797', MessageType.Pets);
    await insertIntoMessages('blabla', '12345', MessageType.Pets);
    await insertIntoMessages('test', '756352', MessageType.Pets);
    await insertIntoMessages('hh', '8675334234', MessageType.Other);
    await insertIntoMessages('tt', '456425363', MessageType.Other);
    await insertIntoMessages('ee', '2342675743', MessageType.Other);
    await insertIntoMessages('qq', '24254652426', MessageType.Other);
    const bla = await getMessageByName('cox');
    await deleteFromMessages({ name: 'vorkath' });
    console.log(bla);
    console.log(await getMessageByName('ee'));
    console.log(await getMessagesByType(MessageType.Leaderboard));
    await deleteFromMessages({ type: MessageType.Leaderboard });
    console.log(await getAllMessages());

    await interaction.reply({
      ephemeral: true,
      content: content
    });
  }
};
