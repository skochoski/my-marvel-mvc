import { fileURLToPath } from 'url';
import path, { dirname } from 'path';
global.__dirname = dirname(fileURLToPath(import.meta.url));

import dotenv from 'dotenv'
dotenv.config();

import express from 'express';
import session from 'express-session';
import connectMongoDBSession from 'connect-mongodb-session';
import csrf from 'csurf';
import flash from 'connect-flash';
import multer from 'multer';
import helmet from 'helmet';
import compression from 'compression';
import favicon from 'serve-favicon';

import { connectDB, MONGO_URI } from './config/database.js';
import registerRoutes from './config/routes.js';
import User from './models/user.js';
import { fileStorage, fileFilter } from './utils/multer.js';

const PORT = process.env.PORT || 3000;
const app = express();
const MongoDBStore = connectMongoDBSession(session);
const store = new MongoDBStore({
  uri: MONGO_URI,
  collection: 'sessions'
});
const csrfProtection = csrf();

app.set('view engine', 'ejs');
app.set('query parser', 'simple');
app.disable("x-powered-by");
app.use(helmet({ contentSecurityPolicy: false }));
app.use(helmet.contentSecurityPolicy({
  useDefaults: true,
  directives: {
    imgSrc: ["'self'", "data:", "http://i.annihil.us/u/prod/marvel/", `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_BUCKET_REGION}.amazonaws.com/`],
    scriptSrc: ["'self'", "https://cdn.jsdelivr.net/npm/"],
  },
}));
app.use(compression());
app.use(express.static(path.join(__dirname, 'public')));
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(multer({ storage: fileStorage, fileFilter: fileFilter }).single('image'));

const sess = {
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  name: 'my-marvel',
  cookie: { maxAge: 1000 * 60 * 60 }
}

if (app.get('env') === 'production') {
  app.set('trust proxy', 1);
  sess.cookie.secure = true;
  sess.cookie.sameSite = 'lax';
}

app.use(session(sess));
app.use(flash());

app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  next();
});

app.use( async (req, res, next) => {
  if (!req.session.user) {
    return next();
  }

  try {
    const user = await User.findById(req.session.user._id);
    if (!user) {
      return next();
    }
    req.user = user;
    next();
  } catch (err) {
    next(new Error(err));
  }

});

app.use(csrfProtection);
app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  next();
});

registerRoutes(app);

app.use((error, req, res, next) => {
  res.status(500).render('500', {
    pageTitle: 'Internal Server Error',
    path: '/500',
    isAuthenticated: req.session.isLoggedIn
  });
});

try {
  await connectDB();
  app.listen(PORT, console.log(`Server is ready, listening on port: ${PORT}...`));
} catch (err) {
  console.log(err);
}
