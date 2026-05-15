import conversationService from '../services/conversationService.js';

export const getConversations = async (req, res, next) => {
  try {
    const data = await conversationService.getUserConversations(req.userId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const startConversation = async (req, res, next) => {
  try {
    const data = await conversationService.startConversation(req.body, {
      userId: req.userId,
      role: req.role,
    });
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const deleteConversation = async (req, res, next) => {
  try {
    await conversationService.deleteConversation(req.params.conversationId, req.userId);
    res.status(200).json({ success: true, message: 'Xoa cuoc tro chuyen thanh cong' });
  } catch (error) {
    next(error);
  }
};
