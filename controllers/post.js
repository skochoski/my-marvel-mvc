import path from 'path';

import mongoose from 'mongoose';
import { validationResult } from 'express-validator';
import tinify from 'tinify';
tinify.key = process.env.TINIFY_KEY;

import Post from '../models/post.js';
import { removeFile } from '../utils/removeFile.js';
import { uploadToS3, deleteFromS3 } from '../utils/s3Client.js';

const POSTS_PER_PAGE = 6;

export default class PostController {
  static async getPostsPage(req, res, next) {
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

    const searchQuery = new URLSearchParams(req.query);
    let page = +req.query.page || 1;
    const isSortQuery = searchQuery.has('sort');
    const isSortQueryValid = isSortQuery && (req.query.sort === 'comments' || req.query.sort === 'likes');
    const landingOnPage = !searchQuery.has('sort') && !searchQuery.has('page');
    let posts;

    try {
      const totalPosts = await Post.estimatedDocumentCount();
      if (page > Math.ceil(totalPosts / POSTS_PER_PAGE)) page = 1;

      if (isSortQueryValid && req.query.sort === 'comments') {
        posts = await Post.find()
        .lean()
        .sort({ 'commentsCount': -1 })
        .skip((page - 1) * POSTS_PER_PAGE)
        .limit(POSTS_PER_PAGE);

      } else if (isSortQueryValid && req.query.sort === 'likes') {
        posts = await Post.find()
        .lean()
        .sort({ 'likesCount': -1 })
        .skip((page - 1) * POSTS_PER_PAGE)
        .limit(POSTS_PER_PAGE)

      } else if (!isSortQuery) {
        posts = await Post.find()
        .sort({ _id: -1 })
        .skip((page - 1) * POSTS_PER_PAGE)
        .limit(POSTS_PER_PAGE);
      }

      res.render('posts/posts', {
        pageTitle: 'Marvel Posts',
        path: '/posts',
        posts: posts,
        errorMessage: errorMessage,
        infoMessage: infoMessage,
        isSortQueryValid: isSortQueryValid,
        sortQuery: req.query.sort,
        landingOnPage: landingOnPage,
        currentPage: page,
        previousPage: page - 1,
        nextPage: page + 1,
        hasPreviousPage: page > 1,
        hasNextPage: page * POSTS_PER_PAGE < totalPosts,
        lastPage: Math.ceil(totalPosts / POSTS_PER_PAGE)
      });
    } catch (err) {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    }
  }

  static async getMyPostsPage(req, res, next) {
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

    try {
      const posts = await Post.find({ creatorId: req.user._id }).sort({ _id: -1 });

      res.render('posts/my-posts', {
        pageTitle: 'My Marvel Posts',
        path: '/my-posts',
        posts: posts,
        errorMessage: errorMessage,
        infoMessage: infoMessage,
        username: req.user.username
      });
    } catch (err) {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    }
  }

  static getCreatePostPage(req, res, next) {
    let errorMessage = req.flash('error');
    if (errorMessage.length > 0) {
      errorMessage = errorMessage[0];
    } else {
      errorMessage = null;
    }

    res.render('posts/create-post', {
      pageTitle: 'Create Post',
      path: '/posts/create',
      errorMessage: errorMessage,
      previousInvalidInput: { title: "", content: "" },
      validationErrors: {}
    });
  }

  static async createPost(req, res, next) {
    const { title, content } = req.body;
    const image = req.file;

    if (!image) {
      return res.status(422).render('posts/create-post', {
        pageTitle: 'Create Post',
        path: '/posts',
        errorMessage: 'Attached file is not an image.',
        previousInvalidInput: { title, content },
        validationErrors: {}
      });
    }

    if (image.size > 4000000) {
      return res.status(422).render('posts/create-post', {
        pageTitle: 'Create Post',
        path: '/posts',
        errorMessage: 'The image size should be less than 2MB.',
        previousInvalidInput: { title, content },
        validationErrors: {}
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).render('posts/create-post', {
        pageTitle: 'Create Post',
        path: '/posts',
        errorMessage: '',
        previousInvalidInput: { title, content },
        validationErrors: errors.mapped()
      });
    }

    try {
      const source = await tinify.fromFile(path.join(__dirname, image.path));
      let optimizedImageName = Date.now() + '-' + image.originalname;
      let optimizedImagePath = path.join(image.destination, optimizedImageName);
      await source.toFile(path.join(__dirname, optimizedImagePath));
      await uploadToS3(optimizedImagePath, image.mimetype);
      // removeFile(image.path);
      // removeFile(optimizedImagePath);
      await Post.create({
        title, content,
        imageName: optimizedImageName,
        imageUrl: `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_BUCKET_REGION}.amazonaws.com/${optimizedImageName}`,
        creator: req.user.username,
        creatorId: req.user._id
      });
      req.flash('info', 'Post created successfully!');
      res.redirect('/posts');
    } catch (err) {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    }
  }

  static async getEditPostPage(req, res, next) {
    let errorMessage = req.flash('error');
    if (errorMessage.length > 0) {
      errorMessage = errorMessage[0];
    } else {
      errorMessage = null;
    }

    const postId = req.params.postId;

    try {
      const post = await Post.findById(postId);
      if (!post) {
        req.flash('error', `Invalid post ID. Post with ID: ${postId} does not exist in our database.`)
        return res.redirect('/posts/my-posts');
      }

      res.render('posts/edit-post', {
        pageTitle: 'Edit Post',
        path: '/posts',
        post: post,
        errorMessage: errorMessage,
        validationErrors: {}
      });

    } catch (err) {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    }
  }

  static async editPost(req, res, next) {
    const postId = req.params.postId;
    const updatedTitle = req.body.title;
    const updatedContent = req.body.content;
    const image = req.file;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).render('posts/edit-post', {
        pageTitle: 'Edit Post',
        path: '/posts',
        post: {
          title: updatedTitle,
          content: updatedContent,
        },
        errorMessage: '',
        validationErrors: errors.mapped()
      });
    }

    try {
      const post = await Post.findById(postId);
      if (!post) {
        req.flash('error', `Invalid post ID. Post with ID: ${postId} does not exist in our database.`)
        return res.redirect('/posts/my-posts');
      }

      if (post.creatorId.toString() !== req.user._id.toString()) {
        req.flash('error', 'Operation Forbidden! You are not authorized to edit this post!');
        return res.status(403).redirect('/');
      }

      post.title = updatedTitle;
      post.content = updatedContent;

      if (image) {
        const source = await tinify.fromFile(path.join(__dirname, image.path));
        let optimizedImageName = Date.now() + '-' + image.originalname;
        let optimizedImagePath = path.join(image.destination, optimizedImageName);
        await source.toFile(path.join(__dirname, optimizedImagePath));
        await uploadToS3(optimizedImagePath, image.mimetype);
        await deleteFromS3(post.imageName);
        // removeFile(image.path);
        // removeFile(optimizedImagePath);
        post.imageName = optimizedImageName;
        post.imageUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_BUCKET_REGION}.amazonaws.com/${optimizedImageName}`;
      }
      await post.save();
      req.flash('info', 'Post updated successfully!');
      res.redirect(`/posts/details/${postId}`);

    } catch (err) {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    }
  }

  static async deletePost(req, res, next) {
    const postId = req.params.postId;
    try {
      const post = await Post.findById(postId);
      if (!post) {
        req.flash('error', `Invalid post ID. Post with ID: ${postId} does not exist in our database.`)
        return res.redirect('/posts/my-posts');
      }
      await Post.deleteOne({ _id: postId, creatorId: req.user._id });
      await deleteFromS3(post.imageName);
      res.status(200).json({ message: 'Post deleted successfully!' });

    } catch (err) {
      res.status(500).json({ message: 'Deleting post failed.' });
    }
  }

  static async getPostDetailsPage(req, res, next) {
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

    const postId = req.params.postId;
    if (mongoose.Types.ObjectId.isValid(postId)) {
      try {
        const post = await Post.findOne({ _id: postId });
        if (!post) {
          req.flash('error', `Sorry, post with ID: ${postId} does not exist in our database.`);
          return res.redirect('/posts');
        }

        let isUserCreator = post.creatorId.toString() === req?.user?._id.toString();
        let hasUserAlreadyLiked = post.usersLiked.includes(req?.user?.username) || false;
        const comments = post.comments.length > 0 ? post.comments.reverse() : [];

        res.render('posts/details', {
          pageTitle: post.title,
          path: '/posts',
          errorMessage: errorMessage,
          infoMessage: infoMessage,
          validationErrors: {},
          post: post,
          previousInvalidInput: '',
          isUserCreator: isUserCreator,
          hasUserAlreadyLiked: hasUserAlreadyLiked,
          comments: comments
        });
      } catch (err) {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
      }
    } else {
      req.flash('error', `Sorry, post with ID: ${postId} does not exist in our database.`);
      res.redirect('/posts');
    }
  }

  static async likePost(req, res, next) {
    const postId = req.params.postId;
    if (mongoose.Types.ObjectId.isValid(postId)) {
      try {
        const post = await Post.findOne({ _id: postId });
        if (!post) {
          req.flash('error', `Sorry, post with ID: ${postId} does not exist in our database.`);
          return res.redirect('/posts');
        }

        let hasUserAlreadyLiked = post.usersLiked.includes(req?.user?.username);
        if (!hasUserAlreadyLiked) {
          post.usersLiked.push(req.user.username);
          post.likesCount++;
          await post.save();
          res.redirect(`/posts/details/${postId}`);
        } else {
          req.flash('error', 'You have already liked this post!');
          return res.redirect('/posts');
        }

      } catch (err) {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
      }
    } else {
      req.flash('error', `Sorry, post with ID: ${postId} does not exist in our database.`);
      res.redirect('/posts');
    }
  }

  static async postComment(req, res, next) {
    const postId = req.params.postId;
    const { comment } = req.body;
    if (mongoose.Types.ObjectId.isValid(postId)) {
      try {
        const post = await Post.findOne({ _id: postId });
        if (!post) {
          req.flash('error', `Sorry, post with ID: ${postId} does not exist in our database.`);
          return res.redirect('/posts');
        }

        let isUserCreator = post.creatorId.toString() === req?.user?._id.toString();
        let hasUserAlreadyLiked = post.usersLiked.includes(req?.user?.username);
        const comments = post.comments.length > 0 ? post.comments.reverse() : [];

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(422).render('posts/details', {
            pageTitle: post.title,
            path: '/posts',
            errorMessage: '',
            infoMessage: '',
            validationErrors: errors.mapped(),
            post: post,
            previousInvalidInput: comment,
            isUserCreator: isUserCreator,
            hasUserAlreadyLiked: hasUserAlreadyLiked,
            comments: comments
          });
        }

        post.comments.push({ content: comment, creator: req.user.username });
        post.commentsCount++;
        await post.save();
        req.flash('info', 'Comment posted successfully!');
        res.redirect(`/posts/details/${postId}`);

      } catch (err) {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
      }
    } else {
      req.flash('error', `Sorry, post with ID: ${postId} does not exist in our database.`);
      res.redirect('/posts');
    }
  }
};
