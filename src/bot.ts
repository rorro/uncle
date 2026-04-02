import { Client, GatewayIntentBits } from 'discord.js';
import config from './config';
import interactionCreate from './listeners/interactionCreate';
import ready from './listeners/ready';

console.log('Bot is starting...');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageTyping,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.DirectMessageTyping
  ]
});

ready(client);
interactionCreate(client);

client.login(config.client.token);

export default client;
