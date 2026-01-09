import express from 'express';
import multer from 'multer';
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
import { verifyToken } from '../middlewares/authMiddleware.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/posts', getAllForumPosts);
router.get('/posts/:postId', getForumPostById);
router.get('/posts/:postId/comments', getForumComments);

router.post('/posts', verifyToken, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'document', maxCount: 1 }]), createForumPost);
router.patch('/posts/:postId', verifyToken, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'document', maxCount: 1 }]), updateForumPost);
router.delete('/posts/:postId', verifyToken, deleteForumPost);
router.patch('/posts/:postId/upvote', verifyToken, upvoteForumPost);

router.post('/posts/:postId/comments', verifyToken, createForumComment);
router.patch('/comments/:commentId', verifyToken, updateForumComment);
router.delete('/comments/:commentId', verifyToken, deleteForumComment);
router.patch('/comments/:commentId/upvote', verifyToken, upvoteForumComment);

export default router;
