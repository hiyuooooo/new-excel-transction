import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Calendar, TrendingUp, Users, DollarSign, Download, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

interface MonthlySummaryTabProps {
  transactions: Transaction[];
}

interface MonthlyData {
  month: string;
  year: number;
  totalDeposits: number;
  totalWithdrawals: number;
  netFlow: number;
  transactionCount: number;
  uniqueDepositors: number;
  avgDeposit: number;
}

interface DepositorSummary {
  name: string;
  totalDeposits: number;
  transactionCount: number;
  avgDeposit: number;
  lastDeposit: string;
}

export default function MonthlySummaryTab({ transactions }: MonthlySummaryTabProps) {
  const [selectedYear, setSelectedYear] = useState('2025');
  const [viewType, setViewType] = useState<'monthly' | 'depositors'>('monthly');

  // Process transactions to create monthly summaries
  const processMonthlyData = (): MonthlyData[] => {
    const monthlyMap = new Map<string, MonthlyData>();

    transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, {
          month: monthName,
          year: date.getFullYear(),
          totalDeposits: 0,
          totalWithdrawals: 0,
          netFlow: 0,
          transactionCount: 0,
          uniqueDepositors: 0,
          avgDeposit: 0
        });
      }

      const monthData = monthlyMap.get(monthKey)!;
      monthData.totalDeposits += transaction.deposits;
      monthData.totalWithdrawals += transaction.withdrawals;
      monthData.transactionCount += 1;
    });

    // Calculate derived fields
    monthlyMap.forEach((monthData, monthKey) => {
      monthData.netFlow = monthData.totalDeposits - monthData.totalWithdrawals;
      
      // Count unique depositors for this month
      const monthTransactions = transactions.filter(t => {
        const date = new Date(t.date);
        const tMonthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        return tMonthKey === monthKey && t.deposits > 0;
      });
      
      const uniqueDepositors = new Set(monthTransactions.map(t => t.depositor));
      monthData.uniqueDepositors = uniqueDepositors.size;
      
      const depositTransactions = monthTransactions.filter(t => t.deposits > 0);
      monthData.avgDeposit = depositTransactions.length > 0 
        ? monthData.totalDeposits / depositTransactions.length 
        : 0;
    });

    return Array.from(monthlyMap.values()).sort((a, b) => a.month.localeCompare(b.month));
  };

  // Process depositor summaries
  const processDepositorData = (): DepositorSummary[] => {
    const depositorMap = new Map<string, DepositorSummary>();

    transactions.forEach(transaction => {
      if (transaction.deposits > 0) {
        if (!depositorMap.has(transaction.depositor)) {
          depositorMap.set(transaction.depositor, {
            name: transaction.depositor,
            totalDeposits: 0,
            transactionCount: 0,
            avgDeposit: 0,
            lastDeposit: transaction.date
          });
        }

        const depositorData = depositorMap.get(transaction.depositor)!;
        depositorData.totalDeposits += transaction.deposits;
        depositorData.transactionCount += 1;
        
        // Update last deposit if this transaction is more recent
        if (new Date(transaction.date) > new Date(depositorData.lastDeposit)) {
          depositorData.lastDeposit = transaction.date;
        }
      }
    });

    // Calculate average deposits
    depositorMap.forEach(depositorData => {
      depositorData.avgDeposit = depositorData.totalDeposits / depositorData.transactionCount;
    });

    return Array.from(depositorMap.values()).sort((a, b) => b.totalDeposits - a.totalDeposits);
  };

  const monthlyData = processMonthlyData();
  const depositorData = processDepositorData();

  // Chart data for monthly deposits
  const chartData = monthlyData.map(month => ({
    month: month.month.split(' ')[0], // Just month name
    deposits: month.totalDeposits,
    withdrawals: month.totalWithdrawals,
    netFlow: month.netFlow
  }));

  // Pie chart data for top depositors
  const pieData = depositorData.slice(0, 5).map((depositor, index) => ({
    name: depositor.name,
    value: depositor.totalDeposits,
    color: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'][index]
  }));

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  // Get available years
  const availableYears = Array.from(new Set(transactions.map(t => new Date(t.date).getFullYear().toString())));

  // Filter data by selected year
  const filteredMonthlyData = monthlyData.filter(m => m.year.toString() === selectedYear);

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">Monthly Summary & Analysis</h3>
          <p className="text-muted-foreground">
            Track monthly cash deposits and analyze customer patterns
          </p>
        </div>
        <div className="flex gap-3">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-32">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableYears.map(year => (
                <SelectItem key={year} value={year}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={viewType} onValueChange={(value: 'monthly' | 'depositors') => setViewType(value)}>
            <SelectTrigger className="w-40">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monthly View</SelectItem>
              <SelectItem value="depositors">Top Depositors</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cash Deposited</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold deposit-text">
              {formatCurrency(filteredMonthlyData.reduce((sum, m) => sum + m.totalDeposits, 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              In {selectedYear}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Depositors</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {depositorData.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Unique customers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Monthly Deposit</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(
                filteredMonthlyData.length > 0 
                  ? filteredMonthlyData.reduce((sum, m) => sum + m.totalDeposits, 0) / filteredMonthlyData.length
                  : 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Per month in {selectedYear}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Deposits Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Cash Flow</CardTitle>
            <CardDescription>Deposits vs Withdrawals by month</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Bar dataKey="deposits" fill="#10B981" name="Deposits" />
                <Bar dataKey="withdrawals" fill="#EF4444" name="Withdrawals" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Depositors Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Depositors</CardTitle>
            <CardDescription>Distribution of deposits by customer</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Data Tables */}
      {viewType === 'monthly' ? (
        <Card>
          <CardHeader>
            <CardTitle>Monthly Breakdown ({selectedYear})</CardTitle>
            <CardDescription>Detailed monthly cash deposit analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead className="text-right">Total Deposits</TableHead>
                  <TableHead className="text-right">Total Withdrawals</TableHead>
                  <TableHead className="text-right">Net Flow</TableHead>
                  <TableHead className="text-right">Transactions</TableHead>
                  <TableHead className="text-right">Unique Depositors</TableHead>
                  <TableHead className="text-right">Avg Deposit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMonthlyData.map((month) => (
                  <TableRow key={month.month}>
                    <TableCell className="font-medium">{month.month}</TableCell>
                    <TableCell className="text-right deposit-text">
                      {formatCurrency(month.totalDeposits)}
                    </TableCell>
                    <TableCell className="text-right withdrawal-text">
                      {formatCurrency(month.totalWithdrawals)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={month.netFlow >= 0 ? 'deposit-text' : 'withdrawal-text'}>
                        {formatCurrency(month.netFlow)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">{month.transactionCount}</TableCell>
                    <TableCell className="text-right">{month.uniqueDepositors}</TableCell>
                    <TableCell className="text-right">{formatCurrency(month.avgDeposit)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Top Depositors Analysis</CardTitle>
            <CardDescription>Ranking of customers by total deposits</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rank</TableHead>
                  <TableHead>Customer Name</TableHead>
                  <TableHead className="text-right">Total Deposits</TableHead>
                  <TableHead className="text-right">Transactions</TableHead>
                  <TableHead className="text-right">Average Deposit</TableHead>
                  <TableHead className="text-right">Last Deposit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {depositorData.map((depositor, index) => (
                  <TableRow key={depositor.name}>
                    <TableCell>
                      <Badge variant={index < 3 ? 'default' : 'outline'}>
                        #{index + 1}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium text-blue-700">
                      {depositor.name}
                    </TableCell>
                    <TableCell className="text-right deposit-text">
                      {formatCurrency(depositor.totalDeposits)}
                    </TableCell>
                    <TableCell className="text-right">{depositor.transactionCount}</TableCell>
                    <TableCell className="text-right">{formatCurrency(depositor.avgDeposit)}</TableCell>
                    <TableCell className="text-right">{formatDate(depositor.lastDeposit)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
