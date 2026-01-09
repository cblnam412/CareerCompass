import mongoose from "mongoose";
const forumCommentSchema = new mongoose.Schema({
    postId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ForumPost',
        required: true,
    },
    authorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    itemUrl: {
        type: String,
    },
    parentCommentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ForumComment',
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
const ForumComment = mongoose.model('ForumComment', forumCommentSchema);
export default ForumComment;