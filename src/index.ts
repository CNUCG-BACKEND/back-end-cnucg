import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import * as Sentry from '@sentry/node';
import * as Tracing from '@sentry/tracing';
import path from 'path';
import router from './routes/router';
import rateLimiter from './middlewares/rateLimiter';
import errorHandler from './middlewares/errorHandler';

dotenv.config(); 

const app = express();
const port = process.env.SERVER_PORT || 5000;

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Tracing.Integrations.Express({ app }),
  ],
  tracesSampleRate: 1.0,
});

app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.tracingHandler());

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'", "http://localhost:5500"],
        scriptSrc: ["'self'", "'unsafe-inline'", "http://localhost:5500"],
        imgSrc: ["'self'", "data:", "http://localhost:5000/uploads"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    referrerPolicy: { policy: 'no-referrer' },
    frameguard: { action: 'deny' },
    hsts: { maxAge: 60 * 60 * 24 * 365, includeSubDomains: true, preload: true },
    xssFilter: true,
    noSniff: true,
    dnsPrefetchControl: { allow: false },
  })
);

const corsOptions = {
  origin: ['http://localhost:5500', 'http://127.0.0.1:5500'], 
  optionsSuccessStatus: 200,
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use(morgan('combined'));
app.use(rateLimiter); 

app.use('/uploads', express.static(path.join(__dirname, '../uploads'))); 
app.use('/', router);

app.use(Sentry.Handlers.errorHandler());
app.use(errorHandler); 

app.listen(port, () => console.log(`⚡ Server is running on port ${port}.`));