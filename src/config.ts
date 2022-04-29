import 'dotenv/config';

export default {
  token: process.env.DISCORD_TOKEN,
  developmentGuild: process.env.DEV ? process.env.DEV_GUILD : '',
  productionGuild: '274570008737218562'
};
