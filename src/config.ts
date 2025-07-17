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
