import DiscordOauth2 from 'discord-oauth2';
import { Request, Response } from 'express';
import CryptoJS from 'crypto-js';
import config from '../../config';
import client from '../../bot';
import { hasRole } from '../../utils';
import { EmbedConfigData, ResponseType } from '../../types';
import KnexDB from '../../database/knex';

const oauth2 = new DiscordOauth2();

const PUBLIC_KEY = process.env.PUBLIC_KEY as string;
const PRIVATE_KEY = process.env.PRIVATE_KEY as string;

const authenticate = async (req: Request, res: Response) => {
  const { code } = req.query;
  if (code) {
    try {
      const oauthData = await oauth2.tokenRequest({
        clientId: config.client.id,
        clientSecret: config.client.secret,
        redirectUri: `${config.API.url}:${config.API.port}/api/uncle/dashboard/auth`,
        code: code.toString(),
        scope: 'identify',
        grantType: 'authorization_code'
      });

      const oauth2User = await oauth2.getUser(oauthData.access_token);
      const guild = await client.guilds.fetch(config.guild.id);

      try {
        const user = await guild.members.fetch(oauth2User.id);
        const isStaff = hasRole(user, config.guild.roles.staff);

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

          KnexDB.insertOauthData(data);
          const publicEncrypted = encrypt(oauthData.access_token, PUBLIC_KEY);
          const encoded = encodeURIComponent(publicEncrypted);

          // Everything went fine, send client to login url to save cookie
          res.redirect(`${config.site.url}:${config.site.port}/login/${encoded}`);
        } else {
          // User that logged in is not a staff member of the guild, redirect back to front page
          await revokeAccess(oauthData.access_token);
          res.redirect(`${config.site.url}:${config.site.port}`);
        }
      } catch (e) {
        // The user that logged in is not in the guild, redirect to front page
        res.redirect(`${config.site.url}:${config.site.port}`);
      }
    } catch (e) {
      // Something went wrong with getting the token
      res.redirect(`${config.site.url}:${config.site.port}`);
    }
  } else {
    res.redirect(`${config.site.url}:${config.site.port}`);
  }
};

const getData = async (req: Request, res: Response) => {
  const accessToken = req.query.accessToken as string;

  if (!accessToken) {
    res.send({ message: 'Invalid access token' });
    return;
  }

  const isLoggedIn = await hasAccess(accessToken);
  if (isLoggedIn) {
    const guild = client.guilds.cache.get(config.guild.id);
    if (!guild) return;

    const allGuildChannels = await guild.channels.fetch();

    const response: ResponseType = {
      guild: guild,
      guildChannels: allGuildChannels,
      configs: await KnexDB.getAllConfigs(),
      messages: await KnexDB.getAllMessages(),
      scheduledMessages: await KnexDB.getAllScheduledMessages(),
      embedConfigs: await KnexDB.getEmbedConfigs()
    };

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
      await KnexDB.updateConfig('', '', req.body);
      break;
    case 'scheduled_messages':
      const newMessageId = await KnexDB.insertScheduledMessage(req.body);
      if (!newMessageId) return;

      res.send({
        newId: newMessageId.newId,
        message:
          newMessageId.newId !== -1 ? 'Successfully scheduled new message.' : 'Some error happened.'
      });
      return;
    case 'embeds':
      try {
        await KnexDB.updateEmbed(req.body);
      } catch (e) {
        console.log(e);

        res.send({
          message: `Something went wrong when trying to save ${req.body.title}`
        });
        return;
      }
      res.send({
        message: `Successfully saved ${req.body.title}.`
      });
      return;
  }
  res.send({ message: 'saved some data' });
};

const deleteScheduledMessage = async (req: Request, res: Response) => {
  const accessToken = req.query.accessToken as string;
  const messageId = parseInt(req.query.messageId as string);

  if (!accessToken) {
    res.send({ message: 'Invalid access token' });
    return;
  }

  const isLoggedIn = await hasAccess(accessToken);
  if (!isLoggedIn) {
    res.send({ message: 'You are not logged in!' });
    return;
  }

  KnexDB.deleteScheduledMessage(messageId);
  res.send({ message: 'Scheduled message deleted' });
};

const logout = async (req: Request, res: Response) => {
  const access_token = req.body.access_token;
  if (!access_token) return;

  const decrypted = decrypt(decodeURIComponent(access_token), PUBLIC_KEY);
  const tokens = await KnexDB.getAccessTokens();
  const toDelete = tokens.find(t => decrypt(t.access_token, PRIVATE_KEY) === decrypted);

  if (toDelete) {
    await KnexDB.deleteFromOuathData(toDelete?.access_token);
    await revokeAccess(decrypted);
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

  const tokens = await KnexDB.getAccessTokens();
  const hasAccess = tokens.find(t => decrypt(t.access_token, PRIVATE_KEY) === decrypted);

  if (!hasAccess) return false;
  // Check if access token has expired
  const oauthData = (await KnexDB.getOauthData(hasAccess.access_token))[0];
  if (oauthData.date + oauthData.expires_in < Date.now()) {
    await KnexDB.deleteFromOuathData(hasAccess.access_token);
    return false;
  }

  return true;
}

async function revokeAccess(token: string) {
  try {
    const credentials = Buffer.from(`${config.client.id}:${config.client.secret}`).toString('base64');
    await oauth2.revokeToken(token, credentials);
  } catch (e) {
    console.log(e);
  }
}

async function verifyLogin(req: Request, res: Response) {
  const loggedIn = await hasAccess(req.query.access_token as string);
  res.send(loggedIn);
}

export default {
  authenticate,
  getData,
  logout,
  verifyLogin,
  saveData,
  deleteScheduledMessage
};
