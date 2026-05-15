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
    if (!mongoose.Types.ObjectId.isValid(commentId)) throw new HttpError(400, 'commentId khong hop le');
    const comment = await ForumCommentRepository.findById(commentId).populate('parentCommentId', 'content authorId');
    if (!comment) throw new HttpError(404, 'Binh luan khong ton tai');

    const data = await attachUsers(comment, 'authorId');
    return withUpvoteFlag(data, userId);
  }

  async getByPost(postId, query = {}, userId = null) {
    const post = await ForumPostRepository.findById(postId);
    if (!post) throw new HttpError(404, 'Bai viet khong ton tai');

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
    if (!result.success) throw new HttpError(400, `Loi upload hinh anh: ${result.error}`);
    return { itemUrl: result.url };
  }

  async create(postId, payload = {}, files = {}, authorId) {
    const content = payload.content?.trim();
    if (!content) throw new HttpError(400, 'Vui long cung cap noi dung binh luan');

    const [post] = await Promise.all([
      ForumPostRepository.findById(postId),
      getUserById(authorId),
    ]);
    if (!post) throw new HttpError(404, 'Bai viet khong ton tai');

    let parentCommentId = payload.parentCommentId || null;
    if (parentCommentId) {
      const parent = await ForumCommentRepository.findById(parentCommentId);
      if (!parent) throw new HttpError(404, 'Binh luan goc khong ton tai');
      if (String(parent.postId) !== String(postId)) {
        throw new HttpError(400, 'Binh luan goc khong thuoc bai viet nay');
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
    if (!comment) throw new HttpError(404, 'Binh luan khong ton tai');
    if (String(comment.authorId) !== String(userId)) {
      throw new HttpError(403, 'Ban khong co quyen chinh sua binh luan nay');
    }

    const update = await this.uploadImage(files, comment);
    if (payload.content !== undefined) {
      const content = payload.content.trim();
      if (!content) throw new HttpError(400, 'Noi dung khong duoc de trong');
      update.content = content;
    }
    if (payload.itemUrl !== undefined && !firstFile(files, 'image')) update.itemUrl = payload.itemUrl;

    const updated = await ForumCommentRepository.updateById(commentId, update);
    return attachUsers(updated, 'authorId');
  }

  async delete(commentId, userId, { bypassOwner = false } = {}) {
    const comment = await ForumCommentRepository.findById(commentId);
    if (!comment) throw new HttpError(404, 'Binh luan khong ton tai');
    if (!bypassOwner && String(comment.authorId) !== String(userId)) {
      throw new HttpError(403, 'Ban khong co quyen xoa binh luan nay');
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
    if (!comment) throw new HttpError(404, 'Binh luan khong ton tai');

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
