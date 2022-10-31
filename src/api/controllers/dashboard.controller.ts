import DiscordOauth2 from 'discord-oauth2';
import { Request, response, Response } from 'express';
import {
  deleteFromOuathData,
  getAccessTokens,
  getAllChannels,
  getAllConfigValues,
  getAllMessages,
  getAllOpenChannels,
  insertOauthData
} from '../../database/helpers';
import CryptoJS from 'crypto-js';
import config from '../../config';
import client from '../../bot';
import { hasRole } from '../../utils';
import { Channel, Guild, GuildBasedChannel } from 'discord.js';
import { ChannelResponse, ConfigEntry, MessagesResponse } from '../../database/types';

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

      const { id } = await oauth2.getUser(oauthData.access_token);
      const guild = await client.guilds.fetch(config.guild.id);

      console.log(
        `Authenticating... user_id: ${id}...guild_id: ${guild}...token: ${oauthData.access_token}`
      );
      try {
        const user = await guild.members.fetch(id);
        const isStaff = hasRole(user, config.guild.roles.staff);

        console.log(`Authenticating... is_staff: ${isStaff}`);

        if (isStaff) {
          const encryptedAccessToken = encrypt(oauthData.access_token, PRIVATE_KEY);
          const data = {
            access_token: encryptedAccessToken,
            token_type: oauthData.token_type,
            expires_in: oauthData.expires_in,
            refresh_token: encrypt(oauthData.refresh_token, PRIVATE_KEY),
            scope: oauthData.scope,
            discord_user_id: id
          };

          console.log(`Authenticating... inserting into database`);
          await insertOauthData(data);
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

interface CustomChannel {
  configuredChannel: ChannelResponse;
  channel?: GuildBasedChannel;
}

interface ResponseType {
  guild?: Guild;
  channels: CustomChannel[];
  messages: MessagesResponse[];
  configs: ConfigEntry[];
}

const getData = async (req: Request, res: Response) => {
  // U2FsdGVkX18wXSFyCMwaaqffOJYv/2a+01jTD4K80EE3HM6oy4iIGL/atcAV+ZiM
  // U2FsdGVkX18wXSFyCMwaaqffOJYv%2F2a%2B01jTD4K80EE3HM6oy4iIGL%2FatcAV%2BZiM
  const accessToken = req.query.accessToken as string;

  console.log(`Getting data_accessToken: ${accessToken}`);
  if (!accessToken) {
    res.send({ message: 'Invalid access token' });
    return;
  }

  const isLoggedIn = await hasAccess(accessToken);
  if (isLoggedIn) {
    const guild = client.guilds.cache.get(config.guild.id);
    if (!guild) return;

    const allChannels = guild.channels ? JSON.parse(JSON.stringify(guild.channels)).guild.channels : [];

    const response: ResponseType = { guild: guild, channels: [], messages: [], configs: [] };

    // CONFIGURED CHANNELS
    const configuredChannels = await getAllChannels();
    if (!configuredChannels) {
      res.json(response);
      return;
    }

    for (const ch of configuredChannels) {
      if (!allChannels.includes(ch.channel_id)) continue;
      const channel = guild.channels.cache.get(ch.channel_id);

      response.channels.push({
        configuredChannel: ch,
        channel: channel
      });
    }

    // CONFIGURED MESSAGES
    const configuredMessages = await getAllMessages();

    for (const msg of configuredMessages) {
      response.messages.push(msg);
    }

    // GENERAL CONFIGS
    const generalConfigs = await getAllConfigValues();
    for (const conf of generalConfigs) {
      response.configs.push(conf);
    }

    // OPEN CHANNELS
    const openApplications = await getAllOpenChannels('open_applications');
    const openSupportTickets = await getAllOpenChannels('open_support_tickets');

    res.json(response);
  } else {
    res.send({ message: 'You are logged OUT!' });
  }
};

const logout = async (req: Request, res: Response) => {
  console.log(`Logging out...`);

  const access_token = req.body.access_token;
  if (!access_token) return;

  const decrypted = decrypt(access_token, PUBLIC_KEY);
  console.log(`Logging out...access_token: ${decrypted}`);

  const tokens = await getAccessTokens();
  const toDelete = tokens.find(t => decrypt(t.access_token, PRIVATE_KEY) === decrypted);

  if (toDelete) {
    console.log(`Logging out...to_delete: ${toDelete?.access_token}`);
    await deleteFromOuathData(toDelete?.access_token);
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
  if (!cookie) return false;

  const decrypted = decrypt(cookie, PUBLIC_KEY);

  const tokens = await getAccessTokens();
  const hasAccess = tokens.find(t => decrypt(t.access_token, PRIVATE_KEY) === decrypted);
  return hasAccess ? true : false;
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

async function isLoggedIn(access_token: string) {
  if (!access_token) {
    return false;
  }

  return await hasAccess(access_token);
}

async function verifyLogin(req: Request, res: Response) {
  const loggedIn = await isLoggedIn(req.query.access_token as string);
  console.log(`loggedIn: ${loggedIn}`);
  res.send(loggedIn);
}

async function getMessages(req: Request, res: Response) {
  const loggedIn = await isLoggedIn(req.query.access_token as string);
  console.log(`Getting messages_loggedIn: ${loggedIn}`);
  if (!loggedIn) {
    res.sendStatus(401);
  } else {
    const messages = await getAllMessages();
    res.send(messages);
  }
}

export default {
  authenticate,
  getData,
  logout,
  getMessages,
  verifyLogin
};
