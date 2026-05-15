import forumPostService from '../services/forumPostService.js';

export const getAllForumPosts = async (req, res, next) => {
  try {
    const result = await forumPostService.getAll(req.query, req.userId);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const getForumPostById = async (req, res, next) => {
  try {
    const data = await forumPostService.getById(req.params.postId, req.userId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const createForumPost = async (req, res, next) => {
  try {
    const data = await forumPostService.create(req.body, req.files, req.userId);
    res.status(201).json({ success: true, message: 'Tao bai viet thanh cong', data });
  } catch (error) {
    next(error);
  }
};

export const updateForumPost = async (req, res, next) => {
  try {
    const data = await forumPostService.update(req.params.postId, req.body, req.files, req.userId);
    res.status(200).json({ success: true, message: 'Cap nhat bai viet thanh cong', data });
  } catch (error) {
    next(error);
  }
};

export const deleteForumPost = async (req, res, next) => {
  try {
    await forumPostService.delete(req.params.postId, req.userId);
    res.status(200).json({ success: true, message: 'Xoa bai viet thanh cong' });
  } catch (error) {
    next(error);
  }
};

export const upvoteForumPost = async (req, res, next) => {
  try {
    const data = await forumPostService.toggleUpvote(req.params.postId, req.userId);
    res.status(200).json({ success: true, message: data.isUpvoted ? 'Upvote thanh cong' : 'Huy upvote thanh cong', data });
  } catch (error) {
    next(error);
  }
};
