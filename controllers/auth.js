import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import sendgridTransport from 'nodemailer-sendgrid-transport';
import { validationResult } from 'express-validator';

import User from '../models/user.js';

const transporter = nodemailer.createTransport(
  sendgridTransport({
    auth: {
      api_key: process.env.SENDGRID_API_KEY
    }
  })
);

export default class AuthController {
  static getSignupPage(req, res, next) {
    let errorMessage = req.flash('error');
    if (errorMessage.length > 0) {
      errorMessage = errorMessage[0];
    } else {
      errorMessage = null;
    }

    res.render('auth/signup', {
      pageTitle: 'Sign Up',
      path: '/signup',
      errorMessage: errorMessage,
      previousInvalidInput: { username: "", email: "", password: "", confirmPassword: "" },
      validationErrors: {}
    });
  }

  static async signup(req, res, next) {
    const { username, email, password, confirmPassword } = req.body;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(422).render('auth/signup', {
        pageTitle: 'Sign Up',
        path: '/signup',
        errorMessage: '',
        previousInvalidInput: { username, email, password, confirmPassword },
        validationErrors: errors.mapped()
      });
    }

    const buffer = await crypto.randomBytes(32);
    const token = buffer.toString('hex');

    try {
      const hashedPass = await bcrypt.hash(password, 12);
      await User.create({
        username,
        email,
        password: hashedPass,
        verifyEmailToken: token,
        verifyEmailTokenExpiration: Date.now() + 3600000
      });
      req.flash('info', `We have sent a verification e-mail to ${email}. Clicking the link in the e-mail will confirm the validity of your e-mail address and your account will be created.`);
      res.redirect('/');

      try {
        await transporter.sendMail({
          to: email,
          from: 'My Marvel <hadzikocoski60k@gmail.com>',
          subject: 'E-mail verification',
          html: `
            <h1>Hello, ${username}! Welcome to My Marvel!</h1>
            <p>Click this <a href="https://my-marvel-express.herokuapp.com/verify/${username}/${token}">link</a>, so your e-mail can be verified and your account will be created.</p>
          `
        });
      } catch (err) {
        console.log(err);
      }
    } catch (err) {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    }
  }

  static async verifyEmail(req, res, next) {
    const username = req.params.username;
    const token = req.params.token;

    try {
      const user = await User.findOne({ username: username, verifyEmailToken: token, verifyEmailTokenExpiration: { $gt: Date.now() } });
      if (!user) {
        req.flash('error', 'E-mail verification session has expired. Please try again!');
        return res.redirect('/signup');
      }

      user.verifyEmailToken = undefined;
      user.verifyEmailTokenExpiration = undefined;
      user.isUserVerified = true;
      await user.save();
      req.flash('info', 'Your account was successfully created. You can now log in!');
      res.redirect('/login');
    } catch (err) {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    }
  }

  static getLoginPage(req, res, next) {
    let errorMessage = req.flash('error');
    if (errorMessage.length > 0) {
      errorMessage = errorMessage[0];
    } else {
      errorMessage = null;
    }

    let infoMessage = req.flash('info');
    if (infoMessage.length > 0) {
      infoMessage = infoMessage[0];
    } else {
      infoMessage = null;
    }

    res.render('auth/login', {
      pageTitle: 'Log In',
      path: '/login',
      errorMessage: errorMessage,
      infoMessage: infoMessage,
      previousInvalidInput: { email: "", password: "" },
      validationErrors: {}
    });
  }

  static async login(req, res, next) {
    const { email, password } = req.body;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(422).render('auth/login', {
        pageTitle: 'Log In',
        path: '/login',
        errorMessage: '',
        infoMessage: '',
        previousInvalidInput: { email, password },
        validationErrors: errors.mapped()
      });
    }

    try {
      const user = await User.findOne({ email: email, isUserVerified: true });
      if (!user) {
        return res.status(422).render('auth/login', {
          pageTitle: 'Log In',
          path: '/login',
          errorMessage: 'Such email is not registered in our database. Please try again or sign up.',
          infoMessage: '',
          previousInvalidInput: { email, password },
          validationErrors: errors.mapped()
        });
      }

      try {
        let passwordsMatch = await bcrypt.compare(password, user.password);
        if (passwordsMatch) {
          req.session.isLoggedIn = true;
          req.session.user = user;
          return req.session.save(err => {
            if (err) console.log(err);
            req.flash('info', 'You have successfully logged in!');
            res.redirect('/');
          });
        }
        return res.status(422).render('auth/login', {
          pageTitle: 'Log In',
          path: '/login',
          errorMessage: 'Invalid password. Please try again!',
          infoMessage: '',
          previousInvalidInput: { email, password },
          validationErrors: errors.mapped()
        });
      } catch (err) {
        console.log(err);
        res.redirect('/login');
      }

    } catch (err) {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    }
  }

  static logout(req, res, next) {
    req.session.destroy(err => {
      if (err) console.log(err);
      res.clearCookie('my-marvel');
      res.redirect('/');
    });
  }

  static getResetPasswordPage(req, res, next) {
    let errorMessage = req.flash('error');
    if (errorMessage.length > 0) {
      errorMessage = errorMessage[0];
    } else {
      errorMessage = null;
    }

    res.render('auth/reset-password', {
      pageTitle: 'Reset Password',
      path: '/reset',
      errorMessage: errorMessage,
      previousInvalidInput: ''
    });
  }

  static async resetPassword(req, res, next) {
    const { email } = req.body;
    const buffer = await crypto.randomBytes(32);
    const token = buffer.toString('hex');

    try {
      const user = await User.findOne({ email: email });
      if (!user) {
        return res.status(422).render('auth/reset-password', {
          pageTitle: 'Reset Password',
          path: '/reset',
          errorMessage: 'Such email is not registered in our database. Please try again or sign up.',
          previousInvalidInput: email
        });
      }
      user.resetPasswordToken = token;
      user.resetPasswordTokenExpiration = Date.now() + 3600000;
      await user.save();
      req.flash('info', `We have sent a verification e-mail to ${email}. Clicking the link in the e-mail will get you to the next page where your new password can be entered.`);
      res.redirect('/');

      try {
        transporter.sendMail({
          to: email,
          from: 'My Marvel <hadzikocoski60k@gmail.com>',
          subject: 'Password reset',
          html: `
            <h1>Hello, ${user.username}!</h1>
            <p>You have requested a password reset.</p>
            <p>Click this <a href="https://my-marvel-express.herokuapp.com/reset/${token}">link</a> to set a new password.</p>
          `
        });
      } catch (err) {
        console.log(err);
      }
    } catch (err) {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    }
  }

  static async getSetNewPasswordPage(req, res, next) {
    const token = req.params.token;

    try {
      const user = await User.findOne({ resetPasswordToken: token, resetPasswordTokenExpiration: { $gt: Date.now() } });
      if (!user) {
        req.flash('error', 'Reset password session has expired. Please try again!');
        return res.redirect('/login');
      }

      res.render('auth/set-new-password', {
        pageTitle: 'New Password',
        path: '/set-new-password',
        userId: user._id.toString(),
        passwordToken: token,
        previousInvalidInput: '',
        validationErrors: {}
      });
    } catch (err) {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    }
  }

  static async setNewPassword(req, res, next) {
    const { newPassword, userId, passwordToken } = req.body;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).render('auth/set-new-password', {
        pageTitle: 'New Password',
        path: '/set-new-password',
        userId: userId,
        passwordToken: passwordToken,
        previousInvalidInput: newPassword,
        validationErrors: errors.mapped()
      });
    }

    try {
      const [ user, hashedPass ] = await Promise.all([
        User.findOne({ _id: userId, resetPasswordToken: passwordToken, resetPasswordTokenExpiration: { $gt: Date.now() } }),
        bcrypt.hash(newPassword, 12)
      ]);
      if (!user) {
        req.flash('error', 'Reset password session has expired. Please try again!');
        return res.redirect('/login');
      }

      user.password = hashedPass;
      user.resetPasswordToken = undefined;
      user.resetPasswordTokenExpiration = undefined;
      await user.save();
      req.flash('info', 'You have successfully changed your password');
      res.redirect('/login');
    } catch (err) {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    }
  }
};
