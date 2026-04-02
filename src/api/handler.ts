import { WOMClient } from '@wise-old-man/utils';

export const womClient = new WOMClient({
  baseAPIUrl: 'https://api.wiseoldman.net/league',
  apiKey: process.env.WOM_API_KEY,
  userAgent: 'Uncle Discord Bot'
});
