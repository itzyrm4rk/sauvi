import type { BloodType } from '@sauvi/shared';
import { BLOOD_COMPATIBILITY, BloodCompatibilityService } from './blood-compatibility.service';

describe('BloodCompatibilityService', () => {
  let service: BloodCompatibilityService;

  const expectedCompatibility: Record<BloodType, BloodType[]> = {
    'AB+': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
    'AB-': ['O-', 'B-', 'A-', 'AB-'],
    'A+': ['O-', 'O+', 'A-', 'A+'],
    'A-': ['O-', 'A-'],
    'B+': ['O-', 'O+', 'B-', 'B+'],
    'B-': ['O-', 'B-'],
    'O+': ['O-', 'O+'],
    'O-': ['O-'],
  };

  beforeEach(() => {
    service = new BloodCompatibilityService();
  });

  it.each(Object.entries(expectedCompatibility) as [BloodType, BloodType[]][])(
    'should return compatible donors for %s',
    (bloodTypeNeeded: BloodType, compatibleTypes: BloodType[]) => {
      expect(service.getCompatibleTypes(bloodTypeNeeded)).toEqual(compatibleTypes);
    },
  );

  it('should expose the complete compatibility map', () => {
    expect(BLOOD_COMPATIBILITY).toEqual(expectedCompatibility);
    expect(Object.keys(BLOOD_COMPATIBILITY)).toHaveLength(8);
  });

  it('should return a copy to protect the compatibility map', () => {
    const result = service.getCompatibleTypes('O-');

    result.push('AB+');

    expect(service.getCompatibleTypes('O-')).toEqual(['O-']);
  });
});
