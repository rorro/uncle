import axios from 'axios';
import config from '../config';

export const WOMAPI = axios.create({
  baseURL: config.wiseoldmanAPI,
  timeout: 60000,
  headers: { 'User-Agent': 'Uncle Discord Bot' }
});

export const RWAPI = axios.create({
  baseURL: config.runewatchAPI,
  timeout: 60000,
  headers: { 'User-Agent': 'Uncle Discord Bot' }
});
