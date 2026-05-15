import Message from '../models/Message.js';

class MessageRepository {
  create(data) {
    return Message.create(data);
  }

  findMany(filter = {}, options = {}) {
    const query = Message.find(filter);
    if (options.sort) query.sort(options.sort);
    if (options.skip !== undefined) query.skip(options.skip);
    if (options.limit !== undefined) query.limit(options.limit);
    return query;
  }

  count(filter = {}) {
    return Message.countDocuments(filter);
  }

  findById(id) {
    return Message.findById(id);
  }

  deleteById(id) {
    return Message.findByIdAndDelete(id);
  }

  markRead(conversationId, receiverId) {
    return Message.updateMany(
      { conversationId, receiverId, isRead: false },
      { isRead: true },
    );
  }

  findLatest(conversationId) {
    return Message.findOne({ conversationId }).sort({ createdAt: -1 });
  }
}

export default new MessageRepository();
