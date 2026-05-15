import Conversation from '../models/Conversation.js';

class ConversationRepository {
  create(data) {
    return Conversation.create(data);
  }

  findMany(filter = {}, options = {}) {
    const query = Conversation.find(filter);
    if (options.sort) query.sort(options.sort);
    if (options.skip !== undefined) query.skip(options.skip);
    if (options.limit !== undefined) query.limit(options.limit);
    return query;
  }

  findById(id) {
    return Conversation.findById(id);
  }

  findOne(filter = {}) {
    return Conversation.findOne(filter);
  }

  updateById(id, data) {
    return Conversation.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  }
}

export default new ConversationRepository();
