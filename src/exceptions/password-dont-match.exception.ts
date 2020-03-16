import HttpException from './http.exception';

class PasswordDontMatchException extends HttpException {
  constructor() {
    super(400, `Password is wrong`);
  }
}

export default PasswordDontMatchException;
