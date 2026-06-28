// ============================================================
// Indian States & Union Territories with GST State Codes
// ============================================================

export interface IndianState {
  code: string; // 2-digit state code (GSTIN prefix)
  name: string;
  type: 'STATE' | 'UT'; // State or Union Territory
}

export const INDIAN_STATES: IndianState[] = [
  { code: '01', name: 'Jammu & Kashmir', type: 'UT' },
  { code: '02', name: 'Himachal Pradesh', type: 'STATE' },
  { code: '03', name: 'Punjab', type: 'STATE' },
  { code: '04', name: 'Chandigarh', type: 'UT' },
  { code: '05', name: 'Uttarakhand', type: 'STATE' },
  { code: '06', name: 'Haryana', type: 'STATE' },
  { code: '07', name: 'Delhi', type: 'UT' },
  { code: '08', name: 'Rajasthan', type: 'STATE' },
  { code: '09', name: 'Uttar Pradesh', type: 'STATE' },
  { code: '10', name: 'Bihar', type: 'STATE' },
  { code: '11', name: 'Sikkim', type: 'STATE' },
  { code: '12', name: 'Arunachal Pradesh', type: 'STATE' },
  { code: '13', name: 'Nagaland', type: 'STATE' },
  { code: '14', name: 'Manipur', type: 'STATE' },
  { code: '15', name: 'Mizoram', type: 'STATE' },
  { code: '16', name: 'Tripura', type: 'STATE' },
  { code: '17', name: 'Meghalaya', type: 'STATE' },
  { code: '18', name: 'Assam', type: 'STATE' },
  { code: '19', name: 'West Bengal', type: 'STATE' },
  { code: '20', name: 'Jharkhand', type: 'STATE' },
  { code: '21', name: 'Odisha', type: 'STATE' },
  { code: '22', name: 'Chhattisgarh', type: 'STATE' },
  { code: '23', name: 'Madhya Pradesh', type: 'STATE' },
  { code: '24', name: 'Gujarat', type: 'STATE' },
  { code: '25', name: 'Daman & Diu', type: 'UT' },
  { code: '26', name: 'Dadra & Nagar Haveli and Daman & Diu', type: 'UT' },
  { code: '27', name: 'Maharashtra', type: 'STATE' },
  { code: '29', name: 'Karnataka', type: 'STATE' },
  { code: '30', name: 'Goa', type: 'STATE' },
  { code: '31', name: 'Lakshadweep', type: 'UT' },
  { code: '32', name: 'Kerala', type: 'STATE' },
  { code: '33', name: 'Tamil Nadu', type: 'STATE' },
  { code: '34', name: 'Puducherry', type: 'UT' },
  { code: '35', name: 'Andaman & Nicobar Islands', type: 'UT' },
  { code: '36', name: 'Telangana', type: 'STATE' },
  { code: '37', name: 'Andhra Pradesh', type: 'STATE' },
  { code: '38', name: 'Ladakh', type: 'UT' },
];

/**
 * Get state name from 2-digit state code.
 * Used for GST place-of-supply determination.
 */
export function getStateByCode(code: string): IndianState | undefined {
  return INDIAN_STATES.find((s) => s.code === code);
}

/**
 * Extract state code from a 15-character GSTIN.
 * First 2 characters of GSTIN = state code.
 */
export function getStateCodeFromGstin(gstin: string): string {
  return gstin.substring(0, 2);
}
