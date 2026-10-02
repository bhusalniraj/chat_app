import crypto from 'crypto';

export class OTPService {
  static generateOTP() {
    return crypto.randomInt(100000, 999999).toString();
  }

  static getLockDuration(lockCount) {
    const durations = [1, 5, 10, 30, 60, 120, 240]; // minutes
    const index = Math.min(lockCount, durations.length - 1);
    return durations[index] * 60 * 1000; // Convert to milliseconds
  }

  static isOTPExpired(otpExpiry) {
    return new Date() > new Date(otpExpiry);
  }

  static isAccountLocked(lockUntil) {
    if (!lockUntil) return false;
    if (new Date() > new Date(lockUntil)) {
      return false; // Lock expired
    }
    return true; // Still locked
  }

  static getRemainingLockTime(lockUntil) {
    if (!lockUntil) return 0;
    const remaining = new Date(lockUntil) - new Date();
    return Math.max(0, remaining);
  }
}