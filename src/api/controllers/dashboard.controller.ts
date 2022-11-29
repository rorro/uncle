import DiscordOauth2 from 'discord-oauth2';
import { Request, Response } from 'express';
import CryptoJS from 'crypto-js';
import config from '../../config';
import client from '../../bot';
import { hasRole } from '../../utils';
import { ResponseType } from '../../types';
import KnexDB from '../../database/knex';

const oauth2 = new DiscordOauth2();

const PUBLIC_KEY = process.env.PUBLIC_KEY as string;
const PRIVATE_KEY = process.env.PRIVATE_KEY as string;
const CLIENT_ID = process.env.CLIENT_ID as string;
const CLIENT_SECRET = process.env.CLIENT_SECRET as string;

// https://discord.com/api/oauth2/authorize?client_id=969344573514088508&redirect_uri=http%3A%2F%2Flocalhost%3A7373%2Fdashboard%2Fauth&response_type=code&scope=identify
const authenticate = async (req: Request, res: Response) => {
  const { code } = req.query;
  if (code) {
    try {
      console.log(`Authenticating...`);

      const oauthData = await oauth2.tokenRequest({
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
        redirectUri: process.env.REDIRECT_URI || 'http://localhost:7373/dashboard/auth',
        code: code.toString(),
        scope: 'identify',
        grantType: 'authorization_code'
      });

      const oauth2User = await oauth2.getUser(oauthData.access_token);
      const guild = await client.guilds.fetch(config.guild.id);

      console.log(
        `Authenticating... user_id: ${oauth2User}...guild_id: ${guild}...token: ${oauthData.access_token}`
      );
      try {
        const user = await guild.members.fetch(oauth2User.id);
        const isStaff = hasRole(user, config.guild.roles.staff);

        console.log(`Authenticating... is_staff: ${isStaff}`);

        if (isStaff) {
          const data = {
            access_token: encrypt(oauthData.access_token, PRIVATE_KEY),
            token_type: oauthData.token_type,
            expires_in: oauthData.expires_in * 1000,
            refresh_token: encrypt(oauthData.refresh_token, PRIVATE_KEY),
            scope: oauthData.scope,
            user: JSON.stringify(user),
            date: Date.now()
          };

          console.log(`Authenticating... inserting into database`);
          KnexDB.insertOauthData(data);
          const publicEncrypted = encrypt(oauthData.access_token, PUBLIC_KEY);
          const encoded = encodeURIComponent(publicEncrypted);

          // Everything went fine, send client to login url to save cookie

          console.log(`Authenticating... redirecting to /login/:access_token ${publicEncrypted}`);
          res.redirect(`http://localhost:3000/login/${encoded}`);
        } else {
          // User that logged in is not a staff member of the guild, redirect back to front page
          console.log(`Authenticating... user not staff revoke access`);
          await revokeAccess(oauthData.access_token);
          res.redirect('http://localhost:3000');
        }
      } catch (e) {
        // The user that logged in is not in the guild, redirect to front page
        console.log(e);
        console.log(`Authenticating... user not in guild`);
        res.redirect('http://localhost:3000');
      }
    } catch (e) {
      console.log(e);
      res.redirect('http://localhost:3000');
    }
  } else {
    res.redirect('http://localhost:3000');
  }
};

const getData = async (req: Request, res: Response) => {
  const accessToken = req.query.accessToken as string;

  if (!accessToken) {
    res.send({ message: 'Invalid access token' });
    return;
  }

  console.log(`accessToken: ${accessToken}`);

  const isLoggedIn = await hasAccess(accessToken);
  if (isLoggedIn) {
    console.log(`Getting data_accessToken: ${accessToken}`);
    const guild = client.guilds.cache.get(config.guild.id);
    if (!guild) return;

    const allGuildChannels = await guild.channels.fetch();
    // console.log(allGuildChannels);

    const response: ResponseType = {
      guild: guild,
      guildChannels: allGuildChannels,
      configs: await KnexDB.getAllConfigs(),
      messages: await KnexDB.getAllMessages(),
      scheduledMessages: await KnexDB.getAllScheduledMessages()
    };

    // console.log(response);

    // OPEN CHANNELS
    // const openApplications = await getAllOpenChannels('open_applications');
    // const openSupportTickets = await getAllOpenChannels('open_support_tickets');

    res.json(response);
  } else {
    res.send();
  }
};

const saveData = async (req: Request, res: Response) => {
  const accessToken = req.query.accessToken as string;
  const category = req.query.category as string;

  if (!accessToken) {
    res.send({ message: 'Invalid access token' });
    return;
  }

  if (!category) {
    res.send({ message: 'Invalid category' });
    return;
  }

  const isLoggedIn = await hasAccess(accessToken);
  if (!isLoggedIn) {
    res.send({ message: 'You are not logged in!' });
    return;
  }

  switch (category) {
    case 'configs':
      console.log(`saving configs:`);
      await KnexDB.updateConfig('', '', req.body);
      break;
    case 'scheduled_messages':
      console.log(`saving scheduled message:`);
      await KnexDB.insertScheduledMessage(req.body);
      break;

    default:
      break;
  }
  console.log(req.body);
  res.send({ message: 'Data saved' });
};

const logout = async (req: Request, res: Response) => {
  console.log(`Logging out...`);

  const access_token = req.body.access_token;
  if (!access_token) return;

  const decrypted = decrypt(decodeURIComponent(access_token), PUBLIC_KEY);
  console.log(`Logging out...decrypted: ${decrypted}`);

  const tokens = await KnexDB.getAccessTokens();
  const toDelete = tokens.find(t => decrypt(t.access_token, PRIVATE_KEY) === decrypted);

  if (toDelete) {
    console.log(`Logging out...to_delete: ${toDelete?.access_token}`);
    await KnexDB.deleteFromOuathData(toDelete?.access_token);
    console.log(`Logging out...deleted from database`);
    await revokeAccess(decrypted);
    console.log(`Logging out...revoked access`);
    console.log(`logged out ${decrypted}`);
  }
};

function encrypt(token: string, key: string): string {
  return CryptoJS.AES.encrypt(token, key).toString();
}

function decrypt(token: string, key: string): string {
  return CryptoJS.AES.decrypt(token, key).toString(CryptoJS.enc.Utf8);
}

async function hasAccess(cookie: string): Promise<boolean> {
  console.log(`Verifying access...`);

  if (!cookie) return false;

  const decrypted = decrypt(cookie, PUBLIC_KEY);

  const tokens = await KnexDB.getAccessTokens();
  const hasAccess = tokens.find(t => decrypt(t.access_token, PRIVATE_KEY) === decrypted);

  if (!hasAccess) return false;
  console.log(`Verifying access... hasAccess: ${hasAccess}`);

  // Check if access token has expired
  const oauthData = (await KnexDB.getOauthData(hasAccess.access_token))[0];
  if (oauthData.date + oauthData.expires_in < Date.now()) {
    console.log(`Verifying access... token has expired!`);
    await KnexDB.deleteFromOuathData(hasAccess.access_token);
    return false;
  }

  return true;
}

async function revokeAccess(token: string) {
  console.log(`logging out... token: ${token}`);
  try {
    const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
    await oauth2.revokeToken(token, credentials);
  } catch (e) {
    console.log(e);
  }
}

async function verifyLogin(req: Request, res: Response) {
  const loggedIn = await hasAccess(req.query.access_token as string);
  console.log(`verifyLogin-is logged in?: ${loggedIn}`);
  res.send(loggedIn);
}

export default {
  authenticate,
  getData,
  logout,
  verifyLogin,
  saveData
};
