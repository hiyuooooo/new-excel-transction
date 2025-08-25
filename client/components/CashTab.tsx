import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pencil, Save, X, Plus, Search, Filter, ArrowUpDown, DollarSign, TrendingUp, Calendar } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CashTransaction {
  id: number;
  date: string;
  description: string;
  amount: number;
  type: 'cash_in' | 'cash_out';
  category: string;
  balance: number;
}

interface CashTabProps {
  cashTransactions: CashTransaction[];
  setCashTransactions: (transactions: CashTransaction[]) => void;
}

export default function CashTab({ cashTransactions, setCashTransactions }: CashTabProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<Partial<CashTransaction>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const handleEdit = (transaction: CashTransaction) => {
    setEditingId(transaction.id);
    setEditData(transaction);
  };

  const handleSave = () => {
    if (editingId && editData) {
      const updatedTransactions = cashTransactions.map(t => 
        t.id === editingId ? { ...t, ...editData } : t
      );
      setCashTransactions(updatedTransactions);
      setEditingId(null);
      setEditData({});
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleDelete = (id: number) => {
    const updatedTransactions = cashTransactions.filter(t => t.id !== id);
    setCashTransactions(updatedTransactions);
  };

  const handleAddNew = () => {
    const newTransaction: CashTransaction = {
      id: Math.max(...cashTransactions.map(t => t.id), 0) + 1,
      date: new Date().toISOString().split('T')[0],
      description: '',
      amount: 0,
      type: 'cash_in',
      category: 'General',
      balance: 0
    };
    setCashTransactions([...cashTransactions, newTransaction]);
    setEditingId(newTransaction.id);
    setEditData(newTransaction);
  };

  // Filter and sort transactions
  const filteredTransactions = useMemo(() => {
    let filtered = cashTransactions.filter(transaction => {
      const matchesSearch = 
        transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.category.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilter = 
        filterType === 'all' ||
        (filterType === 'cash_in' && transaction.type === 'cash_in') ||
        (filterType === 'cash_out' && transaction.type === 'cash_out');

      // Date range filtering
      const transactionDate = new Date(transaction.date);
      const matchesDateRange = 
        (!startDate || transactionDate >= new Date(startDate)) &&
        (!endDate || transactionDate <= new Date(endDate));

      return matchesSearch && matchesFilter && matchesDateRange;
    });

    // Sort by date
    filtered.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

    return filtered;
  }, [cashTransactions, searchTerm, filterType, startDate, endDate, sortOrder]);

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  // Calculate summary stats
  const totalCashIn = cashTransactions.filter(t => t.type === 'cash_in').reduce((sum, t) => sum + t.amount, 0);
  const totalCashOut = cashTransactions.filter(t => t.type === 'cash_out').reduce((sum, t) => sum + t.amount, 0);
  const netCash = totalCashIn - totalCashOut;
  const currentBalance = cashTransactions.length > 0 ? cashTransactions[cashTransactions.length - 1].balance : 0;

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">Cash Transactions</h3>
          <p className="text-muted-foreground">
            Manage cash deposits, withdrawals, and cash flow
          </p>
        </div>
        <Button onClick={handleAddNew} className="whitespace-nowrap">
          <Plus className="w-4 h-4 mr-2" />
          Add Cash Transaction
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cash In</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalCashIn)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total cash received
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cash Out</CardTitle>
            <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totalCashOut)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total cash spent
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Cash Flow</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netCash >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(netCash)}
            </div>
            <p className="text-xs text-muted-foreground">
              Net difference
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
            <Calendar className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(currentBalance)}
            </div>
            <p className="text-xs text-muted-foreground">
              Available cash
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search by description or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Transactions</SelectItem>
              <SelectItem value="cash_in">Cash In Only</SelectItem>
              <SelectItem value="cash_out">Cash Out Only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Date Range and Sorting */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">From Date</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full sm:w-40"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">To Date</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full sm:w-40"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="whitespace-nowrap"
            >
              <ArrowUpDown className="w-4 h-4 mr-2" />
              Sort by Date ({sortOrder === 'asc' ? 'Oldest First' : 'Newest First'})
            </Button>
            
            {(startDate || endDate) && (
              <Button
                variant="ghost"
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                }}
                className="whitespace-nowrap"
              >
                Clear Dates
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Cash Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Cash Transactions ({filteredTransactions.length})</CardTitle>
          <CardDescription>
            Track all cash inflows and outflows
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id} className="hover:bg-gray-50">
                    <TableCell>
                      {editingId === transaction.id ? (
                        <Input
                          type="date"
                          value={editData.date || transaction.date}
                          onChange={(e) => setEditData({...editData, date: e.target.value})}
                          className="w-32"
                        />
                      ) : (
                        formatDate(transaction.date)
                      )}
                    </TableCell>
                    
                    <TableCell>
                      {editingId === transaction.id ? (
                        <Input
                          value={editData.description || transaction.description}
                          onChange={(e) => setEditData({...editData, description: e.target.value})}
                          className="w-48"
                        />
                      ) : (
                        transaction.description
                      )}
                    </TableCell>
                    
                    <TableCell>
                      {editingId === transaction.id ? (
                        <Input
                          value={editData.category || transaction.category}
                          onChange={(e) => setEditData({...editData, category: e.target.value})}
                          className="w-32"
                        />
                      ) : (
                        transaction.category
                      )}
                    </TableCell>
                    
                    <TableCell>
                      {editingId === transaction.id ? (
                        <Select
                          value={editData.type || transaction.type}
                          onValueChange={(value: 'cash_in' | 'cash_out') => setEditData({...editData, type: value})}
                        >
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cash_in">Cash In</SelectItem>
                            <SelectItem value="cash_out">Cash Out</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge className={transaction.type === 'cash_in' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {transaction.type === 'cash_in' ? 'Cash In' : 'Cash Out'}
                        </Badge>
                      )}
                    </TableCell>
                    
                    <TableCell className="text-right">
                      {editingId === transaction.id ? (
                        <Input
                          type="number"
                          value={editData.amount ?? transaction.amount}
                          onChange={(e) => setEditData({...editData, amount: Number(e.target.value)})}
                          className="w-24 text-right"
                        />
                      ) : (
                        <span className={transaction.type === 'cash_in' ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                          {formatCurrency(transaction.amount)}
                        </span>
                      )}
                    </TableCell>
                    
                    <TableCell className="text-right">
                      {editingId === transaction.id ? (
                        <Input
                          type="number"
                          value={editData.balance ?? transaction.balance}
                          onChange={(e) => setEditData({...editData, balance: Number(e.target.value)})}
                          className="w-28 text-right"
                        />
                      ) : (
                        <span className="text-blue-600 font-medium">
                          {formatCurrency(transaction.balance)}
                        </span>
                      )}
                    </TableCell>
                    
                    <TableCell className="text-center">
                      {editingId === transaction.id ? (
                        <div className="flex gap-2 justify-center">
                          <Button size="sm" onClick={handleSave} variant="default">
                            <Save className="w-3 h-3" />
                          </Button>
                          <Button size="sm" onClick={handleCancel} variant="outline">
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex gap-2 justify-center">
                          <Button 
                            size="sm" 
                            onClick={() => handleEdit(transaction)}
                            variant="outline"
                          >
                            <Pencil className="w-3 h-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            onClick={() => handleDelete(transaction.id)}
                            variant="destructive"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {filteredTransactions.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No cash transactions found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
