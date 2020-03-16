import HttpException from './http.exception';

export class UserAlreadyVerifiedException extends HttpException {
  constructor() {
    super(400, `User already verified`);
  }
}
