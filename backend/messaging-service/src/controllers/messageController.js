import messageService from '../services/messageService.js';

export const getMessages = async (req, res, next) => {
  try {
    const result = await messageService.listMessages(req.params.conversationId, req.query, req.userId);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const searchMessages = async (req, res, next) => {
  try {
    const result = await messageService.searchMessages(req.params.conversationId, req.query, req.userId);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const sendMessageWithDocument = async (req, res, next) => {
  try {
    const data = await messageService.sendWithDocument(req.body, req.file, req.userId);
    res.status(201).json({ success: true, message: 'Gửi tin nhắn thành công', data });
  } catch (error) {
    next(error);
  }
};

export const deleteMessage = async (req, res, next) => {
  try {
    await messageService.deleteMessage(req.params.messageId, req.userId);
    res.status(200).json({ success: true, message: 'Xóa tin nhắn thành công' });
  } catch (error) {
    next(error);
  }
};

export const getUnreadCount = async (req, res, next) => {
  try {
    const data = await messageService.getUnreadCount(req.userId);
    res.status(200).json({ success: true, ...data });
  } catch (error) {
    next(error);
  }
};
