import HttpException from './http.exception';

export class MessagesLimitExceededException extends HttpException {
  constructor() {
    super(400, `Messages limit exceeded, try again in few minutes`);
  }
}

