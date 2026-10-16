export interface CommunityItem {
  id: string;
  name: string;
  lga: string;
  isActive: boolean;
  createdAt?: string;
}

export const DEFAULT_COMMUNITIES: CommunityItem[] = [
  { id: 'com-1', name: 'Omoku', lga: 'Ogba/Egbema/Ndoni', isActive: true },
  { id: 'com-2', name: 'Egi', lga: 'Ogba/Egbema/Ndoni', isActive: true },
  { id: 'com-3', name: 'Obrikom', lga: 'Ogba/Egbema/Ndoni', isActive: true },
  { id: 'com-4', name: 'Erema', lga: 'Ogba/Egbema/Ndoni', isActive: true },
  { id: 'com-5', name: 'Ahoada', lga: 'Ahoada East', isActive: true },
  { id: 'com-6', name: 'Kreigani', lga: 'Ogba/Egbema/Ndoni', isActive: true },
  { id: 'com-7', name: 'Obite', lga: 'Ogba/Egbema/Ndoni', isActive: true },
  { id: 'com-8', name: 'Akabuka', lga: 'Ogba/Egbema/Ndoni', isActive: true },
  { id: 'com-9', name: 'Obagi', lga: 'Ogba/Egbema/Ndoni', isActive: true },
];
