import cors from 'cors';
import express from 'express';
import morgan from 'morgan';

import { corsOptions } from './config';
import { errorHandler, notFoundHandler } from './middlewares';
import routes from './routes';

const createApp = (): express.Application => {
  const app = express();

  app.use(cors(corsOptions));
  app.use(morgan('dev'));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  app.use('/api', routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

export default createApp;
