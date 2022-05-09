import { Client } from 'discord.js';
import interactionCreate from './listeners/interactionCreate';
import ready from './listeners/ready';
import config from './config';

console.log('Bot is starting...');

const client = new Client({
  intents: [
    'GUILDS',
    'GUILD_MESSAGES',
    'GUILD_MESSAGE_TYPING',
    'GUILD_MESSAGE_REACTIONS',
    'DIRECT_MESSAGE_TYPING'
  ]
});

ready(client);
interactionCreate(client);

client.login(config.token);
