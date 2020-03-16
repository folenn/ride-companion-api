import HttpException from './http.exception';

export class DriverNotFoundException extends HttpException {
  constructor() {
    super(404, `Can't find driver profile for current user`);
  }
}

