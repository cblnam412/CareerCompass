import { HttpError } from '../utils/httpError.js';

export const ATTEMPT_STATUS = {
  IN_PROGRESS: 'inProgress',
  SUBMITTED: 'submitted',
  EXPIRED: 'expired',
};

class BaseAttemptState {
  constructor(attempt) {
    this.attempt = attempt;
  }

  assertCanSave() {
    throw new HttpError(409, 'Attempt cannot be saved in this state');
  }

  assertCanSubmit() {
    throw new HttpError(409, 'Attempt cannot be submitted in this state');
  }
}

class InProgressAttemptState extends BaseAttemptState {
  assertCanSave(now = new Date()) {
    if (this.attempt.expiresAt && now > this.attempt.expiresAt) {
      throw new HttpError(409, 'Attempt has expired');
    }
  }

  assertCanSubmit(now = new Date(), graceMs = 30000) {
    const latestSubmitAt = this.attempt.expiresAt
      ? new Date(this.attempt.expiresAt.getTime() + graceMs)
      : null;

    if (latestSubmitAt && now > latestSubmitAt) {
      throw new HttpError(409, 'Attempt has expired');
    }
  }
}

class SubmittedAttemptState extends BaseAttemptState {
  assertCanSave() {
    throw new HttpError(409, 'Attempt has already been submitted');
  }

  assertCanSubmit() {
    throw new HttpError(409, 'Attempt has already been submitted');
  }
}

class ExpiredAttemptState extends BaseAttemptState {
  assertCanSave() {
    throw new HttpError(409, 'Attempt has expired');
  }

  assertCanSubmit() {
    throw new HttpError(409, 'Attempt has expired');
  }
}

export const getMockExamAttemptState = (attempt) => {
  switch (attempt.status) {
    case ATTEMPT_STATUS.SUBMITTED:
      return new SubmittedAttemptState(attempt);
    case ATTEMPT_STATUS.EXPIRED:
      return new ExpiredAttemptState(attempt);
    case ATTEMPT_STATUS.IN_PROGRESS:
    default:
      return new InProgressAttemptState(attempt);
  }
};
