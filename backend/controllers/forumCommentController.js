import ForumComment from '../models/ForumComment.js';
import ForumPost from '../models/ForumPost.js';
import User from '../models/User.js';

export const getForumComments = async (req, res) => {
    try {
        const { postId } = req.params;
        const { sort = '-createdAt', limit = 20, page = 1 } = req.query;
        const skip = (page - 1) * limit;

        const post = await ForumPost.findById(postId);
        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Bài viết không tồn tại'
            });
        }

        const comments = await ForumComment.find({ postId })
            .populate('authorId', 'fullName email')
            .populate('parentCommentId', 'content authorId')
            .skip(skip)
            .limit(parseInt(limit))
            .sort(sort);

        const total = await ForumComment.countDocuments({ postId });

        res.status(200).json({
            success: true,
            data: comments,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Get forum comments error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi lấy danh sách bình luận',
            error: error.message
        });
    }
};

export const createForumComment = async (req, res) => {
    try {
        const { postId } = req.params;
        const { content, itemUrl, parentCommentId } = req.body;
        const authorId = req.body.userId || req.headers['x-user-id'];

        if (!content || content.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp nội dung bình luận'
            });
        }

        if (!authorId) {
            return res.status(401).json({
                success: false,
                message: 'Vui lòng đăng nhập'
            });
        }

        const post = await ForumPost.findById(postId);
        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Bài viết không tồn tại'
            });
        }

        const user = await User.findById(authorId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Người dùng không tồn tại'
            });
        }

        if (parentCommentId) {
            const parentComment = await ForumComment.findById(parentCommentId);
            if (!parentComment) {
                return res.status(404).json({
                    success: false,
                    message: 'Bình luận gốc không tồn tại'
                });
            }
        }

        const newComment = new ForumComment({
            postId,
            authorId,
            content: content.trim(),
            itemUrl,
            parentCommentId: parentCommentId || null
        });

        const savedComment = await newComment.save();

        post.commentCount = (post.commentCount || 0) + 1;
        await post.save();

        await savedComment.populate('authorId', 'fullName email');

        res.status(201).json({
            success: true,
            message: 'Bình luận thành công',
            data: savedComment
        });

    } catch (error) {
        console.error('Create forum comment error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi tạo bình luận',
            error: error.message
        });
    }
};

export const updateForumComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const { content, itemUrl } = req.body;
        const userId = req.body.userId || req.headers['x-user-id'];

        const comment = await ForumComment.findById(commentId);

        if (!comment) {
            return res.status(404).json({
                success: false,
                message: 'Bình luận không tồn tại'
            });
        }

        if (comment.authorId.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền chỉnh sửa bình luận này'
            });
        }

        if (content) comment.content = content.trim();
        if (itemUrl) comment.itemUrl = itemUrl;

        const updated = await comment.save();
        await updated.populate('authorId', 'fullName email');

        res.status(200).json({
            success: true,
            message: 'Cập nhật bình luận thành công',
            data: updated
        });

    } catch (error) {
        console.error('Update forum comment error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi cập nhật bình luận',
            error: error.message
        });
    }
};

export const deleteForumComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const userId = req.body.userId || req.headers['x-user-id'];

        const comment = await ForumComment.findById(commentId);

        if (!comment) {
            return res.status(404).json({
                success: false,
                message: 'Bình luận không tồn tại'
            });
        }

        if (comment.authorId.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền xóa bình luận này'
            });
        }

        const postId = comment.postId;

        await ForumComment.findByIdAndDelete(commentId);

        const post = await ForumPost.findById(postId);
        if (post && post.commentCount > 0) {
            post.commentCount -= 1;
            await post.save();
        }

        await ForumComment.deleteMany({ parentCommentId: commentId });

        res.status(200).json({
            success: true,
            message: 'Xóa bình luận thành công'
        });

    } catch (error) {
        console.error('Delete forum comment error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi xóa bình luận',
            error: error.message
        });
    }
};

export const upvoteForumComment = async (req, res) => {
    try {
        const { commentId } = req.params;

        const comment = await ForumComment.findById(commentId);

        if (!comment) {
            return res.status(404).json({
                success: false,
                message: 'Bình luận không tồn tại'
            });
        }

        comment.upvotes += 1;
        const updated = await comment.save();

        res.status(200).json({
            success: true,
            message: 'Upvote thành công',
            data: { upvotes: updated.upvotes }
        });

    } catch (error) {
        console.error('Upvote comment error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi upvote',
            error: error.message
        });
    }
};
