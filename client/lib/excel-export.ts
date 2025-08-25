// Excel export utility functions

interface Transaction {
  id: number;
  date: string;
  particulars: string;
  depositor: string;
  withdrawals: number;
  deposits: number;
  balance: number;
  type: string;
}

export function exportToExcel(transactions: Transaction[], filename: string = 'transactions') {
  // Create Excel-compatible content with proper headers
  const headers = [
    'Date',
    'Customer Name',
    'Transaction Details',
    'Transaction Type',
    'Deposits',
    'Withdrawals',
    'Balance',
    'Month',
    'Year'
  ];

  // Sort transactions by date
  const sortedTransactions = [...transactions].sort((a, b) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Calculate total deposits for summary
  const totalDeposits = sortedTransactions.reduce((sum, t) => sum + t.deposits, 0);

  const rows = sortedTransactions.map(transaction => {
    const date = new Date(transaction.date);
    const formattedDate = date.toLocaleDateString('en-IN');
    const month = date.toLocaleDateString('en-US', { month: 'long' });
    const year = date.getFullYear();

    return [
      formattedDate,
      transaction.depositor,
      transaction.particulars,
      transaction.type,
      transaction.deposits > 0 ? transaction.deposits.toFixed(2) : '',
      transaction.withdrawals > 0 ? transaction.withdrawals.toFixed(2) : '',
      transaction.balance.toFixed(2),
      month,
      year.toString()
    ];
  });

  // Add summary row
  const summaryRow = [
    '',
    'TOTAL',
    '',
    '',
    totalDeposits.toFixed(2),
    sortedTransactions.reduce((sum, t) => sum + t.withdrawals, 0).toFixed(2),
    '',
    '',
    ''
  ];

  // Combine headers, rows, and summary
  const content = [headers, ...rows, summaryRow]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');

  // Create and download file with Excel MIME type
  const blob = new Blob([content], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8;'
  });
  const link = document.createElement('a');

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export function exportMonthlySummaryToExcel(transactions: Transaction[], filename: string = 'monthly_summary') {
  // Group transactions by month
  const monthlyMap = new Map<string, {
    month: string;
    year: number;
    totalDeposits: number;
    totalWithdrawals: number;
    netFlow: number;
    transactionCount: number;
    uniqueDepositors: string[];
  }>();

  transactions.forEach(transaction => {
    const date = new Date(transaction.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthName = date.toLocaleDateString('en-US', { month: 'long' });

    if (!monthlyMap.has(monthKey)) {
      monthlyMap.set(monthKey, {
        month: monthName,
        year: date.getFullYear(),
        totalDeposits: 0,
        totalWithdrawals: 0,
        netFlow: 0,
        transactionCount: 0,
        uniqueDepositors: []
      });
    }

    const monthData = monthlyMap.get(monthKey)!;
    monthData.totalDeposits += transaction.deposits;
    monthData.totalWithdrawals += transaction.withdrawals;
    monthData.transactionCount += 1;

    if (transaction.deposits > 0 && !monthData.uniqueDepositors.includes(transaction.depositor)) {
      monthData.uniqueDepositors.push(transaction.depositor);
    }
  });

  // Calculate net flow
  monthlyMap.forEach(monthData => {
    monthData.netFlow = monthData.totalDeposits - monthData.totalWithdrawals;
  });

  const headers = [
    'Month',
    'Year',
    'Total Deposits',
    'Total Withdrawals',
    'Net Cash Flow',
    'Transaction Count',
    'Unique Depositors',
    'Average Deposit'
  ];

  const rows = Array.from(monthlyMap.values())
    .sort((a, b) => `${a.year}-${a.month}`.localeCompare(`${b.year}-${b.month}`))
    .map(monthData => {
      const avgDeposit = monthData.uniqueDepositors.length > 0
        ? monthData.totalDeposits / monthData.uniqueDepositors.length
        : 0;

      return [
        monthData.month,
        monthData.year.toString(),
        monthData.totalDeposits.toFixed(2),
        monthData.totalWithdrawals.toFixed(2),
        monthData.netFlow.toFixed(2),
        monthData.transactionCount.toString(),
        monthData.uniqueDepositors.length.toString(),
        avgDeposit.toFixed(2)
      ];
    });

  const content = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');

  const blob = new Blob([content], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8;'
  });
  const link = document.createElement('a');

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export function exportFinalTabToExcel(transactions: Transaction[], filename: string = 'final_deposits') {
  // Only include deposit transactions
  const depositTransactions = transactions.filter(t => t.deposits > 0);

  const headers = [
    'Date',
    'Deposited Customer',
    'Deposit Amount',
    'Transaction Type',
    'Original Particulars'
  ];

  // Sort transactions by date (newest first)
  const sortedTransactions = [...depositTransactions].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const rows = sortedTransactions.map(transaction => {
    const date = new Date(transaction.date);
    const formattedDate = date.toLocaleDateString('en-IN');

    return [
      formattedDate,
      transaction.depositor,
      transaction.deposits.toFixed(2),
      transaction.type,
      transaction.particulars
    ];
  });

  // Add summary row
  const totalDeposits = depositTransactions.reduce((sum, t) => sum + t.deposits, 0);
  const summaryRow = [
    '',
    'TOTAL DEPOSITS',
    totalDeposits.toFixed(2),
    '',
    ''
  ];

  // Combine headers, rows, and summary
  const content = [headers, ...rows, summaryRow]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');

  // Create and download file with Excel MIME type
  const blob = new Blob([content], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8;'
  });
  const link = document.createElement('a');

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export function exportCustomerSummaryToExcel(transactions: Transaction[], filename: string = 'customer_summary') {
  // Group by customer
  const customerMap = new Map<string, {
    name: string;
    totalDeposits: number;
    transactionCount: number;
    firstDeposit: string;
    lastDeposit: string;
    avgDeposit: number;
  }>();

  transactions.forEach(transaction => {
    if (transaction.deposits > 0) {
      if (!customerMap.has(transaction.depositor)) {
        customerMap.set(transaction.depositor, {
          name: transaction.depositor,
          totalDeposits: 0,
          transactionCount: 0,
          firstDeposit: transaction.date,
          lastDeposit: transaction.date,
          avgDeposit: 0
        });
      }

      const customerData = customerMap.get(transaction.depositor)!;
      customerData.totalDeposits += transaction.deposits;
      customerData.transactionCount += 1;
      
      if (new Date(transaction.date) < new Date(customerData.firstDeposit)) {
        customerData.firstDeposit = transaction.date;
      }
      if (new Date(transaction.date) > new Date(customerData.lastDeposit)) {
        customerData.lastDeposit = transaction.date;
      }
    }
  });

  // Calculate average deposits
  customerMap.forEach(customerData => {
    customerData.avgDeposit = customerData.totalDeposits / customerData.transactionCount;
  });

  const headers = [
    'Customer Name',
    'Total Deposits',
    'Transaction Count',
    'Average Deposit',
    'First Deposit Date',
    'Last Deposit Date'
  ];

  const rows = Array.from(customerMap.values())
    .sort((a, b) => b.totalDeposits - a.totalDeposits)
    .map(customer => [
      customer.name,
      customer.totalDeposits.toFixed(2),
      customer.transactionCount.toString(),
      customer.avgDeposit.toFixed(2),
      new Date(customer.firstDeposit).toLocaleDateString('en-IN'),
      new Date(customer.lastDeposit).toLocaleDateString('en-IN')
    ]);

  const content = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');

  const blob = new Blob([content], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8;'
  });
  const link = document.createElement('a');

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
