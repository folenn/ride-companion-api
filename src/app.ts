import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import express from 'express';
import mongoose from 'mongoose';
import Controller from './interfaces/controller.interface';
import errorMiddleware from './middleware/error.middleware';
import path = require('path');
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import i18n from 'i18n';
import cors from 'cors';

class App {
  public app: express.Application;
  private db: any;
  private limiter = (rateLimit as any)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: "Received too many requests from your IP, try again later"
  });

  constructor(controllers: Controller[]) {
    this.app = express();

    this.connectToTheDatabase();
    this.initializeMiddlewares();
    this.initializeControllers(controllers);
    this.initializeErrorHandling();
    this.initializeViewEngine();
    this.initializeStaticFilesServe();
  }

  public listen() {
    this.app.listen(process.env.PORT, () => {
      console.log(`App listening on the port ${process.env.PORT}`);
    });
  }

  public getServer() {
    return this.app;
  }

  public async mongoStarted(): Promise<any> {
    return new Promise((resolve => {
      this.db.once('open', () => {
        resolve();
      });
    }));
  }

  private initializeViewEngine() {
    this.app.set('views', path.join(__dirname, 'views'));
    this.app.set('view engine', 'pug');
  }

  private initializeStaticFilesServe() {
    this.app.use('/public', express.static(`${__dirname}/public`))
  }

  private initializeMiddlewares() {
    this.app.use(cors());
    this.app.use(bodyParser.json());
    this.app.use(cookieParser());
    this.initializeTranslations();
    this.app.use(morgan('dev'));
    this.app.use(this.limiter);
  }

  private initializeErrorHandling() {
    this.app.use(errorMiddleware);
  }

  private initializeTranslations() {
    i18n.configure({
      locales: ['en', 'ru', 'ua'],
      directory: __dirname + '/locales',
      objectNotation: true,
      syncFiles: true
    });
    this.app.use((req, res, next) => {
      i18n.init(req, res, () => {
        i18n.setLocale(req.headers['accept-language'] || 'en');
        next();
      })
    });
  }

  private initializeControllers(controllers: Controller[]) {
    controllers.forEach((controller) => {
      this.app.use('/api', controller.router);
    });
  }

  private connectToTheDatabase() {
    const {
      MONGO_USER,
      MONGO_PASSWORD,
      MONGO_PATH,
    } = process.env;
    mongoose.connect(`mongodb://${MONGO_PATH}`, {useNewUrlParser: true, useUnifiedTopology: true})
      .then(() => {
        console.log('Database connection established');
    })
      .catch(e => console.log('Database connection failed ' + e));
    this.db = mongoose.connection;
  }
}

export default App;
