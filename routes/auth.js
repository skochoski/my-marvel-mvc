import express from 'express';
import { body } from 'express-validator';

import AuthController from '../controllers/auth.js';
import User from '../models/user.js';
import { isAuth, isNotAuth } from '../middleware/is-auth.js';

const router = express.Router();

router.get('/signup', isNotAuth, AuthController.getSignupPage);
router.get('/verify/:username/:token', isNotAuth, AuthController.verifyEmail);
router.post('/signup',
  [
    body('username', 'Your username should contain at least 5 alphanumeric characters (a-z, A-Z, 0-9)')
      .trim()
      .isAlphanumeric()
      .isLength({ min: 5 })
      .custom(async (value) => {
        const user = await User.findOne({ username: value });
        if (user) {
          return Promise.reject('Username already exists, please sign up with a different one');
        }

        return true;
      }),
    body('email')
      .isEmail()
      .withMessage('Please enter a valid e-mail')
      .custom(async (value) => {
        const user = await User.findOne({ email: value });
        if (user) {
          return Promise.reject('E-mail already exists, please sign up with a different one');
        }
        return true;
      })
      .trim()
      .normalizeEmail(),
    body('password', 'Your password should contain at least 8 characters')
      .trim()
      .isLength({ min: 8 }),
    body('confirmPassword')
      .trim()
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error('Passwords have to match!');
        }
        return true;
    })
  ],
  isNotAuth, AuthController.signup);

router.get('/login', isNotAuth, AuthController.getLoginPage);
router.post('/login',
  [
    body('email')
      .isEmail()
      .withMessage('Please enter a valid e-mail')
      .trim()
      .normalizeEmail(),
    body('password', 'Your password contains at least 8 characters')
      .trim()
      .isLength({ min: 8 })
  ],
  isNotAuth, AuthController.login);

router.post('/logout', isAuth, AuthController.logout);
router.get('/reset', isNotAuth, AuthController.getResetPasswordPage);
router.post('/reset', isNotAuth, AuthController.resetPassword);
router.get('/reset/:token', isNotAuth, AuthController.getSetNewPasswordPage);
router.post('/set-new-password',
  [
    body('newPassword', 'Your password should contain at least 8 characters')
      .trim()
      .isLength({ min: 8 })
  ], isNotAuth, AuthController.setNewPassword);

export default router;
