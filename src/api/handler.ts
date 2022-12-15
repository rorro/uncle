import { WOMClient } from '@wise-old-man/utils';
import axios from 'axios';
import config from '../config';

export const womClient = new WOMClient({
  apiKey: process.env.WOM_API_KEY,
  userAgent: 'Uncle Discord Bot'
});

export const RWAPI = axios.create({
  baseURL: config.runewatchAPI,
  timeout: 60000,
  headers: { 'User-Agent': 'Uncle Discord Bot' }
});
