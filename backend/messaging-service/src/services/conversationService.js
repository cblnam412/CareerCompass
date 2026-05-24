import mongoose from 'mongoose';
import { getUserById } from '../clients/authServiceClient.js';
import { getUniversityById } from '../clients/universityServiceClient.js';
import { ConversationRepository } from '../repositories/index.js';
import { HttpError } from '../utils/httpError.js';
import { attachConversationLookups } from './lookupService.js';

const isParticipant = (conversation, userId) =>
  [conversation?.studentId, conversation?.uniManagerId].some((id) => String(id) === String(userId));

class ConversationService {
  assertObjectId(id, name = 'id') {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new HttpError(400, `${name} không hợp lệ`);
  }

  async getUserConversations(userId) {
    const conversations = await ConversationRepository.findMany(
      {
        $or: [{ studentId: userId }, { uniManagerId: userId }],
        isActive: true,
      },
      { sort: { updatedAt: -1 } },
    );

    return attachConversationLookups(conversations);
  }

  async startConversation(payload = {}, requester = {}) {
    const { studentId, uniManagerId, universityId } = payload;

    if (!studentId || !uniManagerId || !universityId) {
      throw new HttpError(400, 'Vui lòng cung cấp studentId, uniManagerId, universityId');
    }

    if (![studentId, uniManagerId].some((id) => String(id) === String(requester.userId)) && requester.role !== 'admin') {
      throw new HttpError(403, 'Bạn không có quyền tạo cuộc trò chuyện này');
    }

    await Promise.all([
      getUserById(studentId),
      getUserById(uniManagerId),
      getUniversityById(universityId),
    ]);

    const existing = await ConversationRepository.findOne({
      $or: [
        { studentId, uniManagerId, universityId },
        { studentId: uniManagerId, uniManagerId: studentId, universityId },
      ],
    });

    if (existing) {
      const conversation = existing.isActive
        ? existing
        : await ConversationRepository.updateById(existing._id, { isActive: true });
      return attachConversationLookups(conversation);
    }

    const conversation = await ConversationRepository.create({
      studentId,
      uniManagerId,
      universityId,
      isActive: true,
    });

    return attachConversationLookups(conversation);
  }

  async getParticipantConversation(conversationId, userId) {
    this.assertObjectId(conversationId, 'conversationId');
    const conversation = await ConversationRepository.findById(conversationId);
    if (!conversation || !conversation.isActive) {
      throw new HttpError(404, 'Cuộc trò chuyện không tồn tại');
    }
    if (!isParticipant(conversation, userId)) {
      throw new HttpError(403, 'Bạn không có quyền truy cập cuộc trò chuyện này');
    }
    return conversation;
  }

  getReceiverId(conversation, senderId) {
    if (String(conversation.studentId) === String(senderId)) return conversation.uniManagerId;
    if (String(conversation.uniManagerId) === String(senderId)) return conversation.studentId;
    throw new HttpError(403, 'Bạn không phải thành viên của cuộc trò chuyện này');
  }

  async updateLastMessage(conversationId, message = null) {
    const update = message
      ? {
          lastMessage: message.content || message.fileName || '',
          lastMessageType: message.messageType,
          lastMessageAt: message.createdAt || new Date(),
          updatedAt: new Date(),
        }
      : {
          lastMessage: '',
          lastMessageType: 'text',
          lastMessageAt: null,
          updatedAt: new Date(),
        };

    return ConversationRepository.updateById(conversationId, update);
  }

  async deleteConversation(conversationId, userId) {
    const conversation = await this.getParticipantConversation(conversationId, userId);
    await ConversationRepository.updateById(conversation._id, { isActive: false });
  }
}

export default new ConversationService();
