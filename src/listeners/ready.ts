import { Client } from 'discord.js';
import { commands } from '../commands';
import config from '../config';
import { sendScheduledMessages, updateUsernameMapping } from '../discord';

export default (client: Client): void => {
  client.on('ready', async () => {
    if (!client.user || !client.application) {
      return;
    }

    await client.application.commands.set(commands, config.guild.id);

    // Send scheduled messages once a minute
    setInterval(sendScheduledMessages, 1 * 60 * 1000, client);

    // Update clan username mappings once an hour
    setInterval(updateUsernameMapping, 60 * 60 * 1000, client)

    console.log(`${client.user.username} is online`);
  });
};
