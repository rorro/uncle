import { Client } from 'discord.js';
import { commands } from '../commands';
import config from '../config';

export default (client: Client): void => {
  client.on('ready', async () => {
    if (!client.user || !client.application) {
      return;
    }

    await client.application.commands.set(commands, config.guild.id);

    console.log(`${client.user.username} is online`);
  });
};
