import HttpException from './http.exception';
import { __ } from 'i18n';

class UserNotFoundException extends HttpException {
  constructor(email?: string) {
    super(404, email ? __('AUTH.USER_WITH_SUCH_EMAIL_NOT_FOUND:User with email %s was not found', email) : __('USER.USER_NOT_FOUND:User not found'));
  }
}

export default UserNotFoundException;
