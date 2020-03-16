import HttpException from './http.exception';

export class NoFileProvidedException extends HttpException {
  constructor() {
    super(400, `Please, provide file with *.png, *.jpg, *.jpeg extensions`);
  }
}

