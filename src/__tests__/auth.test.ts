import {
  isValidPhone,
  isValidPassword,
  maskPhone,
  PHONE_REGEX,
  PASSWORD_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
} from '@/types/auth';

describe('Auth Types', () => {
  describe('Phone Validation', () => {
    test('valid Chinese phone numbers should pass', () => {
      expect(isValidPhone('13800138000')).toBe(true);
      expect(isValidPhone('15912345678')).toBe(true);
      expect(isValidPhone('18688888888')).toBe(true);
      expect(isValidPhone('19999999999')).toBe(true);
    });

    test('invalid phone numbers should fail', () => {
      // Wrong length
      expect(isValidPhone('1380013800')).toBe(false);  // Too short
      expect(isValidPhone('138001380001')).toBe(false); // Too long

      // Wrong prefix
      expect(isValidPhone('12800138000')).toBe(false);
      expect(isValidPhone('10800138000')).toBe(false);

      // Non-numeric
      expect(isValidPhone('1380013800a')).toBe(false);
      expect(isValidPhone('abcdefghijk')).toBe(false);

      // Empty or null-like
      expect(isValidPhone('')).toBe(false);
      expect(isValidPhone('   ')).toBe(false);
    });

    test('PHONE_REGEX should match Chinese mobile numbers', () => {
      expect(PHONE_REGEX.test('13800138000')).toBe(true);
      expect(PHONE_REGEX.test('12800138000')).toBe(false);
    });
  });

  describe('Password Validation', () => {
    test('valid passwords should pass', () => {
      expect(isValidPassword('123456')).toBe(true);  // Min length
      expect(isValidPassword('12345678901234567890')).toBe(true);  // Max length
      expect(isValidPassword('password')).toBe(true);
      expect(isValidPassword('Pass123!')).toBe(true);
    });

    test('invalid passwords should fail', () => {
      // Too short
      expect(isValidPassword('12345')).toBe(false);
      expect(isValidPassword('')).toBe(false);

      // Too long
      expect(isValidPassword('123456789012345678901')).toBe(false);
    });

    test('password length constants should be correct', () => {
      expect(PASSWORD_MIN_LENGTH).toBe(6);
      expect(PASSWORD_MAX_LENGTH).toBe(20);
    });
  });

  describe('Phone Masking', () => {
    test('should mask middle digits of phone number', () => {
      expect(maskPhone('13800138000')).toBe('138****8000');
      expect(maskPhone('15912345678')).toBe('159****5678');
    });

    test('should return original for invalid length', () => {
      expect(maskPhone('1380013800')).toBe('1380013800');  // Too short
      expect(maskPhone('138001380001')).toBe('138001380001');  // Too long
      expect(maskPhone('')).toBe('');
    });

    test('should handle null/undefined gracefully', () => {
      // TypeScript would prevent this, but testing runtime behavior
      expect(maskPhone(null as unknown as string)).toBe(null);
      expect(maskPhone(undefined as unknown as string)).toBe(undefined);
    });
  });
});
