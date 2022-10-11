import DiscordOauth2 from 'discord-oauth2';
import { Request, Response } from 'express';
import {
  deleteFromOuathData,
  getAccessTokens,
  getAllOpenApplications,
  insertOauthData
} from '../../database/helpers';
import CryptoJS from 'crypto-js';
import config from '../../config';
import client from '../../bot';
import { hasRole } from '../../utils';

const oauth2 = new DiscordOauth2();

const PUBLIC_KEY = process.env.PUBLIC_KEY as string;
const PRIVATE_KEY = process.env.PRIVATE_KEY as string;
const CLIENT_ID = process.env.CLIENT_ID as string;
const CLIENT_SECRET = process.env.CLIENT_SECRET as string;

const authenticate = async (req: Request, res: Response) => {
  const { code } = req.query;
  if (code) {
    try {
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
      try {
        const user = await guild.members.fetch(id);
        const isStaff = hasRole(user, config.guild.roles.staff);

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

          await insertOauthData(data);
          res.cookie('access_token', encrypt(oauthData.access_token, PUBLIC_KEY), {
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
          });
        } else {
          await revokeAccess(oauthData.access_token);
        }
        res.redirect('/dashboard');
      } catch (e) {
        console.log('user not in guild');
        res.sendStatus(400);
      }
    } catch (e) {
      console.log(e);
      res.sendStatus(400);
    }
  } else {
    res.redirect('/dashboard');
  }
};

const getData = async (req: Request, res: Response) => {
  const isLoggedIn = await hasAccess(req.cookies.access_token);
  if (isLoggedIn) {
    const openApplications = await getAllOpenApplications();
    res.json(openApplications ? openApplications : []);
  } else {
    res.send({ message: 'You are logged out!' });
  }
};

const logout = async (req: Request, res: Response) => {
  const cookie = req.cookies.access_token;
  const decrypted = decrypt(cookie, PUBLIC_KEY);
  const tokens = await getAccessTokens();
  const toDelete = tokens.find(t => decrypt(t.access_token, PRIVATE_KEY) === decrypted);
  if (toDelete) {
    await deleteFromOuathData(toDelete?.access_token);
    await revokeAccess(decrypted);
  }

  res.clearCookie('access_token');
  res.redirect('/dashboard');
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
  await oauth2.revokeToken(token, Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64'));
}

export default {
  authenticate,
  getData,
  logout
};
