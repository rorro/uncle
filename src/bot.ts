import { Client, ClientOptions } from 'discord.js';
import interactionCreate from './listeners/interactionCreate';
import ready from './listeners/ready';
import config from './config';

console.log('Bot is starting...');

const client = new Client({
  intents: ["DIRECT_MESSAGES", "GUILD_MESSAGES"]
});

ready(client);
interactionCreate(client);

client.login(config.token);
