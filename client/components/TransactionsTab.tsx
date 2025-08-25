import React, { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pencil,
  Save,
  X,
  Plus,
  Search,
  Filter,
  Calendar,
  ArrowUpDown,
  Eye,
  EyeOff,
  Settings,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

interface Customer {
  id: number;
  name: string;
  totalDeposits: number;
  transactionCount: number;
  lastTransaction: string;
  isActive: boolean;
}

interface TransactionsTabProps {
  transactions: Transaction[];
  setTransactions: (transactions: Transaction[]) => void;
  customers: Customer[];
  setCustomers: (customers: Customer[]) => void;
}

export default function TransactionsTab({
  transactions,
  setTransactions,
  customers,
  setCustomers,
}: TransactionsTabProps) {

  // Validate and fix duplicate transaction IDs on component mount
  useEffect(() => {
    const seenIds = new Set<number>();
    const duplicatesFound = transactions.some(transaction => {
      if (seenIds.has(transaction.id)) {
        return true;
      }
      seenIds.add(transaction.id);
      return false;
    });

    if (duplicatesFound) {
      console.warn('Duplicate transaction IDs detected, fixing...');
      const fixedTransactions = transactions.map((transaction, index) => ({
        ...transaction,
        id: Date.now() + index // Assign unique timestamp-based IDs
      }));
      setTransactions(fixedTransactions);
    }
  }, []);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<Partial<Transaction>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [depositorFilter, setDepositorFilter] = useState("all");

  // Column visibility toggles
  const [showWithdrawals, setShowWithdrawals] = useState(true);
  const [showBalance, setShowBalance] = useState(true);
  const [showDate, setShowDate] = useState(true);
  const [showType, setShowType] = useState(true);

  // Auto-balance feature
  const [autoBalance, setAutoBalance] = useState(true);

  const handleEdit = (transaction: Transaction) => {
    setEditingId(transaction.id);
    setEditData(transaction);
    setCustomerSearchTerm(transaction.depositor);
    setShowCustomerDropdown(false);
  };

  const handleSave = () => {
    if (editingId && editData) {
      const updatedTransactions = transactions.map((t) =>
        t.id === editingId ? { ...t, ...editData } : t,
      );
      setTransactions(updatedTransactions);

      setEditingId(null);
      setEditData({});
      setCustomerSearchTerm("");
      setShowCustomerDropdown(false);
    }
  };

  // Auto-balance amounts when editing
  const handleAmountChange = (field: 'deposits' | 'withdrawals', value: number) => {
    if (!autoBalance) {
      setEditData({ ...editData, [field]: value });
      return;
    }

    // Auto-balance: when one changes, adjust the other to maintain balance
    const currentTransaction = transactions.find(t => t.id === editingId);
    if (!currentTransaction) return;

    if (field === 'deposits') {
      setEditData({
        ...editData,
        deposits: value,
        withdrawals: 0 // Clear withdrawals when setting deposits
      });
    } else {
      setEditData({
        ...editData,
        withdrawals: value,
        deposits: 0 // Clear deposits when setting withdrawals
      });
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData({});
    setCustomerSearchTerm("");
    setShowCustomerDropdown(false);
  };

  const handleCustomerSelect = (customerName: string) => {
    setEditData({ ...editData, depositor: customerName });
    setCustomerSearchTerm(customerName);
    setShowCustomerDropdown(false);
  };

  const handleCustomerInputChange = (value: string) => {
    setEditData({ ...editData, depositor: value });
    setCustomerSearchTerm(value);
    setShowCustomerDropdown(value.length > 0);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        // Allow Enter to save when editing
        if (e.key === 'Enter' && editingId) {
          e.preventDefault();
          handleSave();
        }
        return;
      }

      // Global shortcuts when not editing in input fields
      if (e.key.toLowerCase() === 'a' && !editingId) {
        e.preventDefault();
        handleAddNew();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [editingId]);

  // Filter customers based on search term
  const filteredCustomerSuggestions = customers
    .filter((customer) =>
      customer.name.toLowerCase().includes(customerSearchTerm.toLowerCase()),
    )
    .slice(0, 5); // Limit to 5 suggestions

  const handleDelete = (id: number) => {
    const updatedTransactions = transactions.filter((t) => t.id !== id);
    setTransactions(updatedTransactions);
  };

  const handleAddNew = () => {
    // Generate unique ID using timestamp + random to prevent duplicates
    const uniqueId = Date.now() + Math.floor(Math.random() * 1000);
    const newTransaction: Transaction = {
      id: uniqueId,
      date: new Date().toISOString().split("T")[0],
      particulars: "New Transaction",
      depositor: "",
      withdrawals: 0,
      deposits: 0,
      balance: 0,
      type: "UPI",
    };
    setTransactions([...transactions, newTransaction]);
    setEditingId(newTransaction.id);
    setEditData(newTransaction);
    setCustomerSearchTerm("");
    setShowCustomerDropdown(false);

    // Scroll to the new transaction if not in view
    setTimeout(() => {
      const newRow = document.querySelector(`[data-transaction-id="${uniqueId}"]`);
      if (newRow) {
        newRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  // Get unique depositors for filter
  const uniqueDepositors = useMemo(() => {
    const depositors = [...new Set(transactions.map((t) => t.depositor))]
      .filter((depositor) => depositor && depositor.trim() !== "") // Filter out empty strings
      .sort();
    return depositors;
  }, [transactions]);

  // Filter and sort transactions
  const filteredTransactions = useMemo(() => {
    let filtered = transactions.filter((transaction) => {
      const matchesSearch =
        transaction.depositor
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        transaction.particulars
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesFilter =
        filterType === "all" ||
        (filterType === "deposits" && transaction.deposits > 0) ||
        (filterType === "withdrawals" && transaction.withdrawals > 0) ||
        transaction.type.toLowerCase() === filterType.toLowerCase();

      // Date range filtering
      const transactionDate = new Date(transaction.date);
      const matchesDateRange =
        (!startDate || transactionDate >= new Date(startDate)) &&
        (!endDate || transactionDate <= new Date(endDate));

      // Depositor filtering
      const matchesDepositor =
        depositorFilter === "all" || transaction.depositor === depositorFilter;

      return (
        matchesSearch && matchesFilter && matchesDateRange && matchesDepositor
      );
    });

    // Sort by date
    filtered.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    });

    return filtered;
  }, [
    transactions,
    searchTerm,
    filterType,
    startDate,
    endDate,
    sortOrder,
    depositorFilter,
  ]);

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN");
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "UPI":
        return "bg-blue-100 text-blue-800";
      case "TRANSFER":
        return "bg-purple-100 text-purple-800";
      case "CASH":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">Transaction Records</h3>
          <p className="text-muted-foreground">
            View and edit all transaction details with deposited customer information
          </p>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              ⌨️ Shortcuts: Press <kbd className="px-1 bg-gray-100 rounded text-xs">A</kbd> to add new • Press <kbd className="px-1 bg-gray-100 rounded text-xs">Enter</kbd> to save while editing
            </p>
            <p className="text-sm text-blue-600 bg-blue-50 p-2 rounded border">
              ⚙️ <strong>Auto-Balance:</strong> When enabled, editing deposit amounts automatically clears withdrawals (and vice versa). This ensures each transaction is either a deposit OR withdrawal, maintaining proper transaction logic. Toggle this feature using the Auto-Balance button below.
            </p>
          </div>
        </div>
        <Button onClick={handleAddNew} className="whitespace-nowrap">
          <Plus className="w-4 h-4 mr-2" />
          Add Transaction
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search by depositor name or transaction details..."
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
              <SelectItem value="deposits">Deposits Only</SelectItem>
              <SelectItem value="withdrawals">Withdrawals Only</SelectItem>
              <SelectItem value="upi">UPI</SelectItem>
              <SelectItem value="transfer">Transfer</SelectItem>
              <SelectItem value="cash">Cash</SelectItem>
            </SelectContent>
          </Select>

          <Select value={depositorFilter} onValueChange={setDepositorFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by depositor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Depositors</SelectItem>
              {uniqueDepositors.map((depositor) => (
                <SelectItem key={depositor} value={depositor}>
                  {depositor}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date Range and Sorting */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                From Date
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full sm:w-40"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                To Date
              </label>
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
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="whitespace-nowrap"
            >
              <ArrowUpDown className="w-4 h-4 mr-2" />
              Sort by Date (
              {sortOrder === "asc" ? "Oldest First" : "Newest First"})
            </Button>

            {(startDate || endDate || depositorFilter !== "all") && (
              <Button
                variant="ghost"
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                  setDepositorFilter("all");
                }}
                className="whitespace-nowrap"
              >
                Clear Filters
              </Button>
            )}

            {/* Column Visibility Controls */}
            <div className="flex gap-2">
              <Button
                variant={showDate ? "default" : "outline"}
                size="sm"
                onClick={() => setShowDate(!showDate)}
                className="whitespace-nowrap"
              >
                {showDate ? <Eye className="w-4 h-4 mr-1" /> : <EyeOff className="w-4 h-4 mr-1" />}
                Date
              </Button>
              <Button
                variant={showType ? "default" : "outline"}
                size="sm"
                onClick={() => setShowType(!showType)}
                className="whitespace-nowrap"
              >
                {showType ? <Eye className="w-4 h-4 mr-1" /> : <EyeOff className="w-4 h-4 mr-1" />}
                Type
              </Button>
              <Button
                variant={showWithdrawals ? "default" : "outline"}
                size="sm"
                onClick={() => setShowWithdrawals(!showWithdrawals)}
                className="whitespace-nowrap"
              >
                {showWithdrawals ? <Eye className="w-4 h-4 mr-1" /> : <EyeOff className="w-4 h-4 mr-1" />}
                Withdrawals
              </Button>
              <Button
                variant={showBalance ? "default" : "outline"}
                size="sm"
                onClick={() => setShowBalance(!showBalance)}
                className="whitespace-nowrap"
              >
                {showBalance ? <Eye className="w-4 h-4 mr-1" /> : <EyeOff className="w-4 h-4 mr-1" />}
                Balance
              </Button>
              <Button
                variant={autoBalance ? "default" : "outline"}
                size="sm"
                onClick={() => setAutoBalance(!autoBalance)}
                className="whitespace-nowrap"
                title="Auto-Balance Feature: When editing deposit amounts, withdrawals automatically clear to 0 (and vice versa). This maintains proper transaction logic where each entry is either a deposit OR withdrawal, never both. Click to toggle this behavior on/off."
              >
                <Settings className="w-4 h-4 mr-1" />
                Auto-Balance
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            All Transactions ({filteredTransactions.length})
          </CardTitle>
          <CardDescription>
            Click the edit button to modify transaction details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {showDate && <TableHead>Date</TableHead>}
                  <TableHead>Deposited Customer</TableHead>
                  <TableHead>Transaction Details</TableHead>
                  {showType && <TableHead>Type</TableHead>}
                  <TableHead className="text-right">Deposits</TableHead>
                  {showWithdrawals && <TableHead className="text-right">Withdrawals</TableHead>}
                  {showBalance && <TableHead className="text-right">Balance</TableHead>}
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction, index) => (
                  <TableRow
                    key={`transaction-${transaction.id}-${index}`}
                    className="hover:bg-gray-50"
                    data-transaction-id={transaction.id}
                  >
                    {showDate && (
                    <TableCell>
                      {editingId === transaction.id ? (
                        <Input
                          type="date"
                          value={editData.date || transaction.date}
                          onChange={(e) =>
                            setEditData({ ...editData, date: e.target.value })
                          }
                          className="w-32"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleSave();
                            }
                          }}
                        />
                      ) : (
                        formatDate(transaction.date)
                      )}
                    </TableCell>
                    )}

                    <TableCell>
                      {editingId === transaction.id ? (
                        <div className="relative w-40">
                          <Input
                            value={editData.depositor || transaction.depositor}
                            onChange={(e) =>
                              handleCustomerInputChange(e.target.value)
                            }
                            onFocus={() => setShowCustomerDropdown(true)}
                            placeholder="Type customer name..."
                            className="w-full"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSave();
                              }
                            }}
                          />
                          {showCustomerDropdown &&
                            filteredCustomerSuggestions.length > 0 && (
                              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
                                {filteredCustomerSuggestions.map((customer) => (
                                  <div
                                    key={customer.id}
                                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                                    onClick={() =>
                                      handleCustomerSelect(customer.name)
                                    }
                                  >
                                    <div className="font-medium">
                                      {customer.name}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {customer.transactionCount} transactions
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                        </div>
                      ) : (
                        <span className="font-medium text-blue-700">
                          {transaction.depositor}
                        </span>
                      )}
                    </TableCell>

                    <TableCell>
                      {editingId === transaction.id ? (
                        <Input
                          value={
                            editData.particulars || transaction.particulars
                          }
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              particulars: e.target.value,
                            })
                          }
                          className="w-64"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleSave();
                            }
                          }}
                        />
                      ) : (
                        <span className="text-sm text-gray-600 max-w-xs truncate">
                          {transaction.particulars}
                        </span>
                      )}
                    </TableCell>

                    {showType && (
                    <TableCell>
                      {editingId === transaction.id ? (
                        <Select
                          value={editData.type || transaction.type}
                          onValueChange={(value) =>
                            setEditData({ ...editData, type: value })
                          }
                        >
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="UPI">UPI</SelectItem>
                            <SelectItem value="TRANSFER">Transfer</SelectItem>
                            <SelectItem value="CASH">Cash</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge className={getTypeColor(transaction.type)}>
                          {transaction.type}
                        </Badge>
                      )}
                    </TableCell>
                    )}

                    <TableCell className="text-right">
                      {editingId === transaction.id ? (
                        <Input
                          type="number"
                          value={editData.deposits ?? transaction.deposits}
                          onChange={(e) => handleAmountChange('deposits', Number(e.target.value))}
                          className="w-24 text-right"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleSave();
                            }
                          }}
                        />
                      ) : transaction.deposits > 0 ? (
                        <span className="deposit-text">
                          {formatCurrency(transaction.deposits)}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>

                    {showWithdrawals && (
                    <TableCell className="text-right">
                      {editingId === transaction.id ? (
                        <Input
                          type="number"
                          value={
                            editData.withdrawals ?? transaction.withdrawals
                          }
                          onChange={(e) => handleAmountChange('withdrawals', Number(e.target.value))}
                          className="w-24 text-right"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleSave();
                            }
                          }}
                        />
                      ) : transaction.withdrawals > 0 ? (
                        <span className="withdrawal-text">
                          {formatCurrency(transaction.withdrawals)}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    )}

                    {showBalance && (
                    <TableCell className="text-right">
                      {editingId === transaction.id ? (
                        <Input
                          type="number"
                          value={editData.balance ?? transaction.balance}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              balance: Number(e.target.value),
                            })
                          }
                          className="w-28 text-right"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleSave();
                            }
                          }}
                        />
                      ) : (
                        <span className="balance-text font-medium">
                          {formatCurrency(transaction.balance)}
                        </span>
                      )}
                    </TableCell>
                    )}

                    <TableCell className="text-center">
                      {editingId === transaction.id ? (
                        <div className="flex gap-2 justify-center">
                          <Button
                            size="sm"
                            onClick={handleSave}
                            variant="default"
                          >
                            <Save className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleCancel}
                            variant="outline"
                          >
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
              No transactions found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
