export type DeliveryArea = string;

export const DELIVERY_FEES_BY_AREA: Record<string, number> = {
  Omoku: 1000,
  Obrikom: 1200,
  Egi: 1500,
};

export const FREE_DELIVERY_THRESHOLD = 50000;

export function calculateDeliveryFee(subtotal: number, area: string = 'Omoku'): number {
  if (subtotal <= 0 || subtotal >= FREE_DELIVERY_THRESHOLD) {
    return 0;
  }
  return DELIVERY_FEES_BY_AREA[area] ?? 1500;
}
