import express from 'express';
import { body } from 'express-validator';

import PostController from '../controllers/post.js';
import { isAuth } from '../middleware/is-auth.js';

const router = express.Router();

router.get('/', PostController.getPostsPage);
router.get('/my-posts', isAuth, PostController.getMyPostsPage);
router.get('/create', isAuth, PostController.getCreatePostPage);
router.post('/create',
  [
    body('title', 'Your title should contain at least 5 characters')
      .isString()
      .isLength({ min: 5 })
      .trim(),
    body('content')
      .isLength({ min: 10 })
      .withMessage('Your post should contain at least 10 characters')
      .isLength({ max: 400 })
      .withMessage('Your post should contain less than 400 characters')
      .trim(),
  ], isAuth, PostController.createPost);

router.get('/edit/:postId', isAuth, PostController.getEditPostPage);
router.post('/edit/:postId',
  [
    body('title', 'Your title should contain at least 5 characters')
      .isString()
      .isLength({ min: 5 })
      .trim(),
    body('content')
      .isLength({ min: 10 })
      .withMessage('Your post should contain at least 10 characters')
      .isLength({ max: 400 })
      .withMessage('Your post should contain less than 400 characters')
      .trim(),
  ], isAuth, PostController.editPost);

router.delete('/delete/:postId', isAuth, PostController.deletePost);
router.get('/details/:postId', PostController.getPostDetailsPage);
router.post('/like/:postId', isAuth, PostController.likePost);
router.post('/comment/:postId',
[
  body('comment', 'Your comment should contain at least 5 characters')
    .isString()
    .trim()
    .isLength({ min: 5 })
], isAuth, PostController.postComment);

export default router;
