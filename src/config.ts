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
  client: {
    token: process.env.DISCORD_TOKEN as string,
    id: process.env.CLIENT_ID as string,
    secret: process.env.CLIENT_SECRET as string
  },
  guild: {
    id: process.env.GUILD_ID as string
  },
  wom: {
    leagueGroupId: process.env.LEAGUE_GROUP_ID as string,
    leagueVerificaionCode: process.env.LEAGUE_GROUP_VERIFICATION_CODE as string
  }
};
