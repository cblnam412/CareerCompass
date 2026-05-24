import mongoose from 'mongoose';
import { getUserById } from '../clients/authServiceClient.js';
import {
  FileRepository,
  ForumCommentRepository,
  ForumPostRepository,
} from '../repositories/index.js';
import { HttpError } from '../utils/httpError.js';
import { getPagination, getSort, toPlain } from '../utils/query.js';
import { attachUsers } from './lookupService.js';

const hasUserUpvoted = (upvoters = [], userId) =>
  Boolean(userId) && upvoters.some((id) => String(id) === String(userId));

const withUpvoteFlag = (item, userId) => ({
  ...item,
  isUpvoted: hasUserUpvoted(item.upvoters, userId),
});

const firstFile = (files, field) => {
  const value = files?.[field];
  return Array.isArray(value) ? value[0] : value;
};

class ForumCommentService {
  async getById(commentId, userId = null) {
    if (!mongoose.Types.ObjectId.isValid(commentId)) throw new HttpError(400, 'commentId không hợp lệ');
    const comment = await ForumCommentRepository.findById(commentId).populate('parentCommentId', 'content authorId');
    if (!comment) throw new HttpError(404, 'Bình luận không tồn tại');

    const data = await attachUsers(comment, 'authorId');
    return withUpvoteFlag(data, userId);
  }

  async getByPost(postId, query = {}, userId = null) {
    const post = await ForumPostRepository.findById(postId);
    if (!post) throw new HttpError(404, 'Bài viết không tồn tại');

    const { page, limit, skip } = getPagination(query, 20);
    const sort = getSort(query, '-createdAt');
    const filter = { postId };
    const [comments, total] = await Promise.all([
      ForumCommentRepository.findMany(filter, { sort, skip, limit, populateParent: true }),
      ForumCommentRepository.count(filter),
    ]);

    const data = await attachUsers(comments, 'authorId');
    return {
      data: data.map((comment) => withUpvoteFlag(comment, userId)),
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  }

  async uploadImage(files = {}, existing = {}) {
    const image = firstFile(files, 'image');
    if (!image) return {};

    if (existing.itemUrl) {
      await FileRepository.deleteFile(
        'forum-comments',
        FileRepository.extractPathFromUrl('forum-comments', existing.itemUrl),
      );
    }

    const result = await FileRepository.uploadFile(image, 'forum-comments', 'images');
    if (!result.success) throw new HttpError(400, `Lỗi upload hình ảnh: ${result.error}`);
    return { itemUrl: result.url };
  }

  async create(postId, payload = {}, files = {}, authorId) {
    const content = payload.content?.trim();
    if (!content) throw new HttpError(400, 'Vui lòng cung cấp nội dung bình luận');

    const [post] = await Promise.all([
      ForumPostRepository.findById(postId),
      getUserById(authorId),
    ]);
    if (!post) throw new HttpError(404, 'Bài viết không tồn tại');

    let parentCommentId = payload.parentCommentId || null;
    if (parentCommentId) {
      const parent = await ForumCommentRepository.findById(parentCommentId);
      if (!parent) throw new HttpError(404, 'Bình luận gốc không tồn tại');
      if (String(parent.postId) !== String(postId)) {
        throw new HttpError(400, 'Bình luận gốc không thuộc bài viết này');
      }
    }

    const upload = await this.uploadImage(files);
    const comment = await ForumCommentRepository.create({
      postId,
      authorId,
      content,
      itemUrl: upload.itemUrl || payload.itemUrl || '',
      parentCommentId,
    });

    await ForumPostRepository.incrementCommentCount(postId, 1);
    return attachUsers(comment, 'authorId');
  }

  async update(commentId, payload = {}, files = {}, userId) {
    const comment = await ForumCommentRepository.findById(commentId);
    if (!comment) throw new HttpError(404, 'Bình luận không tồn tại');
    if (String(comment.authorId) !== String(userId)) {
      throw new HttpError(403, 'Bạn không có quyền chỉnh sửa bình luận này');
    }

    const update = await this.uploadImage(files, comment);
    if (payload.content !== undefined) {
      const content = payload.content.trim();
      if (!content) throw new HttpError(400, 'Nội dung không được để trống');
      update.content = content;
    }
    if (payload.itemUrl !== undefined && !firstFile(files, 'image')) update.itemUrl = payload.itemUrl;

    const updated = await ForumCommentRepository.updateById(commentId, update);
    return attachUsers(updated, 'authorId');
  }

  async delete(commentId, userId, { bypassOwner = false } = {}) {
    const comment = await ForumCommentRepository.findById(commentId);
    if (!comment) throw new HttpError(404, 'Bình luận không tồn tại');
    if (!bypassOwner && String(comment.authorId) !== String(userId)) {
      throw new HttpError(403, 'Bạn không có quyền xóa bình luận này');
    }

    const data = toPlain(comment);
    if (data.itemUrl) {
      await FileRepository.deleteFile('forum-comments', FileRepository.extractPathFromUrl('forum-comments', data.itemUrl));
    }

    const { deletedCount, replies } = await ForumCommentRepository.deleteWithReplies(commentId);
    await Promise.all(replies.map((reply) => {
      const replyData = toPlain(reply);
      return replyData.itemUrl
        ? FileRepository.deleteFile('forum-comments', FileRepository.extractPathFromUrl('forum-comments', replyData.itemUrl))
        : Promise.resolve();
    }));

    if (deletedCount > 0) {
      await ForumPostRepository.incrementCommentCount(comment.postId, -deletedCount);
    }

    return { deletedCount };
  }

  async toggleUpvote(commentId, userId) {
    const comment = await ForumCommentRepository.findById(commentId);
    if (!comment) throw new HttpError(404, 'Bình luận không tồn tại');

    const hasUpvoted = hasUserUpvoted(comment.upvoters, userId);
    comment.upvoters = hasUpvoted
      ? comment.upvoters.filter((id) => String(id) !== String(userId))
      : [...comment.upvoters, userId];
    comment.upvotes = hasUpvoted ? Math.max(0, comment.upvotes - 1) : comment.upvotes + 1;
    await comment.save();

    return { upvotes: comment.upvotes, isUpvoted: !hasUpvoted };
  }
}

export default new ForumCommentService();
