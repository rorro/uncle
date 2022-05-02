import 'dotenv/config';

export default {
  token: process.env.DISCORD_TOKEN,
  developmentGuild: {
    id: process.env.DEV ? process.env.DEV_GUILD : '',
    applicationManagerRole: process.env.DEV_APP_MANAGER
  },
  productionGuild: {
    id: '274570008737218562',
    applicationManagerRole: '691419580438020168'
  },
  wiseoldmanAPI: 'https://api.wiseoldman.net',
  runewatchAPI: 'https://runewatch.com/api/v2/rsn/',
  requirements: {
    // requirements to join the clan
    chambers_of_xeric: 50,
    theatre_of_blood: 50,
    combatLevel: 120,
    totalLevel: 1750,
    prayer: 77,
    ranged: 94,
    magic: 94,
    agility: 70,
    herblore: 78
  }
};
