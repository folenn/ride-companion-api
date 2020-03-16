import HttpException from './http.exception';

class UserWithThatPhonelAlreadyExistsException extends HttpException {
  constructor(phone: string) {
    super(400, `User with phone ${phone} already exists`);
  }
}

export default UserWithThatPhonelAlreadyExistsException;
