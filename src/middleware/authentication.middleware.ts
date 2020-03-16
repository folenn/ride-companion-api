import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { IUser } from '../modules/user/user.interface';
import { UserModel } from '../modules/user/user.model';
import UserNotFoundException from '../exceptions/user-not-found.exception';
import TokenExpiredException from '../exceptions/token-expired.exception';
import { UnauthorizedException } from '../exceptions/unauthorized.exception';
import { SessionModel } from '../modules/session/session.model';

export interface JwtDecodedUser {
  user: IUser['_id'];
}

declare global {
  namespace Express {
    interface Request {
      user?: IUser
      token: string;
    }
  }
}

export async function authenticationMiddleware(request: Request, response: Response, next: NextFunction) {
  try {
    const token = (request.headers.authorization || '').split(' ')[1];
    const { user: userId } = jwt.verify(token, process.env.JWT_SECRET || '') as JwtDecodedUser;
    if (!userId) next(new UserNotFoundException());

    const [foundUser, foundToken] = await Promise.all([
      await UserModel.findOne({_id: userId}),
      await SessionModel.findOne({accessToken: token, user: userId})
    ]);
    if (!foundUser) next(new UserNotFoundException());
    if (!foundToken) next(new UnauthorizedException());
    request.user = foundUser;
    request.token = token;
    next();
  } catch (e) {
    if (e && (e.name === 'TokenExpiredError')) next(new TokenExpiredException());
    next(new UnauthorizedException())
  }
}
