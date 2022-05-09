import 'dotenv/config';

export default {
  token: process.env.DISCORD_TOKEN,
  developmentGuild: {
    id: process.env.DEV ? process.env.DEV_GUILD : '',
    channels: {
      newMembers: process.env.DEV ? process.env.DEV_NEW_MEMBERS_CHANNEL : ''
    },
    ranks: {
      applicationManager: process.env.DEV_APP_MANAGER,
      member: process.env.DEV_MEMBER,
      protector: process.env.DEV_PROTECTOR,
      bulwark: process.env.DEV_BULWARK
    }
  },
  productionGuild: {
    id: '274570008737218562',
    channels: {
      newMembers: '692650808751423488',
      assignRoles: '754716010023616542',
      rules: '704163136009273424',
      legacyDiary: '701551813366644816'
    },
    ranks: {
      applicationManager: '691419580438020168',
      member: '691353910757163047',
      protector: '856252027587002408',
      bulwark: '885720219308396564'
    }
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
  },
  googleDrive: {
    diarySheetsFolder: '1BJf6o6HyK6bqP0mDXxeayBU9slp_bFcI',
    diarySheet: '1ppb2JGT_c1-lrTQ0udo-uMSyl5WQatpIBJa7tZl7Xwg',
    diarySheetMainName: 'Diary!B5',
    diarySheetTasksComplete: 'Diary!J3'
  }
};
