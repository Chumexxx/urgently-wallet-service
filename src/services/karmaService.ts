import axios, { AxiosError } from 'axios';
import { KarmaCheckResponse, KarmaCheckResult } from '../types/index.js';

class KarmaService {
  private apiUrl: string;
  private apiKey: string;

  constructor() {
    this.apiUrl = process.env.KARMA_API_URL || 'https://adjutor.lendsqr.com/v2';
    this.apiKey = process.env.KARMA_API_KEY || '';
  }

  /**
   * Format phone number to Karma API format (+234...)
   */
  private formatPhoneNumber(phone: string): string {
    // Remove all non-numeric characters
    let cleaned = phone.replace(/\D/g, '');
    
    // If it starts with 0, replace with 234
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

  /**
   * Check a single identity against Karma blacklist
   */
  async checkBlacklist(identity: string, identityType: 'email' | 'phone'): Promise<KarmaCheckResult> {
    try {
      // Format phone number if needed
      const formattedIdentity = identityType === 'phone' 
        ? this.formatPhoneNumber(identity) 
        : identity;

      console.log(`Checking Karma for ${identityType}: ${formattedIdentity}`);

      const response = await axios.get<KarmaCheckResponse>(
        `${this.apiUrl}/verification/karma/${encodeURIComponent(formattedIdentity)}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          timeout: 10000, // 10 seconds timeout
        }
      );

      // If we get a successful response, the identity is on the blacklist
      if (response.data.status === 'success' && response.data.data) {
        console.log(`⚠️  ${formattedIdentity} found in Karma blacklist`);
        
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

        // 404 means identity is NOT in the blacklist (this is good)
        if (axiosError.response?.status === 404) {
          console.log(`✅ ${identity} not found in Karma blacklist`);
          return {
            identity,
            is_blacklisted: false,
          };
        }

        // 401/403 means authentication issues
        if (axiosError.response?.status === 401 || axiosError.response?.status === 403) {
          console.error('❌ Karma API authentication failed. Check your API key.');
          console.error('Response:', axiosError.response?.data);
          
          // In production, you might want to fail-safe here
          // For now, we'll throw an error to prevent registration
          throw new Error('Unable to verify identity. Please contact support.');
        }

        // 429 means rate limit exceeded
        if (axiosError.response?.status === 429) {
          console.error('❌ Karma API rate limit exceeded');
          throw new Error('Service temporarily unavailable. Please try again later.');
        }

        // Other errors - log but don't block registration
        console.error(`Karma API error for ${identity}:`, axiosError.message);
        console.error('Status:', axiosError.response?.status);
        console.error('Response:', axiosError.response?.data);
        
        // IMPORTANT: Decide your fail-safe strategy
        // Option 1: Fail-safe (allow registration if API fails) - CURRENT
        // Option 2: Fail-secure (block registration if API fails)
        
        // For this implementation, we'll fail-safe to allow registration
        return {
          identity,
          is_blacklisted: false,
          error: 'Could not verify at this time',
        };
      }

      // Non-Axios errors (network issues, etc.)
      console.error(`Unexpected error checking Karma for ${identity}:`, error);
      
      // Fail-safe: allow registration
      return {
        identity,
        is_blacklisted: false,
        error: 'Verification service unavailable',
      };
    }
  }

  /**
   * Check multiple identities against Karma blacklist
   * Returns array of results for each identity
   */
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
      throw error;
    }
  }

  /**
   * Check if any of the provided identities is blacklisted
   * Returns true if ANY identity is blacklisted
   */
  async isAnyIdentityBlacklisted(identities: {
    email: string;
    phone: string;
  }): Promise<{ isBlacklisted: boolean; reasons: string[] }> {
    const results = await this.checkMultipleIdentities(identities);
    
    const blacklistedResults = results.filter(result => result.is_blacklisted);
    const reasons = blacklistedResults
      .map(result => `${result.identity}: ${result.reason}`)
      .filter(Boolean);

    return {
      isBlacklisted: blacklistedResults.length > 0,
      reasons,
    };
  }
}

export default new KarmaService();