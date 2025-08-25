import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  Download,
  Upload,
  Database,
  FileText,
  Save,
  AlertTriangle,
  CheckCircle,
  Trash2,
  RefreshCw,
} from "lucide-react";

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

interface BackupData {
  version: string;
  timestamp: string;
  transactions: Transaction[];
  customers: Customer[];
  metadata: {
    totalTransactions: number;
    totalCustomers: number;
    backupSource: string;
  };
}

interface BackupTabProps {
  transactions: Transaction[];
  setTransactions: (transactions: Transaction[]) => void;
  customers: Customer[];
  setCustomers: (customers: Customer[]) => void;
}

export default function BackupTab({
  transactions,
  setTransactions,
  customers,
  setCustomers,
}: BackupTabProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [backupJson, setBackupJson] = useState("");
  const [importResult, setImportResult] = useState<string | null>(null);
  const [lastBackupDate, setLastBackupDate] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-backup to localStorage every 5 minutes
  React.useEffect(() => {
    const interval = setInterval(() => {
      createAutoBackup();
    }, 5 * 60 * 1000); // 5 minutes

    // Create initial backup on component mount
    createAutoBackup();

    return () => clearInterval(interval);
  }, [transactions, customers]);

  const createAutoBackup = () => {
    try {
      const backupData: BackupData = {
        version: "1.0",
        timestamp: new Date().toISOString(),
        transactions,
        customers,
        metadata: {
          totalTransactions: transactions.length,
          totalCustomers: customers.length,
          backupSource: "auto-backup",
        },
      };

      localStorage.setItem("transaction-app-auto-backup", JSON.stringify(backupData));
      localStorage.setItem("transaction-app-last-backup", new Date().toISOString());
      
      const storedDate = localStorage.getItem("transaction-app-last-backup");
      if (storedDate) {
        setLastBackupDate(storedDate);
      }
    } catch (error) {
      console.error("Auto-backup failed:", error);
    }
  };

  const exportToFile = () => {
    setIsExporting(true);
    try {
      const backupData: BackupData = {
        version: "1.0",
        timestamp: new Date().toISOString(),
        transactions,
        customers,
        metadata: {
          totalTransactions: transactions.length,
          totalCustomers: customers.length,
          backupSource: "manual-export",
        },
      };

      const jsonString = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `transaction-backup-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setImportResult("✅ Backup exported successfully!")
      setTimeout(() => setImportResult(null), 3000);
    } catch (error) {
      setImportResult(`❌ Export failed: ${error instanceof Error ? error.message : "Unknown error"}`);
      setTimeout(() => setImportResult(null), 5000);
    } finally {
      setIsExporting(false);
    }
  };

  const importFromFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const result = e.target?.result as string;
        const backupData: BackupData = JSON.parse(result);

        // Validate backup data structure
        if (!backupData.version || !backupData.transactions || !backupData.customers) {
          throw new Error("Invalid backup file format");
        }

        // Validate data types
        if (!Array.isArray(backupData.transactions) || !Array.isArray(backupData.customers)) {
          throw new Error("Invalid data structure in backup file");
        }

        // Import data
        setTransactions(backupData.transactions);
        setCustomers(backupData.customers);

        setImportResult(
          `✅ Import successful! Restored ${backupData.transactions.length} transactions and ${backupData.customers.length} customers from backup created on ${new Date(backupData.timestamp).toLocaleString()}`
        );
        setTimeout(() => setImportResult(null), 8000);

        // Clear file input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } catch (error) {
        setImportResult(`❌ Import failed: ${error instanceof Error ? error.message : "Unknown error"}`);
        setTimeout(() => setImportResult(null), 5000);
      } finally {
        setIsImporting(false);
      }
    };

    reader.onerror = () => {
      setImportResult("❌ Failed to read file");
      setIsImporting(false);
      setTimeout(() => setImportResult(null), 5000);
    };

    reader.readAsText(file);
  };

  const importFromJson = () => {
    if (!backupJson.trim()) {
      setImportResult("❌ Please paste backup JSON data");
      setTimeout(() => setImportResult(null), 3000);
      return;
    }

    setIsImporting(true);
    try {
      const backupData: BackupData = JSON.parse(backupJson);

      // Validate backup data structure
      if (!backupData.version || !backupData.transactions || !backupData.customers) {
        throw new Error("Invalid backup JSON format");
      }

      // Import data
      setTransactions(backupData.transactions);
      setCustomers(backupData.customers);

      setImportResult(
        `✅ Import successful! Restored ${backupData.transactions.length} transactions and ${backupData.customers.length} customers`
      );
      setBackupJson("");
      setTimeout(() => setImportResult(null), 8000);
    } catch (error) {
      setImportResult(`❌ Import failed: ${error instanceof Error ? error.message : "Invalid JSON format"}`);
      setTimeout(() => setImportResult(null), 5000);
    } finally {
      setIsImporting(false);
    }
  };

  const restoreAutoBackup = () => {
    try {
      const storedBackup = localStorage.getItem("transaction-app-auto-backup");
      if (!storedBackup) {
        setImportResult("❌ No auto-backup found");
        setTimeout(() => setImportResult(null), 3000);
        return;
      }

      const backupData: BackupData = JSON.parse(storedBackup);
      setTransactions(backupData.transactions);
      setCustomers(backupData.customers);

      setImportResult(
        `✅ Restored from auto-backup! ${backupData.transactions.length} transactions and ${backupData.customers.length} customers restored`
      );
      setTimeout(() => setImportResult(null), 5000);
    } catch (error) {
      setImportResult(`❌ Failed to restore auto-backup: ${error instanceof Error ? error.message : "Unknown error"}`);
      setTimeout(() => setImportResult(null), 5000);
    }
  };

  const clearAllData = () => {
    if (confirm("⚠️ Are you sure you want to clear ALL data? This action cannot be undone!\n\nThis will delete:\n- All transactions\n- All customers\n- All data\n\nClick OK to confirm or Cancel to abort.")) {
      setTransactions([]);
      setCustomers([]);
      setImportResult("🗑️ All data cleared successfully");
      setTimeout(() => setImportResult(null), 3000);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-IN");
  };

  const generateSampleData = () => {
    const sampleTransactions: Transaction[] = [
      {
        id: Date.now() + 1,
        date: "2024-01-15",
        particulars: "MPAYUPITRTR123456 12345 RAHUL KUMARSBINXXX10",
        depositor: "RAHUL KUMAR",
        withdrawals: 0,
        deposits: 5000,
        balance: 5000,
        type: "UPI"
      },
      {
        id: Date.now() + 2,
        date: "2024-01-16",
        particulars: "TRANSFER FROM SAVINGS ACCOUNT",
        depositor: "PRIYA SHARMA",
        withdrawals: 0,
        deposits: 3000,
        balance: 8000,
        type: "TRANSFER"
      }
    ];

    const sampleCustomers: Customer[] = [
      {
        id: Date.now() + 1,
        name: "RAHUL KUMAR",
        totalDeposits: 5000,
        transactionCount: 1,
        lastTransaction: "2024-01-15",
        isActive: true
      },
      {
        id: Date.now() + 2,
        name: "PRIYA SHARMA",
        totalDeposits: 3000,
        transactionCount: 1,
        lastTransaction: "2024-01-16",
        isActive: true
      }
    ];

    setTransactions([...transactions, ...sampleTransactions]);
    setCustomers([...customers, ...sampleCustomers]);
    
    setImportResult("✅ Sample data added successfully!");
    setTimeout(() => setImportResult(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-2xl font-bold">Data Backup & Restore</h3>
        <p className="text-muted-foreground">
          Backup your data to files, restore from backups, and manage your database
        </p>
      </div>

      {/* Status */}
      {importResult && (
        <Alert className={importResult.includes("✅") ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Status</AlertTitle>
          <AlertDescription>{importResult}</AlertDescription>
        </Alert>
      )}

      {/* Current Data Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <Database className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{transactions.length}</div>
            <p className="text-xs text-muted-foreground">Total records</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customers</CardTitle>
            <Database className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{customers.length}</div>
            <p className="text-xs text-muted-foreground">Total customers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Auto-Backup</CardTitle>
            <RefreshCw className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold text-purple-600">
              {lastBackupDate ? formatDate(lastBackupDate) : "Never"}
            </div>
            <p className="text-xs text-muted-foreground">Automatic backup</p>
          </CardContent>
        </Card>
      </div>

      {/* Export Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export Data
          </CardTitle>
          <CardDescription>
            Download all your data as a backup file
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button 
              onClick={exportToFile} 
              disabled={isExporting}
              className="flex-1"
            >
              {isExporting ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Export to File
            </Button>
            <Button 
              onClick={createAutoBackup}
              variant="outline"
            >
              <Save className="w-4 h-4 mr-2" />
              Create Manual Backup
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            💾 Auto-backup runs every 5 minutes and saves to browser storage
          </p>
        </CardContent>
      </Card>

      {/* Import Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Import Data
          </CardTitle>
          <CardDescription>
            Restore data from backup files or JSON
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* File Import */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Import from File</label>
            <div className="flex gap-2">
              <input
                type="file"
                accept=".json"
                onChange={importFromFile}
                className="hidden"
                ref={fileInputRef}
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting}
                variant="outline"
                className="flex-1"
              >
                {isImporting ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                Choose Backup File
              </Button>
              <Button
                onClick={restoreAutoBackup}
                variant="outline"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Restore Auto-Backup
              </Button>
            </div>
          </div>

          {/* JSON Import */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Import from JSON</label>
            <Textarea
              value={backupJson}
              onChange={(e) => setBackupJson(e.target.value)}
              placeholder="Paste backup JSON data here..."
              rows={6}
            />
            <Button
              onClick={importFromJson}
              disabled={isImporting || !backupJson.trim()}
              className="w-full"
            >
              {isImporting ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Upload className="w-4 h-4 mr-2" />
              )}
              Import from JSON
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Data Management
          </CardTitle>
          <CardDescription>
            Manage your database and sample data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button
              onClick={generateSampleData}
              variant="outline"
              className="flex-1"
            >
              <FileText className="w-4 h-4 mr-2" />
              Add Sample Data
            </Button>
            <Button
              onClick={clearAllData}
              variant="destructive"
              className="flex-1"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All Data
            </Button>
          </div>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Data Safety</AlertTitle>
            <AlertDescription>
              Always export a backup before clearing data. Auto-backups are stored in browser storage and may be lost if you clear browser data.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
