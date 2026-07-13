import cors from 'cors';
import express from 'express';
import morgan from 'morgan';

import { API_PREFIX, REQUEST_BODY_LIMIT } from './constants';
import { corsOptions } from './config';
import {
  developmentApiKeyMiddleware,
  errorHandler,
  notFoundHandler,
  requestIdMiddleware,
} from './middlewares';
import routes from './routes';

const createApp = (): express.Application => {
  const app = express();

  app.use(cors(corsOptions));
  app.use(requestIdMiddleware);
  app.use(morgan('dev'));
  app.use(express.json({ limit: REQUEST_BODY_LIMIT }));
  app.use(express.urlencoded({ extended: true }));

  app.use(API_PREFIX, developmentApiKeyMiddleware, routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

export default createApp;
