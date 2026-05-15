import mongoose from 'mongoose';

const forumPostSchema = new mongoose.Schema(
  {
    authorId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true, trim: true },
    itemUrl: { type: String, default: '' },
    documentUrl: { type: String, default: '' },
    relatedMajorIds: [{ type: String }],
    relatedUniversityIds: [{ type: String }],
    status: {
      type: String,
      enum: ['active', 'resolved', 'closed', 'hidden'],
      default: 'active',
      index: true,
    },
    upvoters: [{ type: String }],
    upvotes: { type: Number, default: 0, min: 0 },
    commentCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

forumPostSchema.index({ title: 'text', content: 'text' });

export default mongoose.model('ForumPost', forumPostSchema);
