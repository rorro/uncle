import express, { Express } from 'express';
import path from 'path';

const PORT = process.env.PORT || 7373;

export function init(): Express {
  const app = express();

  app.use('/transcripts', express.static(path.join(__dirname, '../..', 'transcripts')));

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  return app;
}
