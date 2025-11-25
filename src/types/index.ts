export interface IUser {
  id: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone: string;
  is_blacklisted: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface IWallet {
  id: string;
  user_id: string;
  balance: number;
  currency: string;
  created_at: Date;
  updated_at: Date;
}

export interface ITransaction {
  id: string;
  wallet_id: string;
  type: 'credit' | 'debit';
  category: 'funding' | 'transfer' | 'withdrawal';
  amount: number;
  balance_before: number;
  balance_after: number;
  reference: string;
  description?: string;
  recipient_wallet_id?: string;
  status: 'pending' | 'success' | 'failed';
  metadata?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserDto {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface FundWalletDto {
  amount: number;
}

export interface TransferDto {
  recipient_email: string;
  amount: number;
  description?: string;
}

export interface WithdrawDto {
  amount: number;
  description?: string;
}

export interface JwtPayload {
  userId: string;
  email: string;
}

export interface KarmaCheckResponse {
  status: string;
  message: string;
  data?: {
    karma_identity: string;
    reports?: any[];
  };
}