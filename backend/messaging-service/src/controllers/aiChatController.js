import aiChatService from '../services/aiChatService.js';

export const getAiConversations = async (req, res, next) => {
  try {
    const data = await aiChatService.listConversations(req.userId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getAiMessages = async (req, res, next) => {
  try {
    const result = await aiChatService.listMessages(req.params.conversationId, req.query, req.userId);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const sendAiMessage = async (req, res, next) => {
  try {
    const abortController = new AbortController();
    req.on('aborted', () => abortController.abort());

    const data = await aiChatService.sendMessage(
      req.body,
      { userId: req.userId, role: req.role },
      req.headers,
      { signal: abortController.signal },
    );
    res.status(201).json({ success: true, message: 'Trợ lý AI đã trả lời', data });
  } catch (error) {
    if (error.status === 499 && !res.headersSent) {
      return res.status(499).json({ success: false, message: error.message });
    }
    next(error);
  }
};

export const deleteAiConversation = async (req, res, next) => {
  try {
    await aiChatService.deleteConversation(req.params.conversationId, req.userId);
    res.status(200).json({ success: true, message: 'Đã xóa cuộc trò chuyện AI' });
  } catch (error) {
    next(error);
  }
};
