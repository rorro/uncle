import express, { Express } from 'express';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import path from 'path';
import config from '../config';
import dashboardRoutes from './routes/dashboard.routes';

export function init(): Express {
  const api = express();

  api.use(bodyParser.json());
  api.use(cookieParser());
  api.use(bodyParser.urlencoded({ extended: true }));

  api.use('/dashboard', dashboardRoutes);

  api.use('/transcripts', express.static(path.join(__dirname, '../..', '.transcripts')));
  api.use('/messages', express.static(path.join(__dirname, '../..', '.scheduledMessages.json')));

  api.listen(config.API.port, () => {
    console.log(`Server running on port ${config.API.port}`);
  });

  return api;
}
