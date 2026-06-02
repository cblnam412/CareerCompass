import mongoose from 'mongoose';
import AiConversation from '../models/AiConversation.js';
import AiMessage from '../models/AiMessage.js';
import { env } from '../config/env.js';
import { HttpError } from '../utils/httpError.js';
import { getPagination } from '../utils/query.js';
import aiContextBuilder from './aiContextBuilder.js';
import aiProviderClient from '../clients/aiProviderClient.js';
import { assessAiScope, buildOutOfScopeReply } from './aiScopeGuard.js';

const readToken = (authHeader = '') => (
  authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
);

const createTitle = (message = '') => {
  const title = message.trim().replace(/\s+/g, ' ');
  return title.length > 60 ? `${title.slice(0, 60)}...` : title || 'Trợ lý AI';
};

class AiChatService {
  assertObjectId(id, name = 'id') {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new HttpError(400, `${name} không hợp lệ`);
  }

  async listConversations(userId) {
    return AiConversation.find({ userId, isActive: true }).sort({ updatedAt: -1 }).lean();
  }

  async getConversation(conversationId, userId) {
    this.assertObjectId(conversationId, 'conversationId');
    const conversation = await AiConversation.findById(conversationId);
    if (!conversation || !conversation.isActive) {
      throw new HttpError(404, 'Cuộc trò chuyện AI không tồn tại');
    }
    if (String(conversation.userId) !== String(userId)) {
      throw new HttpError(403, 'Bạn không có quyền truy cập cuộc trò chuyện AI này');
    }
    return conversation;
  }

  async listMessages(conversationId, query = {}, userId) {
    await this.getConversation(conversationId, userId);
    const { page, limit, skip } = getPagination(query, 50);

    const filter = { conversationId };
    const [messages, total] = await Promise.all([
      AiMessage.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      AiMessage.countDocuments(filter),
    ]);

    return {
      data: [...messages].reverse(),
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  }

  async sendMessage(payload = {}, requester = {}, headers = {}, options = {}) {
    if (!env.aiChatEnabled) throw new HttpError(503, 'Chức năng chat AI đang tắt');

    const message = payload.message?.trim() || payload.content?.trim() || '';
    if (!message) throw new HttpError(400, 'Vui lòng nhập câu hỏi');
    if (message.length > 2000) throw new HttpError(400, 'Câu hỏi quá dài, vui lòng rút gọn dưới 2000 ký tự');

    const token = readToken(headers.authorization || headers.Authorization);
    if (!token) throw new HttpError(401, 'Không tìm thấy token xác thực');

    const userId = requester.userId;
    let conversation = null;

    if (payload.conversationId) {
      conversation = await this.getConversation(payload.conversationId, userId);
    } else {
      conversation = await AiConversation.create({
        userId,
        title: createTitle(message),
        metadata: {
          contextMode: payload.usePersonalContext ? 'personal' : 'public',
        },
      });
    }

    const userMessage = await AiMessage.create({
      conversationId: conversation._id,
      userId,
      role: 'user',
      content: message,
    });

    if (options.signal?.aborted) {
      await AiMessage.deleteOne({ _id: userMessage._id });
      throw new HttpError(499, 'Đã dừng yêu cầu AI');
    }

    const scope = assessAiScope(message);
    if (!scope.allowed) {
      const assistantMessage = await AiMessage.create({
        conversationId: conversation._id,
        userId,
        role: 'assistant',
        content: buildOutOfScopeReply(),
        contextUsed: {
          profile: false,
          scores: false,
          recommendations: false,
          universities: false,
          majors: false,
        },
        safety: {
          blocked: true,
          reason: scope.reason,
        },
      });

      conversation.lastMessage = assistantMessage.content;
      conversation.lastMessageAt = assistantMessage.createdAt;
      conversation.metadata = {
        ...conversation.metadata,
        contextMode: 'none',
        provider: 'local-scope-guard',
        model: 'rule-based',
      };
      await conversation.save();

      return {
        conversationId: conversation._id,
        userMessage,
        assistantMessage,
        contextUsed: assistantMessage.contextUsed,
        provider: 'local-scope-guard',
        model: 'rule-based',
      };
    }
    const { context, contextUsed } = await aiContextBuilder.build({
      userId,
      token,
      message,
      usePersonalContext: Boolean(payload.usePersonalContext),
    });

    const history = await AiMessage.find({
      conversationId: conversation._id,
      _id: { $ne: userMessage._id },
      role: { $in: ['user', 'assistant'] },
    }).sort({ createdAt: -1 }).limit(8).lean();

    let answer;
    try {
      answer = await aiProviderClient.generateAnswer({
        message,
        context,
        history: history.reverse(),
        signal: options.signal,
      });
    } catch (error) {
      if (error.name === 'AbortError' || options.signal?.aborted) {
        await AiMessage.deleteOne({ _id: userMessage._id });
        throw new HttpError(499, 'Đã dừng yêu cầu AI');
      }
      throw error;
    }

    const assistantMessage = await AiMessage.create({
      conversationId: conversation._id,
      userId,
      role: 'assistant',
      content: answer.content,
      contextUsed,
    });

    conversation.lastMessage = answer.content;
    conversation.lastMessageAt = assistantMessage.createdAt;
    conversation.metadata = {
      ...conversation.metadata,
      contextMode: payload.usePersonalContext ? 'personal' : 'public',
      provider: answer.provider,
      model: answer.model,
    };
    await conversation.save();

    return {
      conversationId: conversation._id,
      userMessage,
      assistantMessage,
      contextUsed,
      provider: answer.provider,
      model: answer.model,
    };
  }

  async deleteConversation(conversationId, userId) {
    const conversation = await this.getConversation(conversationId, userId);
    conversation.isActive = false;
    await conversation.save();
  }
}

export default new AiChatService();
