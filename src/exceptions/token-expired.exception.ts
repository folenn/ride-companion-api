import HttpException from './http.exception';

class TokenExpiredException extends HttpException {
  constructor() {
    super(401, 'Token has expired or not found');
  }
}

export default TokenExpiredException;
