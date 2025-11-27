import axios from 'axios';
import KarmaService from '../../services/karmaService';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('KarmaService Unit Tests', () => {
  const validEmail = 'badactor@fraud.com';
  const validPhone = '08012345678';
  const formattedPhone = '+2348012345678';

  beforeAll(() => {
    process.env.KARMA_API_KEY = 'test-key';
    process.env.KARMA_API_URL = 'https://adjutor.lendsqr.com/v2';
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isAnyIdentityBlacklisted', () => {
    it('should return NOT blacklisted when both identities are clean', async () => {
      mockedAxios.get
        .mockResolvedValueOnce({ data: { status: 'failed' }, status: 404 }) // email
        .mockResolvedValueOnce({ data: { status: 'failed' }, status: 404 }); // phone

      const result = await KarmaService.isAnyIdentityBlacklisted({
        email: validEmail,
        phone: validPhone,
      });

      expect(result.isBlacklisted).toBe(false);
      expect(result.reasons).toEqual([]);
    });

    it('should return BLACKLISTED if email is in Karma', async () => {
      mockedAxios.get
        .mockResolvedValueOnce({
          // Email is blacklisted
          data: {
            status: 'success',
            data: { reason: 'Loan default' },
          },
          status: 200,
        })
        .mockResolvedValueOnce({
          // Phone is clean
          data: { status: 'failed' },
          status: 404,
        });

      const result = await KarmaService.isAnyIdentityBlacklisted({
        email: validEmail,
        phone: validPhone,
      });

      expect(result.isBlacklisted).toBe(true);
      expect(result.reasons).toContain(`${validEmail}: Loan default`);
      expect(result.reasons).not.toContain(expect.stringContaining('+234'));
    });

    it('should return BLACKLISTED if phone is in Karma', async () => {
      mockedAxios.get
        .mockResolvedValueOnce({ data: { status: 'failed' }, status: 404 }) // email clean
        .mockResolvedValueOnce({
          // Phone blacklisted
          data: {
            status: 'success',
            data: { reason: 'Fraudulent activity' },
          },
          status: 200,
        });

      const result = await KarmaService.isAnyIdentityBlacklisted({
        email: validEmail,
        phone: validPhone,
      });

      expect(result.isBlacklisted).toBe(true);
      expect(result.reasons).toContain(`${formattedPhone}: Fraudulent activity`);
    });

    it('should return BLACKLISTED with multiple reasons if both are bad', async () => {
      mockedAxios.get
        .mockResolvedValueOnce({
          data: { status: 'success', data: { reason: 'Fraud' } },
          status: 200,
        })
        .mockResolvedValueOnce({
          data: { status: 'success', data: { reason: 'Scam' } },
          status: 200,
        });

      const result = await KarmaService.isAnyIdentityBlacklisted({
        email: validEmail,
        phone: validPhone,
      });

      expect(result.isBlacklisted).toBe(true);
      expect(result.reasons).toEqual([
        `${validEmail}: Fraud`,
        `${formattedPhone}: Scam`,
      ]);
    });
  });

  describe('Error Handling Scenarios', () => {
    it('should NOT block on 401/403 → fail-safe', async () => {
      mockedAxios.get.mockRejectedValueOnce({
        isAxiosError: true,
        response: { status: 401 },
      });
      mockedAxios.get.mockResolvedValueOnce({ data: { status: 'failed' }, status: 404 });

      const result = await KarmaService.isAnyIdentityBlacklisted({
        email: validEmail,
        phone: validPhone,
      });

      expect(result.isBlacklisted).toBe(false);
    });

    it('should NOT block on 429 rate limit → fail-safe', async () => {
      mockedAxios.get.mockRejectedValueOnce({
        isAxiosError: true,
        response: { status: 429 },
      });
      mockedAxios.get.mockResolvedValueOnce({ data: { status: 'failed' }, status: 404 });

      const result = await KarmaService.isAnyIdentityBlacklisted({
        email: validEmail,
        phone: validPhone,
      });

      expect(result.isBlacklisted).toBe(false);
    });

    it('should NOT block on network timeout → fail-safe', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Network timeout'));
      mockedAxios.get.mockResolvedValueOnce({ data: { status: 'failed' }, status: 404 });

      const result = await KarmaService.isAnyIdentityBlacklisted({
        email: validEmail,
        phone: validPhone,
      });

      expect(result.isBlacklisted).toBe(false);
    });
  });

  describe('Phone Number Formatting', () => {
    it('should format Nigerian phone numbers to +234...', async () => {
        const formatSpy = jest.spyOn(KarmaService as any, 'formatPhoneNumber');

        const phones = ['08012345678', '8012345678', '+2348012345678', '2348012345678'];

        for (const phone of phones) {
        formatSpy.mockReturnValueOnce('+2348012345678');

        await KarmaService.isAnyIdentityBlacklisted({
            email: 'test@example.com',
            phone,
        });

        expect(formatSpy).toHaveBeenCalledWith(phone);
        }

        expect(formatSpy).toHaveReturnedWith('+2348012345678');
        formatSpy.mockRestore();
    });
    });

  describe('checkBlacklist method', () => {
    it('should return is_blacklisted: true with reason', async () => {
      mockedAxios.get.mockResolvedValue({
        data: {
          status: 'success',
          data: { reason: 'Loan defaulter' },
        },
        status: 200,
      });

      const result = await (KarmaService as any).checkBlacklist('bad@fraud.com', 'email');

      expect(result.is_blacklisted).toBe(true);
      expect(result.reason).toBe('Loan defaulter');
    });

    it('should return is_blacklisted: false on 404', async () => {
      mockedAxios.get.mockRejectedValue({
        isAxiosError: true,
        response: { status: 404 },
      });

      const result = await (KarmaService as any).checkBlacklist('good@example.com', 'email');

      expect(result.is_blacklisted).toBe(false);
    });
  });
});