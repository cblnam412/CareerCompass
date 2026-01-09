import ForumPost from '../models/ForumPost.js';
import ForumComment from '../models/ForumComment.js';
import User from '../models/User.js';

export const getAllForumPosts = async (req, res) => {
    try {
        const { search, status = 'active', sort = '-createdAt', limit = 10, page = 1 } = req.query;
        const skip = (page - 1) * limit;

        const filter = {};
        
        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { content: { $regex: search, $options: 'i' } }
            ];
        }

        if (status) {
            filter.status = status;
        }

        const posts = await ForumPost.find(filter)
            .populate('authorId', 'fullName email role')
            .populate('relatedMajorIds', 'name')
            .populate('relatedUniversityIds', 'name code')
            .skip(skip)
            .limit(parseInt(limit))
            .sort(sort);

        const total = await ForumPost.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: posts,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Get forum posts error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi lấy danh sách bài viết',
            error: error.message
        });
    }
};

export const getForumPostById = async (req, res) => {
    try {
        const { postId } = req.params;

        const post = await ForumPost.findById(postId)
            .populate('authorId', 'fullName email')
            .populate('relatedMajorIds', 'name')
            .populate('relatedUniversityIds', 'name code');

        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Bài viết không tồn tại'
            });
        }

        const comments = await ForumComment.find({ postId })
            .populate('authorId', 'fullName email')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: {
                post,
                comments
            }
        });

    } catch (error) {
        console.error('Get forum post error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi lấy chi tiết bài viết',
            error: error.message
        });
    }
};

export const createForumPost = async (req, res) => {
    try {
        const { title, content, itemUrl, relatedMajorIds, relatedUniversityIds } = req.body;
        const authorId = req.body.userId || req.headers['x-user-id'];

        if (!title || title.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp tiêu đề'
            });
        }

        if (!content || content.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp nội dung'
            });
        }

        if (!authorId) {
            return res.status(401).json({
                success: false,
                message: 'Vui lòng đăng nhập'
            });
        }

        const user = await User.findById(authorId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Người dùng không tồn tại'
            });
        }

        const newPost = new ForumPost({
            authorId,
            title: title.trim(),
            content: content.trim(),
            itemUrl,
            relatedMajorIds: relatedMajorIds || [],
            relatedUniversityIds: relatedUniversityIds || [],
            status: 'active'
        });

        const savedPost = await newPost.save();
        
        await savedPost.populate('authorId', 'fullName email');

        res.status(201).json({
            success: true,
            message: 'Tạo bài viết thành công',
            data: savedPost
        });

    } catch (error) {
        console.error('Create forum post error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi tạo bài viết',
            error: error.message
        });
    }
};

export const updateForumPost = async (req, res) => {
    try {
        const { postId } = req.params;
        const { title, content, itemUrl, relatedMajorIds, relatedUniversityIds, status } = req.body;
        const userId = req.body.userId || req.headers['x-user-id'];

        const post = await ForumPost.findById(postId);

        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Bài viết không tồn tại'
            });
        }

        if (post.authorId.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền chỉnh sửa bài viết này'
            });
        }

        if (title) post.title = title.trim();
        if (content) post.content = content.trim();
        if (itemUrl) post.itemUrl = itemUrl;
        if (relatedMajorIds) post.relatedMajorIds = relatedMajorIds;
        if (relatedUniversityIds) post.relatedUniversityIds = relatedUniversityIds;
        if (status && ['active', 'resolved', 'closed'].includes(status)) {
            post.status = status;
        }

        const updated = await post.save();
        await updated.populate('authorId', 'fullName email');

        res.status(200).json({
            success: true,
            message: 'Cập nhật bài viết thành công',
            data: updated
        });

    } catch (error) {
        console.error('Update forum post error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi cập nhật bài viết',
            error: error.message
        });
    }
};

export const deleteForumPost = async (req, res) => {
    try {
        const { postId } = req.params;
        const userId = req.body.userId || req.headers['x-user-id'];

        const post = await ForumPost.findById(postId);

        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Bài viết không tồn tại'
            });
        }

        if (post.authorId.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền xóa bài viết này'
            });
        }

        await ForumPost.findByIdAndDelete(postId);
        await ForumComment.deleteMany({ postId });

        res.status(200).json({
            success: true,
            message: 'Xóa bài viết thành công'
        });

    } catch (error) {
        console.error('Delete forum post error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi xóa bài viết',
            error: error.message
        });
    }
};

export const upvoteForumPost = async (req, res) => {
    try {
        const { postId } = req.params;

        const post = await ForumPost.findById(postId);

        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Bài viết không tồn tại'
            });
        }

        post.upvotes += 1;
        const updated = await post.save();

        res.status(200).json({
            success: true,
            message: 'Upvote thành công',
            data: { upvotes: updated.upvotes }
        });

    } catch (error) {
        console.error('Upvote post error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi upvote',
            error: error.message
        });
    }
};
