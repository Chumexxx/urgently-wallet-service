import { CreateUserDto, LoginDto} from '../types';
import UserModel from '../models/userModel';
import WalletModel from '../models/walletModel';
import KarmaService from './karmaService';
import { ApiError } from '../utils/apiError';
import db from '../config/database';
import TokenService from '../utils/generateWebToken';
import logger from '../utils/logger';

class AuthService {
  private jwtSecret: string;
  private jwtExpiresIn: string;

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '30m';
  }

  async register(userData: CreateUserDto) {
    const [emailExists, phoneExists] = await Promise.all([
        UserModel.existsByEmail(userData.email),
        UserModel.existsByPhone(userData.phone),
    ]);

    if (emailExists || phoneExists) {
      throw ApiError.conflict('User with this email or phone already exists');
    }

    //this is where we start to check karma blacklist
    console.log('Checking Karma blacklist for new user...');
    logger.info('Initiating Karma blacklist check for new user');

    try {
        const karmaCheck = await KarmaService.isAnyIdentityBlacklisted({
            email: userData.email,
            phone: userData.phone,
        });

        if (karmaCheck.isBlacklisted) {
            logger.warn('Karma blacklist check failed for new user');
            console.log('User is blacklisted:', karmaCheck.reasons);
            
            throw ApiError.forbidden(
            'You cannot be onboarded due to blacklist records. ' +
            'Please contact support if you believe this is an error.'
          );
        }

        logger.info('Karma blacklist check passed for new user');
        console.log('User passed Karma blacklist check');
        } catch (error) {
        if (error instanceof ApiError) {
          throw error;
        }

        console.error('Karma API check failed:', error);
          throw ApiError.serverError(
          'Unable to verify your information at this time. Please try again later.'
      );
    }

    const hashedPassword = await UserModel.hashPassword(userData.password);

    // transaction to ensure both user and wallet are created atomically. We can't have a user without a wallet or vice versa.
    return await db.transaction(async (trx) => {
        try {
        const user = await UserModel.create({ ...userData, password: hashedPassword, is_blacklisted: false }, trx);

        const wallet = await WalletModel.create(
            { user_id: user.id, balance: 0, currency: 'NGN' },
            trx
        );

        const token = TokenService.generateToken({
            userId: user.id,
            email: user.email,
        });

        console.log('User registration successful:', user.email);
        logger.info({ userId: user.id, email: user.email }, 'User registered successfully');

        return {
            user: {
            id: user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            phone: user.phone,
            wallet_id: wallet.id,
            balance: wallet.balance,
            },
            token,
        };
        } catch (error) {
          console.error('User registration failed:', error);
          logger.error({ err: error }, 'User registration failed');
          throw error;
        }
    } );
  }

  async login(loginData: LoginDto) {
    const user = await UserModel.findByEmail(loginData.email);

    if (!user) {
      throw ApiError.unauthorized('Invalid credentials');
    }

    // Also chacking if user is blackisted during login. Just to be super safe
    if (user.is_blacklisted) {
      logger.warn({ userId: user.id, email: user.email }, 'Blacklisted user attempted login');
      console.log('Blacklisted user attempted login:', user.email);
      throw ApiError.forbidden(
        'Your account has been restricted. Please contact support.'
      );
    }

    const isPasswordValid = await UserModel.verifyPassword(loginData.password, user.password
    );

    if (!isPasswordValid) {
      throw ApiError.unauthorized('Invalid credentials');
    }

    const token = TokenService.generateToken({
      userId: user.id,
      email: user.email,
    });

    try {
      const karmaCheck = await KarmaService.isAnyIdentityBlacklisted({
        email: user.email,
        phone: user.phone,
      });

      if (karmaCheck.isBlacklisted) {
        // Update user's blacklist status in database
        await UserModel.updateBlacklistStatus(user.id, true);
        
        throw ApiError.forbidden(
          'Your account has been restricted. Please contact support.'
        );
      }
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error({ err: error, userId: user.id }, 'Karma check on login failed');
      console.error('Karma check on login failed:', error);
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
      },
      token,
    };
  }
}

export default new AuthService();