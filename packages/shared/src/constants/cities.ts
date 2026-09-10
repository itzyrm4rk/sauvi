export const CAMEROON_CITIES = [
  'Ngaoundéré',
  'Yaoundé',
  'Bertoua',
  'Douala',
  'Garoua',
  'Bamenda',
  'Bafoussam',
  'Ebolowa',
  'Buea',
  'Maroua',
] as const;

export type CameroonCity = (typeof CAMEROON_CITIES)[number];
