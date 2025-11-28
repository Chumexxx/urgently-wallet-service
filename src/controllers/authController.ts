import { Request, Response, NextFunction } from 'express';
import AuthService from '../services/authService';
import { ApiResponse } from '../utils/apiResponse';
import { CreateUserDto, LoginDto } from '../types';

class AuthController {
  /*Controller for user registeration. This controller makes use of the register service in the auth service file*/
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const userData: CreateUserDto = req.body;
      const result = await AuthService.register(userData);

      res.status(201).json(
        ApiResponse.created(result, 'Account created successfully')
      );
    } catch (error) {
      next(error);
    }
  }

  /*Controller for user login. This controller makes use of the login service in the auth service file*/
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const loginData: LoginDto = req.body;
      const result = await AuthService.login(loginData);

      res.status(200).json(
        ApiResponse.success(result, 'Login successful')
      );
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();