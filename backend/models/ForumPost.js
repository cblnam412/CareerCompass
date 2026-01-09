import mongoose from "mongoose";
const forumPostSchema = new mongoose.Schema({
    authorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    itemUrl: {
        type: String,
    },
    documentUrl: {
        type: String,
    },
    relatedMajorIds: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'Major',
    },
    relatedUniversityIds: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'University',
    }, 
    commentCount: {
        type: Number,
        default: 0,
    },
    status: {
        type: String,
        enum: ['active', 'resolved', 'closed'],
        default: 'active',
    },
    upvotes: {
        type: Number,
        default: 0,
    },
    upvoters: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'User',
        default: [],
    }
}, {
    timestamps: true
});
const ForumPost = mongoose.model('ForumPost', forumPostSchema);
export default ForumPost;