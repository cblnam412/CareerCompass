import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import User from '../models/User.js';

export const getConversations = async (req, res) => {
    try {
        const userId = req.userId;
        
        const conversations = await Conversation.find({
            $or: [
                { studentId: userId },
                { uniManagerId: userId }
            ],
            isActive: true
        })
        .populate('studentId', 'fullName avatar email')
        .populate('uniManagerId', 'fullName avatar email')
        .populate('universityId', 'name')
        .sort({ updatedAt: -1 });

        res.status(200).json({
            success: true,
            data: conversations
        });
    } catch (error) {
        console.error('Get conversations error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const getMessages = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { page = 1, limit = 50 } = req.query;
        const skip = (page - 1) * limit;

        const messages = await Message.find({ conversationId })
            .populate('senderId', 'fullName avatar')
            .populate('receiverId', 'fullName avatar')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        // Mark messages as read
        await Message.updateMany(
            { conversationId, receiverId: req.userId, isRead: false },
            { isRead: true }
        );

        res.status(200).json({
            success: true,
            data: messages.reverse(),
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const startConversation = async (req, res) => {
    try {
        const { studentId, uniManagerId, universityId } = req.body;

        if (!studentId || !uniManagerId || !universityId) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp studentId, uniManagerId, universityId'
            });
        }

        let conversation = await Conversation.findOne({
            $or: [
                { studentId, uniManagerId },
                { studentId: uniManagerId, uniManagerId: studentId }
            ],
            isActive: true
        });

        if (!conversation) {
            conversation = await Conversation.create({
                studentId,
                uniManagerId,
                universityId
            });
        }

        const populated = await conversation.populate('studentId', 'fullName avatar email')
            .populate('uniManagerId', 'fullName avatar email')
            .populate('universityId', 'name');

        res.status(200).json({
            success: true,
            data: populated
        });
    } catch (error) {
        console.error('Start conversation error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const deleteMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.userId;

        const message = await Message.findById(messageId);

        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Tin nhắn không tồn tại'
            });
        }

        if (message.senderId.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền xóa tin nhắn này'
            });
        }

        await Message.findByIdAndDelete(messageId);

        res.status(200).json({
            success: true,
            message: 'Xóa tin nhắn thành công'
        });
    } catch (error) {
        console.error('Delete message error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const deleteConversation = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.userId;

        const conversation = await Conversation.findById(conversationId);

        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: 'Cuộc trò chuyện không tồn tại'
            });
        }

        if (conversation.studentId.toString() !== userId && conversation.uniManagerId.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền xóa cuộc trò chuyện này'
            });
        }

        await Conversation.findByIdAndUpdate(
            conversationId,
            { isActive: false }
        );

        res.status(200).json({
            success: true,
            message: 'Xóa cuộc trò chuyện thành công'
        });
    } catch (error) {
        console.error('Delete conversation error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const getUnreadCount = async (req, res) => {
    try {
        const userId = req.userId;

        const unreadCount = await Message.countDocuments({
            receiverId: userId,
            isRead: false
        });

        res.status(200).json({
            success: true,
            unreadCount
        });
    } catch (error) {
        console.error('Get unread count error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
