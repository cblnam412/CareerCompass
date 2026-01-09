import Message from './models/Message.js';
import Conversation from './models/Conversation.js';

const activeUsers = new Map(); // userId -> socketId

export const initializeSocket = (io) => {
    io.on('connection', (socket) => {
        console.log('User connected:', socket.id);

        socket.on('user_online', (userId) => {
            activeUsers.set(userId, socket.id);
            socket.broadcast.emit('user_status', { userId, status: 'online' });
            console.log(`User ${userId} online. Active users:`, activeUsers.size);
        });

        socket.on('join_conversation', (conversationId) => {
            socket.join(`conversation_${conversationId}`);
            console.log(`Socket ${socket.id} joined conversation ${conversationId}`);
        });

        socket.on('leave_conversation', (conversationId) => {
            socket.leave(`conversation_${conversationId}`);
            console.log(`Socket ${socket.id} left conversation ${conversationId}`);
        });

        socket.on('send_message', async (data) => {
            try {
                const { conversationId, senderId, receiverId, content, fileUrl, messageType = 'text' } = data;

                const message = await Message.create({
                    conversationId,
                    senderId,
                    receiverId,
                    content,
                    fileUrl,
                    messageType,
                    isRead: false
                });

                await Conversation.findByIdAndUpdate(
                    conversationId,
                    {
                        lastMessage: content,
                        lastMessageTime: new Date(),
                        updatedAt: new Date()
                    }
                );

                const populatedMessage = await message.populate('senderId', 'fullName avatar email');

                io.to(`conversation_${conversationId}`).emit('receive_message', {
                    ...populatedMessage.toObject()
                });

                socket.emit('message_sent', { messageId: message._id, conversationId });

                console.log(`Message sent in conversation ${conversationId}`);
            } catch (error) {
                console.error('Error sending message:', error);
                socket.emit('error', { message: error.message });
            }
        });

        socket.on('typing', (data) => {
            const { conversationId, userId, fullName } = data;
            io.to(`conversation_${conversationId}`).emit('user_typing', { userId, fullName });
        });

        socket.on('stop_typing', (data) => {
            const { conversationId, userId } = data;
            io.to(`conversation_${conversationId}`).emit('user_stop_typing', { userId });
        });

        socket.on('disconnect', () => {
            for (let [userId, socketId] of activeUsers.entries()) {
                if (socketId === socket.id) {
                    activeUsers.delete(userId);
                    socket.broadcast.emit('user_status', { userId, status: 'offline' });
                    console.log(`User ${userId} offline. Active users:`, activeUsers.size);
                    break;
                }
            }
            console.log('User disconnected:', socket.id);
        });

        socket.on('error', (error) => {
            console.error('Socket error:', error);
        });
    });
};

export { activeUsers };
