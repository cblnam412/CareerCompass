import mongoose from 'mongoose';
import { ConversationRepository, FileRepository, MessageRepository } from '../repositories/index.js';
import { HttpError } from '../utils/httpError.js';
import { escapeRegex, getPagination } from '../utils/query.js';
import conversationService from './conversationService.js';
import { attachUsers } from './lookupService.js';

class MessageService {
  assertObjectId(id, name = 'id') {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new HttpError(400, `${name} khong hop le`);
  }

  async listMessages(conversationId, query = {}, userId) {
    const conversation = await conversationService.getParticipantConversation(conversationId, userId);
    const { page, limit, skip } = getPagination(query, 50);
    const filter = { conversationId: conversation._id };

    const [messages, total] = await Promise.all([
      MessageRepository.findMany(filter, { sort: { createdAt: -1 }, skip, limit }),
      MessageRepository.count(filter),
      MessageRepository.markRead(conversation._id, userId),
    ]);

    const data = await attachUsers([...messages].reverse(), ['senderId', 'receiverId']);

    return {
      data,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  }

  async searchMessages(conversationId, query = {}, userId) {
    const conversation = await conversationService.getParticipantConversation(conversationId, userId);
    const searchQuery = query.query?.trim() || query.q?.trim();
    if (!searchQuery) throw new HttpError(400, 'Vui long nhap tu khoa tim kiem');

    const { page, limit, skip } = getPagination(query, 15);
    const regex = { $regex: escapeRegex(searchQuery), $options: 'i' };
    const filter = {
      conversationId: conversation._id,
      content: regex,
      messageType: 'text',
    };

    const [messages, total] = await Promise.all([
      MessageRepository.findMany(filter, { sort: { createdAt: -1 }, skip, limit }),
      MessageRepository.count(filter),
    ]);

    const data = await attachUsers(messages, ['senderId', 'receiverId']);

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
        hasMore: skip + messages.length < total,
      },
    };
  }

  async uploadDocument(file) {
    if (!file) return {};

    const result = await FileRepository.uploadFile(file, 'messages', 'documents');
    if (!result.success) throw new HttpError(400, `Loi upload tai lieu: ${result.error}`);

    return {
      fileUrl: result.url,
      fileName: file.originalname || 'document',
    };
  }

  async sendWithDocument(payload = {}, file = null, senderId) {
    const { conversationId } = payload;
    const content = payload.content?.trim() || '';
    if (!conversationId) throw new HttpError(400, 'Vui long cung cap conversationId');
    if (!content && !file) throw new HttpError(400, 'Vui long nhap noi dung hoac chon file');

    const conversation = await conversationService.getParticipantConversation(conversationId, senderId);
    const receiverId = conversationService.getReceiverId(conversation, senderId);
    const attachment = await this.uploadDocument(file);

    const message = await MessageRepository.create({
      conversationId: conversation._id,
      senderId,
      receiverId,
      content: content || attachment.fileName || '',
      fileUrl: attachment.fileUrl || '',
      fileName: attachment.fileName || '',
      messageType: attachment.fileUrl ? 'file' : 'text',
    });

    await conversationService.updateLastMessage(conversation._id, message);
    return attachUsers(message, ['senderId', 'receiverId']);
  }

  async deleteMessage(messageId, userId) {
    this.assertObjectId(messageId, 'messageId');
    const message = await MessageRepository.findById(messageId);
    if (!message) throw new HttpError(404, 'Tin nhan khong ton tai');
    if (String(message.senderId) !== String(userId)) {
      throw new HttpError(403, 'Ban khong co quyen xoa tin nhan nay');
    }

    const conversation = await ConversationRepository.findById(message.conversationId);
    if (conversation && ![conversation.studentId, conversation.uniManagerId].some((id) => String(id) === String(userId))) {
      throw new HttpError(403, 'Ban khong co quyen xoa tin nhan nay');
    }

    if (message.fileUrl) {
      await FileRepository.deleteFile(
        'messages',
        FileRepository.extractPathFromUrl('messages', message.fileUrl),
      );
    }

    await MessageRepository.deleteById(messageId);

    if (conversation && String(conversation.lastMessageAt?.getTime?.()) === String(message.createdAt?.getTime?.())) {
      const latest = await MessageRepository.findLatest(conversation._id);
      await conversationService.updateLastMessage(conversation._id, latest);
    }
  }

  async getUnreadCount(userId) {
    const activeConversations = await ConversationRepository.findMany({
      $or: [{ studentId: userId }, { uniManagerId: userId }],
      isActive: true,
    });
    const conversationIds = activeConversations.map((conversation) => conversation._id);

    if (conversationIds.length === 0) return { unreadCount: 0 };

    const unreadCount = await MessageRepository.count({
      conversationId: { $in: conversationIds },
      receiverId: userId,
      isRead: false,
    });

    return { unreadCount };
  }
}

export default new MessageService();
