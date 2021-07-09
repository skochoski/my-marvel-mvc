const isAuth = (req, res, next) => {
  if (!req.session.isLoggedIn) {
    req.flash('error', 'You are not logged in. Please log in to continue.');
    return res.redirect('/login');
  }
  next();
}

const isNotAuth = (req, res, next) => {
  if (req.session.isLoggedIn) {
    req.flash('error', 'You are already logged in.');
    return res.redirect('/');
  }
  next();
}

export {
  isAuth,
  isNotAuth
}
