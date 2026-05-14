import User from '../models/User.js';

class UserRepository {
  findById(id) {
    return User.findById(id);
  }

  updateById(id, data) {
    return User.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  }
}

export default new UserRepository();
