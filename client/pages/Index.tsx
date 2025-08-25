import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  FileText,
  TrendingUp,
  Calendar,
  CreditCard,
  Download,
  X,
  FileSpreadsheet,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import TransactionsTab from "@/components/TransactionsTab";
import MonthlySummaryTab from "@/components/MonthlySummaryTab";
import DataInputTab from "@/components/DataInputTab";
import CustomerTab from "@/components/CustomerTab";
import FinalTab from "@/components/FinalTab";
import BackupTab from "@/components/BackupTab";
import PDFUpload from "@/components/PDFUpload";
import ExcelUpload from "@/components/ExcelUpload";
import {
  exportToExcel,
  exportMonthlySummaryToExcel,
  exportCustomerSummaryToExcel,
} from "@/lib/excel-export";

// Sample transaction data from the PDF
const sampleTransactions = [
  {
    id: 1,
    date: "2025-04-01",
    particulars: "UPI Transfer to SURESH LAL",
    depositor: "SURESH LAL",
    withdrawals: 0,
    deposits: 5600,
    balance: 15790.41,
    type: "UPI",
  },
  {
    id: 2,
    date: "2025-04-02",
    particulars: "UPI Transfer to GOVIND RAM",
    depositor: "GOVIND RAM",
    withdrawals: 0,
    deposits: 15000,
    balance: 30790.41,
    type: "UPI",
  },
  {
    id: 3,
    date: "2025-04-02",
    particulars: "UPI Transfer to GOVIND RAM",
    depositor: "GOVIND RAM",
    withdrawals: 0,
    deposits: 12000,
    balance: 42790.41,
    type: "UPI",
  },
  {
    id: 4,
    date: "2025-04-02",
    particulars: "Transfer - MBS MPAY Transaction",
    depositor: "MBS MPAY",
    withdrawals: 32000,
    deposits: 0,
    balance: 10790.41,
    type: "TRANSFER",
  },
  {
    id: 5,
    date: "2025-04-04",
    particulars: "UPI Transfer to KEDAR RAM",
    depositor: "KEDAR RAM",
    withdrawals: 0,
    deposits: 4030,
    balance: 14820.41,
    type: "UPI",
  },
  {
    id: 6,
    date: "2025-04-04",
    particulars: "UPI Transfer to HARISH RAM",
    depositor: "HARISH RAM",
    withdrawals: 0,
    deposits: 2720,
    balance: 17540.41,
    type: "UPI",
  },
  {
    id: 7,
    date: "2025-04-05",
    particulars: "UPI Transfer to GOPAL RAM",
    depositor: "GOPAL RAM",
    withdrawals: 0,
    deposits: 2000,
    balance: 19540.41,
    type: "UPI",
  },
  {
    id: 8,
    date: "2025-04-06",
    particulars: "Transfer - MBS MPAY Transaction",
    depositor: "MBS MPAY",
    withdrawals: 9000,
    deposits: 0,
    balance: 10540.41,
    type: "TRANSFER",
  },
];

// Sample customer data
const sampleCustomers = [
  {
    id: 1,
    name: "SURESH LAL",
    totalDeposits: 5600,
    transactionCount: 1,
    lastTransaction: "2025-04-01",
    isActive: true,
  },
  {
    id: 2,
    name: "GOVIND RAM",
    totalDeposits: 67000,
    transactionCount: 8,
    lastTransaction: "2025-06-20",
    isActive: true,
  },
  {
    id: 3,
    name: "KEDAR RAM",
    totalDeposits: 4030,
    transactionCount: 1,
    lastTransaction: "2025-04-04",
    isActive: true,
  },
  {
    id: 4,
    name: "HARISH RAM",
    totalDeposits: 8700,
    transactionCount: 2,
    lastTransaction: "2025-06-28",
    isActive: true,
  },
  {
    id: 5,
    name: "GOPAL RAM",
    totalDeposits: 16000,
    transactionCount: 2,
    lastTransaction: "2025-04-13",
    isActive: true,
  },
];

export default function Index() {
  const [transactions, setTransactions] = useState(sampleTransactions);
  const [customers, setCustomers] = useState(sampleCustomers);
  const [activeTab, setActiveTab] = useState("transactions");
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importType, setImportType] = useState<"pdf" | "excel">("pdf");

  const handleExportTransactions = () => {
    exportToExcel(transactions, "all_transactions");
  };

  const handleExportMonthlySummary = () => {
    exportMonthlySummaryToExcel(transactions, "monthly_summary");
  };

  const handleExportCustomerSummary = () => {
    exportCustomerSummaryToExcel(transactions, "customer_summary");
  };

  const handleTransactionsImported = (importedTransactions: any[]) => {
    console.log("Importing transactions:", importedTransactions);

    // Merge with existing transactions
    const newTransactions = [...transactions, ...importedTransactions];

    // Sort by date
    newTransactions.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    setTransactions(newTransactions);

    // Update customers based on new transactions
    const customerMap = new Map();

    newTransactions.forEach((transaction) => {
      if (transaction.deposits > 0) {
        const existing = customerMap.get(transaction.depositor) || {
          id: Date.now() + Math.random(),
          name: transaction.depositor,
          totalDeposits: 0,
          transactionCount: 0,
          lastTransaction: transaction.date,
          isActive: true,
        };

        existing.totalDeposits += transaction.deposits;
        existing.transactionCount += 1;
        existing.lastTransaction = transaction.date;

        customerMap.set(transaction.depositor, existing);
      }
    });

    setCustomers(Array.from(customerMap.values()));
    setImportDialogOpen(false);

    // Show success message
    alert(`Successfully imported ${importedTransactions.length} transactions!`);
  };

  const handleImportClick = (type: "pdf" | "excel") => {
    setImportType(type);
    setImportDialogOpen(true);
  };

  const handleDeleteAllTransactions = () => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete ALL ${transactions.length} transactions? This action cannot be undone.`,
    );

    if (confirmDelete) {
      const doubleConfirm = window.confirm(
        "This will permanently delete all transaction data. Are you absolutely sure?",
      );

      if (doubleConfirm) {
        setTransactions([]);
        alert("All transactions have been deleted.");
      }
    }
  };

  // Calculate summary stats
  const totalDeposits = transactions.reduce((sum, t) => sum + t.deposits, 0);
  const totalWithdrawals = transactions.reduce(
    (sum, t) => sum + t.withdrawals,
    0,
  );
  const currentBalance =
    transactions.length > 0 ? transactions[transactions.length - 1].balance : 0;
  const uniqueDepositors = new Set(
    transactions.filter((t) => t.deposits > 0).map((t) => t.depositor),
  ).size;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Transaction Manager
              </h1>
              <p className="text-gray-600 text-lg">
                Manage your bank transactions and monitor cash flow
              </p>
            </div>
            <div className="flex gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="lg">
                    <Upload className="w-5 h-5 mr-2" />
                    Import Data
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleImportClick("pdf")}>
                    <FileText className="w-4 h-4 mr-2" />
                    Import PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleImportClick("excel")}>
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    Import Excel
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="lg">
                    <Download className="w-5 h-5 mr-2" />
                    Export Excel
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={handleExportTransactions}>
                    <FileText className="w-4 h-4 mr-2" />
                    All Transactions
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportMonthlySummary}>
                    <Calendar className="w-4 h-4 mr-2" />
                    Monthly Summary
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportCustomerSummary}>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Customer Summary
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="destructive"
                size="lg"
                onClick={handleDeleteAllTransactions}
                disabled={transactions.length === 0}
              >
                <X className="w-5 h-5 mr-2" />
                Delete All
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="bg-white shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Deposits
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold deposit-text">
                  ₹{totalDeposits.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  From {transactions.filter((t) => t.deposits > 0).length}{" "}
                  transactions
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Withdrawals
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold withdrawal-text">
                  ₹{totalWithdrawals.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  From {transactions.filter((t) => t.withdrawals > 0).length}{" "}
                  transactions
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Current Balance
                </CardTitle>
                <CreditCard className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold balance-text">
                  ₹{currentBalance.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  As of latest transaction
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Unique Depositors
                </CardTitle>
                <Calendar className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {uniqueDepositors}
                </div>
                <p className="text-xs text-muted-foreground">
                  Different customers
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Content Tabs */}
        <Card className="bg-white shadow-xl">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <CardHeader>
              <TabsList className="grid w-full grid-cols-6 h-12">
                <TabsTrigger value="transactions" className="text-base">
                  Transactions
                </TabsTrigger>
                <TabsTrigger value="final" className="text-base">
                  Final
                </TabsTrigger>
                <TabsTrigger value="monthly" className="text-base">
                  Monthly Summary
                </TabsTrigger>
                <TabsTrigger value="customers" className="text-base">
                  Customers
                </TabsTrigger>
                <TabsTrigger value="datainput" className="text-base">
                  Data Input
                </TabsTrigger>
                <TabsTrigger value="backup" className="text-base">
                  Backup
                </TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent>
              <TabsContent value="transactions" className="mt-0">
                <TransactionsTab
                  transactions={transactions}
                  setTransactions={setTransactions}
                  customers={customers}
                  setCustomers={setCustomers}
                />
              </TabsContent>

              <TabsContent value="final" className="mt-0">
                <FinalTab
                  transactions={transactions}
                  setTransactions={setTransactions}
                  customers={customers}
                  setCustomers={setCustomers}
                />
              </TabsContent>

              <TabsContent value="monthly" className="mt-0">
                <MonthlySummaryTab transactions={transactions} />
              </TabsContent>

              <TabsContent value="customers" className="mt-0">
                <CustomerTab
                  customers={customers}
                  setCustomers={setCustomers}
                />
              </TabsContent>

              <TabsContent value="datainput" className="mt-0">
                <DataInputTab />
              </TabsContent>

              <TabsContent value="backup" className="mt-0">
                <BackupTab
                  transactions={transactions}
                  setTransactions={setTransactions}
                  customers={customers}
                  setCustomers={setCustomers}
                />
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>

        {/* Import Dialog */}
        <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                Import {importType === "pdf" ? "PDF" : "Excel"} Data
              </DialogTitle>
              <DialogDescription>
                Upload your{" "}
                {importType === "pdf" ? "PDF statement" : "Excel file"} to
                import transaction data automatically.
              </DialogDescription>
            </DialogHeader>

            {importType === "pdf" ? (
              <PDFUpload onTransactionsImported={handleTransactionsImported} />
            ) : (
              <ExcelUpload
                onTransactionsImported={handleTransactionsImported}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
