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
    throw `Unhandled environment variable (process.env.NODE_ENV): ${process.env.NODE_ENV}`;
}
dotenv.config({ path: path });

export default {
  runewatchAPI: 'https://runewatch.com/api/v2/rsn/',
  client: {
    token: process.env.DISCORD_TOKEN as string,
    id: process.env.CLIENT_ID as string,
    secret: process.env.CLIENT_SECRET as string
  },
  guild: {
    id: process.env.GUILD_ID as string,
    leaderboardChangelog: process.env.LEADERBOARD_CHANGELOG_THREAD as string,
    roles: {
      staff: process.env.STAFF_ROLE as string,
      juniorStaff: process.env.JUNIOR_STAFF_ROLE as string,
      guardian: process.env.GUARDIAN_ROLE as string,
      sentry: process.env.SENTRY_ROLE as string,
      justiciar: process.env.JUSTICIAR_ROLE as string,
      bulwark: process.env.BULWARK_ROLE as string,
      protector: process.env.PROTECTOR_ROLE as string,
      member: process.env.MEMBER_ROLE as string
    }
  },
  // All valid metrics can be found here https://docs.wiseoldman.net/global-type-definitions
  requirements: [
    // requirements to join the clan
    { metric: 'combatLevel', type: 'other', name: '+ Combat', threshold: 125 },

    // Skills
    { metric: 'ranged', type: 'skill', name: ' Ranged', threshold: 99 },
    { metric: 'magic', type: 'skill', name: ' Magic', threshold: 99 },
    { metric: 'slayer', type: 'skill', name: ' Slayer', threshold: 95 },
    { metric: 'agility', type: 'skill', name: ' Agility', threshold: 70 },
    { metric: 'herblore', type: 'skill', name: ' Herblore', threshold: 78 },
    { metric: 'construction', type: 'skill', name: ' Construction', threshold: 82 },

    // Bosses
    {
      metric: 'chambers_of_xeric',
      type: 'boss',
      name: 'Chambers of Xeric (+CM)',
      alternatives: ['chambers_of_xeric_challenge_mode'],
      threshold: 50
    },
    {
      metric: 'theatre_of_blood',
      type: 'boss',
      name: 'Theatre of Blood (+HM)',
      alternatives: ['theatre_of_blood_hard_mode'],
      threshold: 50
    },
    {
      metric: 'tombs_of_amascut_expert',
      type: 'boss',
      name: 'Tombs of Amascut (Expert)',
      threshold: 50
    },
    {
      metric: 'chambers_of_xeric',
      type: 'boss',
      name: 'Raids Combined',
      alternatives: [
        'chambers_of_xeric_challenge_mode',
        'theatre_of_blood',
        'theatre_of_blood_hard_mode',
        'tombs_of_amascut_expert'
      ],
      threshold: 300
    },
    {
      metric: 'tzkal_zuk',
      type: 'boss',
      name: 'Inferno',
      threshold: 1
    },
    {
      metric: 'the_corrupted_gauntlet',
      type: 'warning',
      name: 'SotE Completion',
      alternatives: ['the_gauntlet'],
      threshold: 5
    }
  ],
  googleDrive: {
    diarySheetsFolder: process.env.DIARY_SHEETS_FOLDER as string,
    diarySheet: process.env.DIARY_SHEET as string,
    splitsSheet: process.env.SPLITS_SHEET as string,
    newSplitsSheet: process.env.NEW_SPLITS_SHEET as string,
    diarySheetMainName: 'Diary!B6',
    diarySheetTasksComplete: 'Diary!B11'
  },
  API: {
    url: process.env.API_URL as string,
    port: process.env.API_PORT as string
  },
  site: {
    url: process.env.SITE_URL as string,
    port: process.env.SITE_PORT as string
  },
  imgur: {
    clientId: process.env.IMGUR_CLIENT_ID as string,
    clientSecret: process.env.IMGUR_CLIENT_SECRET as string,
    refreshToken: process.env.IMGUR_REFRESH_TOKEN as string,
    albumHash: process.env.IMGUR_ALBUM_HASH as string
  }
};
