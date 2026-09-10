export function formatBloodType(raw: string): string {
  const map: Record<string, string> = {
    O_NEG: 'O-',
    O_POS: 'O+',
    A_NEG: 'A-',
    A_POS: 'A+',
    B_NEG: 'B-',
    B_POS: 'B+',
    AB_NEG: 'AB-',
    AB_POS: 'AB+',
  };
  return map[raw] ?? raw;
}
