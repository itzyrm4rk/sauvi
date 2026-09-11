import { EligibilityService } from './eligibility.service';

describe('EligibilityService', () => {
  let service: EligibilityService;

  beforeEach(() => {
    const mockPrisma = {} as unknown as import('../prisma/prisma.service').PrismaService;
    service = new EligibilityService(mockPrisma);
  });

  describe('calculateNextEligibleDate', () => {
    it('should return null when lastDonationDate is null (never donated)', () => {
      const result = service.calculateNextEligibleDate('masculin', null);
      expect(result).toBeNull();
    });

    it('should add 56 days for masculin gender', () => {
      const lastDonation = new Date('2025-01-01');
      const result = service.calculateNextEligibleDate('masculin', lastDonation);

      const expected = new Date('2025-01-01');
      expected.setDate(expected.getDate() + 56);

      expect(result).toEqual(expected);
    });

    it('should add 84 days for feminin gender', () => {
      const lastDonation = new Date('2025-01-01');
      const result = service.calculateNextEligibleDate('feminin', lastDonation);

      const expected = new Date('2025-01-01');
      expected.setDate(expected.getDate() + 84);

      expect(result).toEqual(expected);
    });

    it('should not mutate the original lastDonationDate', () => {
      const lastDonation = new Date('2025-06-15');
      const originalTime = lastDonation.getTime();

      service.calculateNextEligibleDate('masculin', lastDonation);

      expect(lastDonation.getTime()).toBe(originalTime);
    });
  });

  describe('isCurrentlyEligible', () => {
    it('should return true when nextEligibleDate is null (never donated)', () => {
      const result = service.isCurrentlyEligible(null);
      expect(result).toBe(true);
    });

    it('should return true when nextEligibleDate is in the past', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 10);

      const result = service.isCurrentlyEligible(pastDate);
      expect(result).toBe(true);
    });

    it('should return true when nextEligibleDate is today', () => {
      const today = new Date();
      const result = service.isCurrentlyEligible(today);
      expect(result).toBe(true);
    });

    it('should return false when nextEligibleDate is tomorrow', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const result = service.isCurrentlyEligible(tomorrow);
      expect(result).toBe(false);
    });

    it('should return false when nextEligibleDate is far in the future', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 60);

      const result = service.isCurrentlyEligible(futureDate);
      expect(result).toBe(false);
    });
  });

  describe('getDaysRemaining', () => {
    it('should return 0 when nextEligibleDate is null', () => {
      expect(service.getDaysRemaining(null)).toBe(0);
    });

    it('should return 0 when nextEligibleDate is today', () => {
      const today = new Date();
      expect(service.getDaysRemaining(today)).toBe(0);
    });

    it('should return 0 when nextEligibleDate is in the past', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5);
      expect(service.getDaysRemaining(pastDate)).toBe(0);
    });

    it('should return correct days when nextEligibleDate is in the future', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);
      expect(service.getDaysRemaining(futureDate)).toBe(10);
    });
  });

  describe('full scenario: masculin donor donated 30 days ago', () => {
    it('should be ineligible with 26 days remaining', () => {
      const lastDonation = new Date();
      lastDonation.setDate(lastDonation.getDate() - 30);

      const nextDate = service.calculateNextEligibleDate('masculin', lastDonation);
      expect(nextDate).not.toBeNull();
      expect(service.isCurrentlyEligible(nextDate)).toBe(false);
      expect(service.getDaysRemaining(nextDate)).toBe(26);
    });
  });

  describe('full scenario: masculin donor donated 60 days ago', () => {
    it('should be eligible with 0 days remaining', () => {
      const lastDonation = new Date();
      lastDonation.setDate(lastDonation.getDate() - 60);

      const nextDate = service.calculateNextEligibleDate('masculin', lastDonation);
      expect(nextDate).not.toBeNull();
      expect(service.isCurrentlyEligible(nextDate)).toBe(true);
      expect(service.getDaysRemaining(nextDate)).toBe(0);
    });
  });

  describe('full scenario: feminin donor donated 60 days ago', () => {
    it('should be ineligible with 24 days remaining', () => {
      const lastDonation = new Date();
      lastDonation.setDate(lastDonation.getDate() - 60);

      const nextDate = service.calculateNextEligibleDate('feminin', lastDonation);
      expect(nextDate).not.toBeNull();
      expect(service.isCurrentlyEligible(nextDate)).toBe(false);
      expect(service.getDaysRemaining(nextDate)).toBe(24);
    });
  });

  describe('full scenario: feminin donor donated 90 days ago', () => {
    it('should be eligible with 0 days remaining', () => {
      const lastDonation = new Date();
      lastDonation.setDate(lastDonation.getDate() - 90);

      const nextDate = service.calculateNextEligibleDate('feminin', lastDonation);
      expect(nextDate).not.toBeNull();
      expect(service.isCurrentlyEligible(nextDate)).toBe(true);
      expect(service.getDaysRemaining(nextDate)).toBe(0);
    });
  });
});
