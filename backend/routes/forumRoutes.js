import express from 'express';
import {
    getAllForumPosts,
    getForumPostById,
    createForumPost,
    updateForumPost,
    deleteForumPost,
    upvoteForumPost
} from '../controllers/forumPostController.js';
import {
    getForumComments,
    createForumComment,
    updateForumComment,
    deleteForumComment,
    upvoteForumComment
} from '../controllers/forumCommentController.js';

const router = express.Router();

router.get('/posts', getAllForumPosts);
router.get('/posts/:postId', getForumPostById);
router.post('/posts', createForumPost);
router.patch('/posts/:postId', updateForumPost);
router.delete('/posts/:postId', deleteForumPost);
router.patch('/posts/:postId/upvote', upvoteForumPost);
router.get('/posts/:postId/comments', getForumComments);
router.post('/posts/:postId/comments', createForumComment);
router.patch('/comments/:commentId', updateForumComment);
router.delete('/comments/:commentId', deleteForumComment);
router.patch('/comments/:commentId/upvote', upvoteForumComment);

export default router;
