// ============================================================
// Standard GST Rate Slabs (India)
// ============================================================

export interface GstSlab {
  name: string;
  rate: number; // Total GST percentage
  cgst: number;
  sgst: number;
  igst: number;
}

export const GST_SLABS: GstSlab[] = [
  { name: 'GST 0% (Exempt)', rate: 0, cgst: 0, sgst: 0, igst: 0 },
  { name: 'GST 5%', rate: 5, cgst: 2.5, sgst: 2.5, igst: 5 },
  { name: 'GST 12%', rate: 12, cgst: 6, sgst: 6, igst: 12 },
  { name: 'GST 18%', rate: 18, cgst: 9, sgst: 9, igst: 18 },
  { name: 'GST 28%', rate: 28, cgst: 14, sgst: 14, igst: 28 },
];

export const GST_REGISTRATION_TYPES = [
  'REGULAR',
  'COMPOSITION',
  'UNREGISTERED',
  'CONSUMER',
] as const;

export type GstRegistrationType = (typeof GST_REGISTRATION_TYPES)[number];
