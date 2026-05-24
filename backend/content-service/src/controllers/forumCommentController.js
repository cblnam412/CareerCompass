import forumCommentService from '../services/forumCommentService.js';

export const getForumComments = async (req, res, next) => {
  try {
    const result = await forumCommentService.getByPost(req.params.postId, req.query, req.userId);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const createForumComment = async (req, res, next) => {
  try {
    const data = await forumCommentService.create(req.params.postId, req.body, req.files, req.userId);
    res.status(201).json({ success: true, message: 'Bình luận thành công', data });
  } catch (error) {
    next(error);
  }
};

export const getCommentById = async (req, res, next) => {
  try {
    const data = await forumCommentService.getById(req.params.commentId, req.userId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const updateForumComment = async (req, res, next) => {
  try {
    const data = await forumCommentService.update(req.params.commentId, req.body, req.files, req.userId);
    res.status(200).json({ success: true, message: 'Cập nhật bình luận thành công', data });
  } catch (error) {
    next(error);
  }
};

export const deleteForumComment = async (req, res, next) => {
  try {
    await forumCommentService.delete(req.params.commentId, req.userId);
    res.status(200).json({ success: true, message: 'Xóa bình luận thành công' });
  } catch (error) {
    next(error);
  }
};

export const upvoteForumComment = async (req, res, next) => {
  try {
    const data = await forumCommentService.toggleUpvote(req.params.commentId, req.userId);
    res.status(200).json({ success: true, message: data.isUpvoted ? 'Upvote thành công' : 'Hủy upvote thành công', data });
  } catch (error) {
    next(error);
  }
};
