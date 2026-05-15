import ForumPost from '../models/ForumPost.js';

class ForumPostRepository {
  create(data) {
    return ForumPost.create(data);
  }

  findMany(filter = {}, options = {}) {
    const query = ForumPost.find(filter);
    if (options.sort) query.sort(options.sort);
    if (options.skip !== undefined) query.skip(options.skip);
    if (options.limit !== undefined) query.limit(options.limit);
    return query;
  }

  count(filter = {}) {
    return ForumPost.countDocuments(filter);
  }

  findById(id) {
    return ForumPost.findById(id);
  }

  updateById(id, data) {
    return ForumPost.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  }

  deleteById(id) {
    return ForumPost.findByIdAndDelete(id);
  }

  async incrementCommentCount(id, amount) {
    if (amount < 0) {
      const post = await ForumPost.findById(id);
      if (!post) return null;
      post.commentCount = Math.max(0, (post.commentCount || 0) + amount);
      return post.save();
    }

    return ForumPost.findByIdAndUpdate(
      id,
      { $inc: { commentCount: amount } },
      { new: true, runValidators: true },
    );
  }
}

export default new ForumPostRepository();
