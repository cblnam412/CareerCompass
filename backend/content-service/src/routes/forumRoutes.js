import express from 'express';
import {
  createForumPost,
  deleteForumPost,
  getAllForumPosts,
  getForumPostById,
  updateForumPost,
  upvoteForumPost,
} from '../controllers/forumPostController.js';
import {
  createForumComment,
  deleteForumComment,
  getCommentById,
  getForumComments,
  updateForumComment,
  upvoteForumComment,
} from '../controllers/forumCommentController.js';
import { optionalAuth, verifyToken } from '../middlewares/auth.js';
import { uploadForumCommentFiles, uploadForumPostFiles } from '../middlewares/upload.js';

const router = express.Router();

router.get('/posts', optionalAuth, getAllForumPosts);
router.get('/posts/:postId', optionalAuth, getForumPostById);
router.get('/posts/:postId/comments', optionalAuth, getForumComments);

router.post('/posts', verifyToken, uploadForumPostFiles, createForumPost);
router.patch('/posts/:postId', verifyToken, uploadForumPostFiles, updateForumPost);
router.delete('/posts/:postId', verifyToken, deleteForumPost);
router.patch('/posts/:postId/upvote', verifyToken, upvoteForumPost);

router.post('/posts/:postId/comments', verifyToken, uploadForumCommentFiles, createForumComment);
router.get('/comments/:commentId', optionalAuth, getCommentById);
router.patch('/comments/:commentId', verifyToken, uploadForumCommentFiles, updateForumComment);
router.delete('/comments/:commentId', verifyToken, deleteForumComment);
router.patch('/comments/:commentId/upvote', verifyToken, upvoteForumComment);

export default router;
