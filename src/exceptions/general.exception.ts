import HttpException from './http.exception';

class GeneralException extends HttpException {
  constructor() {
    super(400, `Error`);
  }
}

export default GeneralException;
