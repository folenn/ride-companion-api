import HttpException from './http.exception';

class LoginFailedException extends HttpException {
  constructor() {
    super(400, 'Login failed');
  }
}

export default LoginFailedException;
