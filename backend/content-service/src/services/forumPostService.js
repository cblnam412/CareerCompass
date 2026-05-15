import mongoose from 'mongoose';
import { getUserById } from '../clients/authServiceClient.js';
import {
  FileRepository,
  ForumCommentRepository,
  ForumPostRepository,
} from '../repositories/index.js';
import { HttpError } from '../utils/httpError.js';
import { escapeRegex, getPagination, getSort, normalizeIdArray, toPlain } from '../utils/query.js';
import { attachPostLookups, attachUsers } from './lookupService.js';

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

class ForumPostService {
  buildFilter(query = {}) {
    const filter = {};
    if (query.authorId) filter.authorId = query.authorId;
    if (query.status && query.status !== 'all') filter.status = query.status;
    if (!query.status) filter.status = 'active';
    if (query.search) {
      const regex = { $regex: escapeRegex(query.search), $options: 'i' };
      filter.$or = [{ title: regex }, { content: regex }];
    }
    return filter;
  }

  async getAll(query = {}, userId = null) {
    const filter = this.buildFilter(query);
    const { page, limit, skip } = getPagination(query, 10);
    const sort = getSort(query, '-createdAt');
    const [posts, total] = await Promise.all([
      ForumPostRepository.findMany(filter, { sort, skip, limit }),
      ForumPostRepository.count(filter),
    ]);

    const data = (await attachPostLookups(posts)).map((post) => withUpvoteFlag(post, userId));

    return {
      data,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  }

  async getById(postId, userId = null) {
    if (!mongoose.Types.ObjectId.isValid(postId)) throw new HttpError(400, 'postId khong hop le');
    const post = await ForumPostRepository.findById(postId);
    if (!post) throw new HttpError(404, 'Bai viet khong ton tai');

    const comments = await ForumCommentRepository.findMany(
      { postId },
      { sort: '-createdAt', populateParent: true },
    );

    const [postData, commentData] = await Promise.all([
      attachPostLookups(post),
      attachUsers(comments, 'authorId'),
    ]);

    return {
      post: withUpvoteFlag(postData, userId),
      comments: commentData.map((comment) => withUpvoteFlag(comment, userId)),
    };
  }

  async uploadAttachments(files = {}, existing = {}) {
    const update = {};
    const image = firstFile(files, 'image');
    const document = firstFile(files, 'document');

    if (image) {
      if (existing.itemUrl) {
        await FileRepository.deleteFile(
          'forum-posts',
          FileRepository.extractPathFromUrl('forum-posts', existing.itemUrl),
        );
      }
      const result = await FileRepository.uploadFile(image, 'forum-posts', 'images');
      if (!result.success) throw new HttpError(400, `Loi upload hinh anh: ${result.error}`);
      update.itemUrl = result.url;
    }

    if (document) {
      if (existing.documentUrl) {
        await FileRepository.deleteFile(
          'forum-posts',
          FileRepository.extractPathFromUrl('forum-posts', existing.documentUrl),
        );
      }
      const result = await FileRepository.uploadFile(document, 'forum-posts', 'documents');
      if (!result.success) throw new HttpError(400, `Loi upload tai lieu: ${result.error}`);
      update.documentUrl = result.url;
    }

    return update;
  }

  async create(payload = {}, files = {}, authorId) {
    if (!authorId) throw new HttpError(401, 'Vui long dang nhap');
    const title = payload.title?.trim();
    const content = payload.content?.trim();
    if (!title) throw new HttpError(400, 'Vui long cung cap tieu de');
    if (!content) throw new HttpError(400, 'Vui long cung cap noi dung');

    await getUserById(authorId);
    const attachments = await this.uploadAttachments(files);
    const post = await ForumPostRepository.create({
      authorId,
      title,
      content,
      itemUrl: attachments.itemUrl || payload.itemUrl || '',
      documentUrl: attachments.documentUrl || '',
      relatedMajorIds: normalizeIdArray(payload.relatedMajorIds) || [],
      relatedUniversityIds: normalizeIdArray(payload.relatedUniversityIds) || [],
      status: 'active',
    });

    return attachPostLookups(post);
  }

  async update(postId, payload = {}, files = {}, userId) {
    const post = await ForumPostRepository.findById(postId);
    if (!post) throw new HttpError(404, 'Bai viet khong ton tai');
    if (String(post.authorId) !== String(userId)) {
      throw new HttpError(403, 'Ban khong co quyen chinh sua bai viet nay');
    }

    const update = await this.uploadAttachments(files, post);
    if (payload.title !== undefined) {
      const title = payload.title.trim();
      if (!title) throw new HttpError(400, 'Tieu de khong duoc de trong');
      update.title = title;
    }
    if (payload.content !== undefined) {
      const content = payload.content.trim();
      if (!content) throw new HttpError(400, 'Noi dung khong duoc de trong');
      update.content = content;
    }
    if (payload.itemUrl !== undefined && !firstFile(files, 'image')) update.itemUrl = payload.itemUrl;
    if (payload.status !== undefined) {
      if (!['active', 'resolved', 'closed', 'hidden'].includes(payload.status)) {
        throw new HttpError(400, 'Trang thai bai viet khong hop le');
      }
      update.status = payload.status;
    }
    const majorIds = normalizeIdArray(payload.relatedMajorIds);
    const universityIds = normalizeIdArray(payload.relatedUniversityIds);
    if (majorIds !== undefined) update.relatedMajorIds = majorIds;
    if (universityIds !== undefined) update.relatedUniversityIds = universityIds;

    const updated = await ForumPostRepository.updateById(postId, update);
    return attachPostLookups(updated);
  }

  async delete(postId, userId, { bypassOwner = false } = {}) {
    const post = await ForumPostRepository.findById(postId);
    if (!post) throw new HttpError(404, 'Bai viet khong ton tai');
    if (!bypassOwner && String(post.authorId) !== String(userId)) {
      throw new HttpError(403, 'Ban khong co quyen xoa bai viet nay');
    }

    if (post.itemUrl) {
      await FileRepository.deleteFile('forum-posts', FileRepository.extractPathFromUrl('forum-posts', post.itemUrl));
    }
    if (post.documentUrl) {
      await FileRepository.deleteFile('forum-posts', FileRepository.extractPathFromUrl('forum-posts', post.documentUrl));
    }

    const comments = await ForumCommentRepository.findMany({ postId });
    await Promise.all(comments.map((comment) => {
      const data = toPlain(comment);
      return data.itemUrl
        ? FileRepository.deleteFile('forum-comments', FileRepository.extractPathFromUrl('forum-comments', data.itemUrl))
        : Promise.resolve();
    }));

    await Promise.all([
      ForumPostRepository.deleteById(postId),
      ForumCommentRepository.deleteByPostId(postId),
    ]);
  }

  async toggleUpvote(postId, userId) {
    const post = await ForumPostRepository.findById(postId);
    if (!post) throw new HttpError(404, 'Bai viet khong ton tai');

    const hasUpvoted = hasUserUpvoted(post.upvoters, userId);
    post.upvoters = hasUpvoted
      ? post.upvoters.filter((id) => String(id) !== String(userId))
      : [...post.upvoters, userId];
    post.upvotes = hasUpvoted ? Math.max(0, post.upvotes - 1) : post.upvotes + 1;
    await post.save();

    return { upvotes: post.upvotes, isUpvoted: !hasUpvoted };
  }
}

export default new ForumPostService();
