import { Client } from 'discord.js';
import { commands } from '../commands';
import config from '../config';

export default (client: Client): void => {
  client.on('ready', async () => {
    if (!client.user || !client.application) {
      return;
    }

    // Re-register commands on every start up.
    // Maybe change this even if it's just guild commands.
    const guild = config.developmentGuild ? config.developmentGuild : config.productionGuild;
    // const guilds = client.guilds.cache.get(guild);
    // await guilds?.commands.set(commands);

    await client.application.commands.set(commands, guild);

    console.log(`${client.user.username} is online`);
  });
};
