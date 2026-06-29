// ============================================================
// Localized Number to Words Converter (Indian Numbering Strategy)
// ============================================================

const ONES = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
  'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
];

const TENS = [
  '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
];

/**
 * Helper to convert numbers less than 1000 into words
 */
function convertBelowThousand(num: number): string {
  if (num === 0) return '';
  
  let result = '';
  
  if (num >= 100) {
    result += ONES[Math.floor(num / 100)] + ' Hundred ';
    num %= 100;
  }
  
  if (num > 0) {
    if (num < 20) {
      result += ONES[num];
    } else {
      const ten = Math.floor(num / 10);
      const one = num % 10;
      result += TENS[ten] + (one > 0 ? '-' + ONES[one] : '');
    }
  }
  
  return result.trim();
}

/**
 * Converts any numeric value to Indian Rupees and Paise representation.
 * Follows Lakhs and Crores placement scaling.
 * 
 * Example: 152300.50 -> "Rupees One Lakh Fifty-Two Thousand Three Hundred and Paise Fifty Only"
 */
export function numberToIndianRupeesWords(amount: number): string {
  if (isNaN(amount) || amount === null) {
    return 'Zero Rupees Only';
  }

  // Round amount to 2 decimal places
  const roundedAmount = Math.round(amount * 100) / 100;
  const rupeePart = Math.floor(roundedAmount);
  const paisePart = Math.round((roundedAmount - rupeePart) * 100);

  if (rupeePart === 0 && paisePart === 0) {
    return 'Zero Rupees Only';
  }

  let rupeeStr = '';
  let remaining = rupeePart;

  // 1. Crores (1,00,00,000)
  if (remaining >= 10000000) {
    const crores = Math.floor(remaining / 10000000);
    rupeeStr += convertBelowThousand(crores) + ' Crore ';
    remaining %= 10000000;
  }

  // 2. Lakhs (1,00,000)
  if (remaining >= 100000) {
    const lakhs = Math.floor(remaining / 100000);
    rupeeStr += convertBelowThousand(lakhs) + ' Lakh ';
    remaining %= 100000;
  }

  // 3. Thousands (1,000)
  if (remaining >= 1000) {
    const thousands = Math.floor(remaining / 1000);
    rupeeStr += convertBelowThousand(thousands) + ' Thousand ';
    remaining %= 1000;
  }

  // 4. Hundreds / Tens / Ones
  if (remaining > 0) {
    rupeeStr += convertBelowThousand(remaining);
  }

  rupeeStr = rupeeStr.trim();
  let finalResult = rupeePart > 0 ? `Rupees ${rupeeStr}` : '';

  if (paisePart > 0) {
    const paiseStr = convertBelowThousand(paisePart);
    if (rupeePart > 0) {
      finalResult += ` and Paise ${paiseStr}`;
    } else {
      finalResult += `Paise ${paiseStr}`;
    }
  }

  return `${finalResult.trim()} Only`;
}
