import ForumComment from '../models/ForumComment.js';

class ForumCommentRepository {
  create(data) {
    return ForumComment.create(data);
  }

  findMany(filter = {}, options = {}) {
    const query = ForumComment.find(filter);
    if (options.populateParent) query.populate('parentCommentId', 'content authorId');
    if (options.sort) query.sort(options.sort);
    if (options.skip !== undefined) query.skip(options.skip);
    if (options.limit !== undefined) query.limit(options.limit);
    return query;
  }

  count(filter = {}) {
    return ForumComment.countDocuments(filter);
  }

  findById(id) {
    return ForumComment.findById(id);
  }

  updateById(id, data) {
    return ForumComment.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  }

  deleteById(id) {
    return ForumComment.findByIdAndDelete(id);
  }

  async deleteWithReplies(commentId) {
    const replies = await ForumComment.find({ parentCommentId: commentId }).select('_id itemUrl');
    const deleted = await ForumComment.deleteMany({
      $or: [{ _id: commentId }, { parentCommentId: commentId }],
    });
    return { deletedCount: deleted.deletedCount || 0, replies };
  }

  deleteByPostId(postId) {
    return ForumComment.deleteMany({ postId });
  }
}

export default new ForumCommentRepository();
