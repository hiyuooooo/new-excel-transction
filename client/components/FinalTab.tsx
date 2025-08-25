import React, { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DollarSign,
  CalendarDays,
  Users,
  Scissors,
  TrendingUp,
  TrendingDown,
  Download,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { exportFinalTabToExcel } from "@/lib/excel-export";

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

interface FinalTabProps {
  transactions: Transaction[];
  setTransactions: (transactions: Transaction[]) => void;
  customers: Customer[];
  setCustomers: (customers: Customer[]) => void;
}

interface SplitPreview {
  splitDate: string;
  amount: number;
  dayOffset: number;
}

interface CashDistribution {
  date: string;
  customer: string;
  amount: number;
}

export default function FinalTab({
  transactions,
  setTransactions,
  customers,
  setCustomers,
}: FinalTabProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<Partial<Transaction>>({});

  // Cash distribution states
  const [totalCashAmount, setTotalCashAmount] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [monthCount, setMonthCount] = useState("4");
  const [showDistribution, setShowDistribution] = useState(false);
  const [distributionPreview, setDistributionPreview] = useState<
    CashDistribution[]
  >([]);

  // Performance optimized deposit transactions with pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);

  // Transaction splitting states
  const [splittingId, setSplittingId] = useState<number | null>(null);
  const [splitCount, setSplitCount] = useState("3");
  const [daysBetween, setDaysBetween] = useState("5");
  const [increasingSequence, setIncreasingSequence] = useState(false);
  const [showSplitDialog, setShowSplitDialog] = useState(false);
  const [splitPreview, setSplitPreview] = useState<SplitPreview[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  // Only show deposit transactions for final view
  const depositTransactions = useMemo(() => {
    return transactions
      .filter((t) => t.deposits > 0)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions]);

  // Pagination for deposit transactions
  const totalPages = Math.ceil(depositTransactions.length / itemsPerPage);
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return depositTransactions.slice(startIndex, endIndex);
  }, [depositTransactions, currentPage, itemsPerPage]);

  const handleEdit = (transaction: Transaction) => {
    setEditingId(transaction.id);
    setEditData({
      date: transaction.date,
      depositor: transaction.depositor,
      deposits: transaction.deposits,
    });
  };

  const handleSave = () => {
    if (editingId && editData) {
      const updatedTransactions = transactions.map((t) =>
        t.id === editingId
          ? {
              ...t,
              date: editData.date || t.date,
              depositor: editData.depositor || t.depositor,
              deposits: editData.deposits || t.deposits,
            }
          : t,
      );
      setTransactions(updatedTransactions);
      setEditingId(null);
      setEditData({});
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleSplitTransaction = (transaction: Transaction) => {
    if (transaction.deposits <= 6000) {
      alert(
        "Transaction splitting is only available for deposits greater than ₹6,000",
      );
      return;
    }
    setSelectedTransaction(transaction);
    setSplittingId(transaction.id);
    setShowSplitDialog(true);
    generateSplitPreview(transaction);
  };

  const generateSplitPreview = (transaction: Transaction) => {
    const parts = parseInt(splitCount);
    const daysDiff = parseInt(daysBetween);

    if (parts < 2 || parts > 10) return;

    // Calculate split amounts
    const totalAmount = transaction.deposits;
    const baseAmount = Math.floor(totalAmount / parts);
    const remainder = totalAmount % parts;

    const splitAmounts: number[] = [];
    for (let i = 0; i < parts; i++) {
      splitAmounts.push(baseAmount + (i < remainder ? 1 : 0));
    }

    // Sort amounts based on sequence preference
    if (increasingSequence) {
      splitAmounts.sort((a, b) => a - b);
    } else {
      splitAmounts.sort((a, b) => b - a);
    }

    // Generate preview with dates
    const originalDate = new Date(transaction.date);
    const preview: SplitPreview[] = [];

    for (let i = 0; i < parts; i++) {
      const newDate = new Date(originalDate);
      if (i > 0) {
        // Subtract days for each subsequent transaction (but not the first one)
        newDate.setDate(originalDate.getDate() - (daysDiff * i));
      }

      preview.push({
        splitDate: newDate.toISOString().split('T')[0],
        amount: splitAmounts[i],
        dayOffset: i === 0 ? 0 : -(daysDiff * i)
      });
    }

    setSplitPreview(preview);
  };

  const applySplitTransaction = () => {
    if (!selectedTransaction || splitPreview.length === 0) return;

    const parts = splitPreview.length;

    // Create new transactions from preview
    const newTransactions: Transaction[] = splitPreview.map((preview, i) => ({
      id: Math.max(...transactions.map((t) => t.id), 0) + i + 1,
      date: preview.splitDate,
      particulars: `${selectedTransaction.particulars} (Split ${i + 1}/${parts})`,
      depositor: selectedTransaction.depositor,
      withdrawals: 0,
      deposits: preview.amount,
      balance: 0, // Will be recalculated
      type: selectedTransaction.type,
    }));

    // Remove original transaction and add split transactions
    const updatedTransactions = transactions.filter((t) => t.id !== splittingId);
    setTransactions([...updatedTransactions, ...newTransactions]);

    // Reset states
    closeSplitDialog();
    alert(`Successfully split transaction into ${parts} parts!`);
  };

  const closeSplitDialog = () => {
    setShowSplitDialog(false);
    setSplittingId(null);
    setSelectedTransaction(null);
    setSplitPreview([]);
    setSplitCount("3");
    setDaysBetween("5");
    setIncreasingSequence(false);
  };

  const cancelSplitTransaction = () => {
    closeSplitDialog();
  };

  const handleSplitConfigChange = () => {
    if (selectedTransaction) {
      generateSplitPreview(selectedTransaction);
    }
  };

  // Update preview when split configuration changes
  useEffect(() => {
    if (selectedTransaction && showSplitDialog) {
      generateSplitPreview(selectedTransaction);
    }
  }, [splitCount, daysBetween, increasingSequence, selectedTransaction, showSplitDialog]);

  const handleExportFinal = () => {
    exportFinalTabToExcel(depositTransactions, 'final_deposits');
  };

  // Generate cash distribution
  const generateCashDistribution = () => {
    if (!totalCashAmount || !startDate || !endDate) {
      alert("Please fill in all required fields");
      return;
    }

    const totalAmount = parseFloat(totalCashAmount);
    const months = parseInt(monthCount);

    // Calculate 70% and 30% split
    const regularAmount = totalAmount * 0.7;
    const cashCAmount = totalAmount * 0.3;

    // For regular customers, use "cash" name
    // For _c customers, use existing customer names with "_c" suffix
    const cashCCustomers = customers.map((c) => c.name + "_c");

    // Generate date range
    const start = new Date(startDate);
    const end = new Date(endDate);
    const dateRange: Date[] = [];

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dateRange.push(new Date(d));
    }

    // Filter dates that don't have existing transactions
    const availableDates = dateRange.filter((date) => {
      const dateStr = date.toISOString().split("T")[0];
      return !transactions.some((t) => t.date === dateStr);
    });

    const distributions: CashDistribution[] = [];

    // Helper function to generate amount in xx00 format between 2000-7000
    const generateAmount = () => {
      // Generate amount in 100s between 2000-7000 (20-70 * 100)
      const hundreds = Math.floor(Math.random() * (70 - 20 + 1)) + 20;
      return hundreds * 100;
    };

    // Distribute regular amount (70%) to "cash" customers
    let remainingRegular = regularAmount;
    while (remainingRegular > 0 && availableDates.length > 0) {
      const randomAmount = generateAmount();
      const actualAmount = Math.min(randomAmount, remainingRegular);

      const randomDate =
        availableDates[Math.floor(Math.random() * availableDates.length)];

      distributions.push({
        date: randomDate.toISOString().split("T")[0],
        customer: "cash",
        amount: actualAmount,
      });

      remainingRegular -= actualAmount;

      // Remove used date to avoid duplicates
      const dateIndex = availableDates.findIndex(
        (d) => d.getTime() === randomDate.getTime(),
      );
      if (dateIndex > -1) {
        availableDates.splice(dateIndex, 1);
      }
    }

    // Distribute _c amount (30%) to customer_c names
    let remainingCash = cashCAmount;
    while (remainingCash > 0 && availableDates.length > 0) {
      const randomAmount = generateAmount();
      const actualAmount = Math.min(randomAmount, remainingCash);

      const randomDate =
        availableDates[Math.floor(Math.random() * availableDates.length)];
      const randomCustomer =
        cashCCustomers[Math.floor(Math.random() * cashCCustomers.length)];

      distributions.push({
        date: randomDate.toISOString().split("T")[0],
        customer: randomCustomer,
        amount: actualAmount,
      });

      remainingCash -= actualAmount;

      // Remove used date to avoid duplicates
      const dateIndex = availableDates.findIndex(
        (d) => d.getTime() === randomDate.getTime(),
      );
      if (dateIndex > -1) {
        availableDates.splice(dateIndex, 1);
      }
    }

    // Sort by date
    distributions.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    setDistributionPreview(distributions);
    setShowDistribution(true);
  };

  const applyCashDistribution = () => {
    // Create new transactions from distribution
    const newTransactions = distributionPreview.map((dist, index) => ({
      id: Math.max(...transactions.map((t) => t.id), 0) + index + 1,
      date: dist.date,
      particulars: `Cash deposit - ${dist.customer.includes("_c") ? "Cash Customer" : "Regular Customer"}`,
      depositor: dist.customer,
      withdrawals: 0,
      deposits: dist.amount,
      balance: 0, // Will be calculated based on previous balance
      type: "CASH",
    }));

    // Add to existing transactions
    setTransactions([...transactions, ...newTransactions]);

    // Note: Not auto-creating customers anymore - user must create them manually

    // Reset form
    setTotalCashAmount("");
    setStartDate("");
    setEndDate("");
    setShowDistribution(false);
    setDistributionPreview([]);

    alert(
      `Successfully distributed ₹${totalCashAmount} across ${distributionPreview.length} transactions!`,
    );
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">Final Transactions View</h3>
          <p className="text-muted-foreground">
            Simplified view with only deposits and cash distribution tools
          </p>
        </div>
        <Button onClick={handleExportFinal} className="whitespace-nowrap">
          <Download className="w-4 h-4 mr-2" />
          Export XLSX
        </Button>
      </div>

      {/* Cash Distribution Section */}
      <Card className="bg-green-50 border-green-200">
        <CardHeader>
          <CardTitle className="text-green-900 flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Cash Distribution Tool
          </CardTitle>
          <CardDescription>
            Distribute cash amount across date range with 70% regular customers,
            30% with "_c" suffix
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Total Cash Amount</label>
              <Input
                type="number"
                placeholder="70000"
                value={totalCashAmount}
                onChange={(e) => setTotalCashAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Start Date</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">End Date</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Months</label>
              <Input
                type="number"
                placeholder="4"
                value={monthCount}
                onChange={(e) => setMonthCount(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={generateCashDistribution}
              disabled={!totalCashAmount || !startDate || !endDate}
            >
              Generate Distribution
            </Button>
            {showDistribution && (
              <Button onClick={applyCashDistribution} variant="default">
                Apply Distribution ({distributionPreview.length} transactions)
              </Button>
            )}
          </div>

          {/* Distribution Preview */}
          {showDistribution && distributionPreview.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium mb-2">Distribution Preview:</h4>
              <div className="bg-white rounded border p-4 max-h-60 overflow-y-auto">
                <div className="grid grid-cols-3 gap-2 text-sm font-medium mb-2">
                  <div>Date</div>
                  <div>Customer</div>
                  <div className="text-right">Amount</div>
                </div>
                {distributionPreview.map((dist, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-3 gap-2 text-sm py-1 border-t"
                  >
                    <div>{formatDate(dist.date)}</div>
                    <div
                      className={
                        dist.customer.includes("_c")
                          ? "text-orange-600"
                          : "text-blue-600"
                      }
                    >
                      {dist.customer}
                    </div>
                    <div className="text-right">
                      {formatCurrency(dist.amount)}
                    </div>
                  </div>
                ))}
                <div className="border-t pt-2 mt-2 grid grid-cols-3 gap-2 font-medium">
                  <div></div>
                  <div>Total:</div>
                  <div className="text-right">
                    {formatCurrency(
                      distributionPreview.reduce((sum, d) => sum + d.amount, 0),
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>


      {/* Deposit Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Deposit Transactions ({depositTransactions.length})
          </CardTitle>
          <CardDescription>
            Only showing deposit transactions - Page {currentPage} of{" "}
            {totalPages}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Deposited Customer</TableHead>
                  <TableHead className="text-right">Deposits</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTransactions.map((transaction) => (
                  <TableRow key={transaction.id} className="hover:bg-gray-50">
                    <TableCell>
                      {editingId === transaction.id ? (
                        <Input
                          type="date"
                          value={editData.date || transaction.date}
                          onChange={(e) =>
                            setEditData({ ...editData, date: e.target.value })
                          }
                          className="w-32"
                        />
                      ) : (
                        formatDate(transaction.date)
                      )}
                    </TableCell>

                    <TableCell>
                      {editingId === transaction.id ? (
                        <Input
                          value={editData.depositor || transaction.depositor}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              depositor: e.target.value,
                            })
                          }
                          className="w-48"
                        />
                      ) : (
                        <span
                          className={`font-medium ${transaction.depositor.includes("_c") ? "text-orange-600" : "text-blue-700"}`}
                        >
                          {transaction.depositor}
                        </span>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      {editingId === transaction.id ? (
                        <Input
                          type="number"
                          value={editData.deposits ?? transaction.deposits}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              deposits: Number(e.target.value),
                            })
                          }
                          className="w-24 text-right"
                        />
                      ) : (
                        <span className="text-green-600 font-semibold">
                          {formatCurrency(transaction.deposits)}
                        </span>
                      )}
                    </TableCell>

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
                          {transaction.deposits > 6000 && (
                            <Button
                              size="sm"
                              onClick={() =>
                                handleSplitTransaction(transaction)
                              }
                              variant="outline"
                              className="text-orange-600 hover:text-orange-700"
                            >
                              <Scissors className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {depositTransactions.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No deposit transactions found.
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-500">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                {Math.min(
                  currentPage * itemsPerPage,
                  depositTransactions.length,
                )}{" "}
                of {depositTransactions.length} transactions
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="flex items-center px-3 text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Split Transaction Dialog */}
      <Dialog open={showSplitDialog} onOpenChange={setShowSplitDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Scissors className="w-5 h-5" />
              Split Transaction
            </DialogTitle>
            <DialogDescription>
              Configure how to split this transaction into multiple parts with different dates
            </DialogDescription>
          </DialogHeader>

          {selectedTransaction && (
            <div className="space-y-6">
              {/* Original Transaction Info */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Original Transaction</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Date:</span> {formatDate(selectedTransaction.date)}
                  </div>
                  <div>
                    <span className="text-gray-600">Amount:</span> {formatCurrency(selectedTransaction.deposits)}
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-600">Customer:</span> {selectedTransaction.depositor}
                  </div>
                </div>
              </div>

              {/* Split Configuration */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="splitCount">Split into parts</Label>
                  <Input
                    id="splitCount"
                    type="number"
                    min="2"
                    max="10"
                    value={splitCount}
                    onChange={(e) => {
                      setSplitCount(e.target.value);
                      handleSplitConfigChange();
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="daysBetween">Days between transactions</Label>
                  <Input
                    id="daysBetween"
                    type="number"
                    min="1"
                    max="30"
                    value={daysBetween}
                    onChange={(e) => {
                      setDaysBetween(e.target.value);
                      handleSplitConfigChange();
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sequence">Amount sequence</Label>
                  <Select
                    value={increasingSequence ? "increasing" : "decreasing"}
                    onValueChange={(value) => {
                      setIncreasingSequence(value === "increasing");
                      handleSplitConfigChange();
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="decreasing">
                        <div className="flex items-center gap-2">
                          <TrendingDown className="w-4 h-4" />
                          Decreasing
                        </div>
                      </SelectItem>
                      <SelectItem value="increasing">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4" />
                          Increasing
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Preview Table */}
              {splitPreview.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">Split Preview</h4>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Part</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Day Offset</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {splitPreview.map((preview, index) => (
                          <TableRow key={index}>
                            <TableCell>{index + 1}/{splitPreview.length}</TableCell>
                            <TableCell>{formatDate(preview.splitDate)}</TableCell>
                            <TableCell>
                              {preview.dayOffset === 0 ? 'Original' : `${preview.dayOffset} days`}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(preview.amount)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={cancelSplitTransaction}>
              Cancel
            </Button>
            <Button onClick={applySplitTransaction} disabled={splitPreview.length === 0}>
              Apply Split
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
