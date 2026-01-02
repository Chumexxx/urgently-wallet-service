import axios, { AxiosError } from 'axios';
import { KarmaCheckResponse, KarmaCheckResult } from '../types/index.js';
import logger from '../utils/logger';

class KarmaService {
  private apiUrl: string;
  private apiKey: string;

  constructor() {
    this.apiUrl = process.env.KARMA_API_URL || 'https://adjutor.lendsqr.com/v2';
    this.apiKey = process.env.KARMA_API_KEY || '';
  }

  // we're formatting phone numbers to match what the api takes. 
  private formatPhoneNumber(phone: string): string {
    let cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.startsWith('0')) {
      cleaned = '234' + cleaned.substring(1);
    }
    
    // If it doesn't start with 234, add it
    if (!cleaned.startsWith('234')) {
      cleaned = '234' + cleaned;
    }
    
    // Add the + prefix
    return '+' + cleaned;
  }

  async checkBlacklist(identity: string, identityType: 'email' | 'phone'): Promise<KarmaCheckResult> {
    try {
      const formattedIdentity = identityType === 'phone' 
        ? this.formatPhoneNumber(identity) 
        : identity;

      console.log(`Checking Karma for ${identityType}: ${formattedIdentity}`);
      logger.info(`Checking Karma for ${identityType}: ${formattedIdentity}`);

      const response = await axios.get<KarmaCheckResponse>(
        `${this.apiUrl}/verification/karma/${encodeURIComponent(formattedIdentity)}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          timeout: 10000, 
        }
      );

      // If we get a successful response, the identity is on the blacklist
      if (response.data.status === 'success' && response.data.data) {
        console.log(`${formattedIdentity} found in Karma blacklist`);
        logger.warn(`${formattedIdentity} found in Karma blacklist`);
        
        return {
          identity: formattedIdentity,
          is_blacklisted: true,
          reason: response.data.data.reason || 
                  response.data.data.karma_type?.karma || 
                  'Found in blacklist',
        };
      }

      // If status is not success, treat as not blacklisted
      return {
        identity: formattedIdentity,
        is_blacklisted: false,
      };

    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;

        // user's identity not found in blacklist
        if (axiosError.response?.status === 404) {
          console.log(`${identity} not found in Karma blacklist`);
          logger.info(`${identity} not found in Karma blacklist`);
          return {
            identity,
            is_blacklisted: false,
          };
        }

        if (axiosError.response?.status === 401 || axiosError.response?.status === 403) {
          console.error('Karma API authentication failed. Check your API key.');
          logger.error('Karma API authentication failed. Check your API key.');

          console.error('Response:', axiosError.response?.data);
          logger.error({ status: axiosError.response?.status, data: axiosError.response?.data }, 'Karma API authentication error');
          
          throw new Error('Unable to verify identity. Please contact support.');
        }

        if (axiosError.response?.status === 429) {
          console.error('Karma API rate limit exceeded');
          logger.error('Karma API rate limit exceeded');
          throw new Error('Service temporarily unavailable. Please try again later.');
        }
        console.error(`Karma API error for ${identity}:`, axiosError.message);
        logger.error({ err: axiosError, identity }, 'Karma API error');

        console.error('Status:', axiosError.response?.status);
        logger.error({ status: axiosError.response?.status, data: axiosError.response?.data }, `Karma API error response for ${identity}`);

        console.error('Response:', axiosError.response?.data);
        
        return {
          identity,
          is_blacklisted: false,
          error: 'Could not verify at this time',
        };
      }

      // Non-Axios errors (network issues, etc.)
      console.error(`Unexpected error checking Karma for ${identity}:`, error);
      logger.error({ err: error, identity }, `Unexpected error checking Karma for ${identity}`);
      
      return {
        identity,
        is_blacklisted: false,
        error: 'Verification service unavailable',
      };
    }
  }

  async checkMultipleIdentities(identities: {
    email: string;
    phone: string;
  }): Promise<KarmaCheckResult[]> {
    try {
      // Check both email and phone
      const [emailResult, phoneResult] = await Promise.all([
        this.checkBlacklist(identities.email, 'email'),
        this.checkBlacklist(identities.phone, 'phone'),
      ]);

      return [emailResult, phoneResult];
    } catch (error) {
      console.error('Error checking multiple identities:', error);
      logger.error({ err: error }, 'Error checking multiple identities');
      throw error;
    }
  }

  async isAnyIdentityBlacklisted(identities: {
    email: string;
    phone: string;
  }): Promise<{ isBlacklisted: boolean; reasons: string[] }> {
    let results: KarmaCheckResult[];

    try {
      results = await this.checkMultipleIdentities(identities);
    } catch (error) {
      console.error('Karma service unavailable or failed critically:', error);
      logger.error({ err: error }, 'Karma service unavailable or failed critically');
      throw new Error(
        'Identity verification service is currently unavailable. Please try again later.'
      );
    }

    const blacklistedResults = results.filter(r => r.is_blacklisted);
    const reasons = blacklistedResults
      .map(r => `${r.identity}: ${r.reason || 'Blacklisted'}`)
      .filter(Boolean);

    if (blacklistedResults.length > 0) {
      return { isBlacklisted: true, reasons };
    }

    return { isBlacklisted: false, reasons: [] };
  }
}

export default new KarmaService();