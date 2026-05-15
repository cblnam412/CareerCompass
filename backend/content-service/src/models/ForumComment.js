import mongoose from 'mongoose';

const forumCommentSchema = new mongoose.Schema(
  {
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ForumPost',
      required: true,
      index: true,
    },
    authorId: { type: String, required: true, index: true },
    content: { type: String, required: true, trim: true },
    itemUrl: { type: String, default: '' },
    parentCommentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ForumComment',
      default: null,
      index: true,
    },
    upvoters: [{ type: String }],
    upvotes: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

export default mongoose.model('ForumComment', forumCommentSchema);
