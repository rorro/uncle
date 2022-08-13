import * as dotenv from 'dotenv';

dotenv.config();
let path;
switch (process.env.NODE_ENV) {
  case 'development':
    path = `${__dirname}/../.env.development`;
    break;
  case 'production':
    path = `${__dirname}/../.env.production`;
    break;
  default:
    throw `Unhandled environment variable: ${process.env.NODE_ENV}`;
}
dotenv.config({ path: path });

export default {
  token: process.env.DISCORD_TOKEN as string,
  wiseoldmanAPI: 'https://api.wiseoldman.net',
  runewatchAPI: 'https://runewatch.com/api/v2/rsn/',
  guild: {
    id: process.env.GUILD_ID as string,
    channels: {
      newMembers: process.env.NEW_MEMBERS_CHANNEL as string,
      assignRoles: process.env.ASSIGN_ROLES_CHANNEL as string,
      rules: process.env.RULES_CHANNEL as string,
      legacyDiary: process.env.DIARY_CHANNEL as string,
      leaderboard: process.env.LEADERBOARD_CHANNEL as string
    },
    roles: {
      applicationManager: process.env.APPLICATION_MANAGER_ROLE as string,
      staff: process.env.STAFF_ROLE as string,
      member: process.env.MEMBER_ROLE as string,
      protector: process.env.PROTECTOR_ROLE as string,
      bulwark: process.env.BULWARK_ROLE as string,
      justiciar: process.env.JUSTICIAR_ROLE as string
    }
  },
  // All valid metrics can be found here https://wiseoldman.net/docs/records
  requirements: [
    // requirements to join the clan
    { metric: 'combatLevel', type: 'other', name: '+ Combat', threshold: 120 },
    { metric: 'totalLevel', type: 'other', name: '+ Total', threshold: 1750 },

    // Skills
    { metric: 'ranged', type: 'skill', name: 'Ranged', threshold: 94 },
    { metric: 'magic', type: 'skill', name: 'Magic', threshold: 94 },
    { metric: 'agility', type: 'skill', name: 'Agility', threshold: 70 },
    { metric: 'herblore', type: 'skill', name: 'Herblore', threshold: 78 },
    { metric: 'construction', type: 'skill', name: 'Construction', threshold: 82 },

    // Bosses
    {
      metric: 'chambers_of_xeric',
      type: 'boss',
      name: 'Chambers of Xeric (+CM)',
      alternative: 'chambers_of_xeric_challenge_mode',
      threshold: 50
    },
    {
      metric: 'theatre_of_blood',
      type: 'boss',
      name: 'Theatre of Blood (+HM)',
      alternative: 'theatre_of_blood_hard_mode',
      threshold: 50
    }
  ],
  googleDrive: {
    diarySheetsFolder: process.env.DIARY_SHEETS_FOLDER as string,
    diarySheet: process.env.DIARY_SHEET as string,
    leaderboardSheet: process.env.LEADERBOARD_SHEET as string,
    splitsSheet: process.env.SPLITS_SHEET as string,
    diarySheetMainName: 'Diary!B5',
    diarySheetTasksComplete: 'Diary!J3',
    petSheetRange: 'Pet Hunters!A3:BH',
    petDataOffset: 3,
    petsAmount: 50,
    petPlusAmount: 7
  }
};
