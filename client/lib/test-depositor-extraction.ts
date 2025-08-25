// Test utility to verify depositor name extraction
export const extractDepositorFromParticulars = (particulars: string): string => {
  // Improved patterns to correctly extract customer names

  // Extract depositor name with multiple patterns
  if (particulars.includes("MPAY")) {
    // Pattern 1: Skip transaction identifiers like UPITRTR and look for actual names
    // Example: MPAYUPITRTR5222741 19801 NAVEENKUMARSBINXXX30 -> NAVEENKUMAR
    let mpayPattern =
      /MPAY(?:UPITRTR|UPI|TRTR)?\d+\s+\d+\s+([A-Z][A-Z\s]+?)(?:SBIN|PUNB|BARB|JIOPXXX|UCBA|IBKL|XXX)/i;
    let depositorMatch = particulars.match(mpayPattern);

    if (depositorMatch) {
      return depositorMatch[1].trim().replace(/\s+/g, " ");
    } else {
      // Pattern 2: Look for names after any MPAY transaction identifier and numbers
      mpayPattern = /MPAY\w*\d+\s+\d*\s*([A-Z][A-Z\s]{2,20}?)(?:SBIN|PUNB|BARB|JIOPXXX|UCBA|IBKL|XXX|\d|$)/i;
      depositorMatch = particulars.match(mpayPattern);
      if (depositorMatch) {
        return depositorMatch[1].trim().replace(/\s+/g, " ");
      }
      
      // Pattern 3: Fallback - look for names after MPAY but skip common transaction codes
      mpayPattern = /MPAY(?:UPITRTR|UPI|TRTR)?.*?\d+.*?([A-Z][A-Z\s]{3,20}?)(?:[A-Z]{3,4}XXX|\d|$)/i;
      depositorMatch = particulars.match(mpayPattern);
      if (depositorMatch) {
        const name = depositorMatch[1].trim().replace(/\s+/g, " ");
        // Skip transaction identifiers
        if (!name.match(/^(UPITRTR|TRTR|UPI|MPAY)$/i)) {
          return name;
        }
      }
    }
  }

  // Additional patterns for UPI and other transactions
  const patterns = [
    // UPI patterns - improved to skip transaction identifiers
    /UPI(?:TRTR)?\d+\s+\d+\s+([A-Z][A-Z\s]+?)(?:SBIN|PUNB|BARB|JIOPXXX|UCBA|IBKL|XXX)/i,
    /UPI\w*\d+\s+\d*\s*([A-Z][A-Z\s]{3,20}?)(?:SBIN|PUNB|BARB|JIOPXXX|UCBA|IBKL|XXX|\d|$)/i,

    // TRANSFER patterns
    /TRANSFER.*?(?:\d+)([A-Z][A-Z\s]+?)(?:SBIN|PUNB|BARB|JIOPXXX|UCBA|IBKL|XXX)/i,
    /TRANSFER.*?([A-Z][A-Z\s]{2,20}?)(?:[A-Z]{3,4}XXX|\d|$)/i,

    // NEFT patterns
    /NEFT.*?(?:\d+)([A-Z][A-Z\s]+?)(?:SBIN|PUNB|BARB|JIOPXXX|UCBA|IBKL|XXX)/i,
    /NEFT.*?([A-Z][A-Z\s]{2,20}?)(?:[A-Z]{3,4}XXX|\d|$)/i,

    // RTGS patterns
    /RTGS.*?(?:\d+)([A-Z][A-Z\s]+?)(?:SBIN|PUNB|BARB|JIOPXXX|UCBA|IBKL|XXX)/i,
    /RTGS.*?([A-Z][A-Z\s]{2,20}?)(?:[A-Z]{3,4}XXX|\d|$)/i,

    // Generic name pattern (fallback)
    /([A-Z][A-Z\s]{2,20}?)(?:[A-Z]{3,4}XXX|\d|$)/i,
    /([A-Z][A-Z\s]{2,20})/,
  ];

  for (const pattern of patterns) {
    const match = particulars.match(pattern);
    if (match) {
      const name = match[1].trim().replace(/\s+/g, " ");
      // Filter out common non-names and transaction identifiers
      if (
        !name.match(
          /^(UPITRTR|TRTR|MPAY|UPI|TRANSFER|NEFT|RTGS|XXX|SBIN|PUNB|BARB|UCBA|IBKL|JIOPXXX)$/i,
        ) &&
        name.length > 2 &&
        !name.match(/^\d+$/) // Exclude pure numbers
      ) {
        return name;
      }
    }
  }

  return "Unknown Customer";
};

// Test cases
export const testDepositorExtraction = () => {
  const testCases = [
    {
      input: "MPAYUPITRTR5222741 19801 NAVEENKUMARSBINXXX30 522249979249/10-08-25 12:25:30",
      expected: "NAVEENKUMAR",
      description: "MPAY transaction with UPITRTR identifier"
    },
    {
      input: "MPAYUPITRTR123456 5000 HARISH SINGHPUNBXXX25 987654321/15-08-25 14:30:45",
      expected: "HARISH SINGH",
      description: "MPAY transaction with space in customer name"
    },
    {
      input: "UPITRTR987654 2000 RAHUL KUMARUCBAXXX12 456789123/20-08-25 10:15:20",
      expected: "RAHUL KUMAR",
      description: "UPI transaction"
    }
  ];

  console.log("Testing depositor extraction...\n");
  
  testCases.forEach((testCase, index) => {
    const result = extractDepositorFromParticulars(testCase.input);
    const success = result === testCase.expected;
    
    console.log(`Test ${index + 1}: ${testCase.description}`);
    console.log(`Input: ${testCase.input}`);
    console.log(`Expected: ${testCase.expected}`);
    console.log(`Got: ${result}`);
    console.log(`Status: ${success ? '✅ PASS' : '❌ FAIL'}\n`);
  });
};
