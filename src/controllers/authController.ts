import { Request, Response, NextFunction } from 'express';
import AuthService from '../services/authService';
import { ApiResponse } from '../utils/apiResponse';
import { CreateUserDto, LoginDto } from '../types';

class AuthController {
  /**
   * @desc    Register a new user
   * @route   POST /api/v1/auth/register
   * @access  Public
   */
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

  /**
   * @desc    Login user
   * @route   POST /api/v1/auth/login
   * @access  Public
   */
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