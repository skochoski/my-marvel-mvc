import authRoutes from '../routes/auth.js';
import postRoutes from '../routes/post.js';
import getHomePage from '../controllers/home.js';
import getMyMarvelPage from '../controllers/marvel.js';

export default (app) => {
  app.get('/', getHomePage);
  app.get('/marvel', getMyMarvelPage);
  app.use('/posts', postRoutes);
  app.use(authRoutes);
  app.use((req, res, next) => {
    res.status(404).render('404', {
      pageTitle: 'Page Not Found',
      path: '/404',
      isAuthenticated: req.session.isLoggedIn
    });
  });
};
