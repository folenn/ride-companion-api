import HttpException from './http.exception';

export class UnauthorizedException extends HttpException {
  constructor() {
    super(401, 'You are not authorized to perform this action');
  }
}
