import express, { Express } from 'express';
import path from 'path';
import config from '../config';

export function init(): Express {
  const app = express();

  app.use('/transcripts', express.static(path.join(__dirname, '../..', '.transcripts')));
  app.use('/messages', express.static(path.join(__dirname, '../..', '.scheduledMessages.json')));

  app.listen(config.API.port, () => {
    console.log(`Server running on port ${config.API.port}`);
  });

  return app;
}
