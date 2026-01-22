import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { uploadFileToSupabase, deleteFileFromSupabase } from '../utils/supabaseUtils.js';

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
        .populate('studentId', 'fullName avatar email avatar')
        .populate('uniManagerId', 'fullName avatar email avatar')
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

        const populated = await conversation.populate([
            { path: 'studentId', select: 'fullName avatar email' },
            { path: 'uniManagerId', select: 'fullName avatar email' },
            { path: 'universityId', select: 'name' }
        ]);

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

        // Delete file from Supabase if exists
        if (message.fileUrl) {
            try {
                const urlParts = message.fileUrl.split('/');
                const filePath = `documents/${urlParts[urlParts.length - 1]}`;
                await deleteFileFromSupabase('messages', filePath);
            } catch (deleteError) {
                console.error('Error deleting file from Supabase:', deleteError);
                // Continue anyway - message will be deleted
            }
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

export const searchMessages = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { query, page = 1, limit = 15 } = req.query;
        const userId = req.userId;

        if (!query || !query.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập từ khóa tìm kiếm'
            });
        }

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: 'Cuộc trò chuyện không tồn tại'
            });
        }

        // Check if user is part of the conversation
        if (conversation.studentId.toString() !== userId && conversation.uniManagerId.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền tìm kiếm trong cuộc trò chuyện này'
            });
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Search messages with regex (case-insensitive)
        const searchRegex = new RegExp(query.trim(), 'i');
        
        const messages = await Message.find({
            conversationId,
            content: { $regex: searchRegex },
            messageType: 'text' // Only search text messages
        })
        .populate('senderId', 'fullName avatar')
        .populate('receiverId', 'fullName avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

        const totalCount = await Message.countDocuments({
            conversationId,
            content: { $regex: searchRegex },
            messageType: 'text'
        });

        res.status(200).json({
            success: true,
            data: messages,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: totalCount,
                hasMore: skip + messages.length < totalCount
            }
        });
    } catch (error) {
        console.error('Search messages error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const sendMessageWithDocument = async (req, res) => {
    try {
        const { conversationId, content } = req.body;
        const userId = req.userId;
        const file = req.file;

        if (!conversationId || !userId) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp conversationId'
            });
        }

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
                message: 'Bạn không có quyền gửi tin nhắn trong cuộc trò chuyện này'
            });
        }

        const receiverId = conversation.studentId.toString() === userId ? 
            conversation.uniManagerId : conversation.studentId;

        let fileUrl = null;
        let fileName = null;
        let messageType = 'text';

        if (file) {
            try {
                const uploadResult = await uploadFileToSupabase(
                    file,
                    'messages',
                    'documents'
                );

                if (!uploadResult.success) {
                    return res.status(400).json({
                        success: false,
                        message: uploadResult.error || 'Không thể upload file'
                    });
                }

                fileUrl = uploadResult.url;
                fileName = file.originalname;
                messageType = 'file';
            } catch (uploadError) {
                console.error('Upload error:', uploadError);
                return res.status(400).json({
                    success: false,
                    message: 'Lỗi khi upload file: ' + uploadError.message
                });
            }
        }

        const message = await Message.create({
            conversationId,
            senderId: userId,
            receiverId,
            content: content || `${fileName}`,
            fileUrl,
            messageType
        });

        const populatedMessage = await message.populate([
            { path: 'senderId', select: 'fullName avatar' },
            { path: 'receiverId', select: 'fullName avatar' }
        ]);

        await Conversation.findByIdAndUpdate(
            conversationId,
            { updatedAt: new Date() }
        );

        res.status(201).json({
            success: true,
            data: populatedMessage,
            message: 'Gửi tin nhắn thành công'
        });

    } catch (error) {
        console.error('Send message with document error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
