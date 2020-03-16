import HttpException from './http.exception';

export class WrongFileFormatException extends HttpException {
  constructor() {
    super(400, `You should upload only images with extensions *.png, *.jpg, *.jpeg`);
  }
}

