import { CreateUserDto, LoginDto} from '../types';
import UserModel from '../models/userModel';
import WalletModel from '../models/walletModel';
import KarmaService from './karmaService';
import { ApiError } from '../utils/apiError';
import db from '../config/database';
import TokenService from '../utils/generateWebToken';

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

    console.log('🔍 Checking Karma blacklist for new user...');

    try {
        const karmaCheck = await KarmaService.isAnyIdentityBlacklisted({
            email: userData.email,
            phone: userData.phone,
        });

        if (karmaCheck.isBlacklisted) {
            console.log('🚫 User is blacklisted:', karmaCheck.reasons);
            
            throw ApiError.forbidden(
            'You cannot be onboarded due to blacklist records. ' +
            'Please contact support if you believe this is an error.'
          );
        }

        console.log('✅ User passed Karma blacklist check');
        } catch (error) {
        // If it's already an ApiError (like our forbidden error), re-throw it
        if (error instanceof ApiError) {
            throw error;
        }

        // For other errors (API failures), log and decide strategy
        console.error('⚠️  Karma API check failed:', error);
        // Current: Fail-secure - block registration if we can't verify
      throw ApiError.serverError(
        'Unable to verify your information at this time. Please try again later.'
      );
    }

    // 3. Hash password
    const hashedPassword = await UserModel.hashPassword(userData.password);

    // 3. Fix: Everything that touches DB must be inside the transaction!
    return await db.transaction(async (trx) => {
        try {
        // Create user inside transaction
        const user = await UserModel.create({ ...userData, password: hashedPassword, is_blacklisted: false }, trx);

        // Create wallet inside same transaction
        const wallet = await WalletModel.create(
            { user_id: user.id, balance: 0, currency: 'NGN' },
            trx
        );

        // Generate token (safe outside trx — no DB write)
        const token = TokenService.generateToken({
            userId: user.id,
            email: user.email,
        });

        // Commit happens automatically at end of async function
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
        // Rollback happens automatically on throw
        console.error('❌ User registration failed:', error);
        throw error;
        }
    });
  }

  async login(loginData: LoginDto) {
    const user = await UserModel.findByEmail(loginData.email);

    if (!user) {
      throw ApiError.unauthorized('Invalid credentials');
    }

    // Check if user is blacklisted
    if (user.is_blacklisted) {
      console.log('🚫 Blacklisted user attempted login:', user.email);
      throw ApiError.forbidden(
        'Your account has been restricted. Please contact support.'
      );
    }

    // Verify password
    const isPasswordValid = await UserModel.verifyPassword(
      loginData.password,
      user.password
    );

    if (!isPasswordValid) {
      throw ApiError.unauthorized('Invalid credentials');
    }

    // Generate token
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
      // Log but don't block login if Karma API fails
      console.error('⚠️  Karma check on login failed:', error);
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