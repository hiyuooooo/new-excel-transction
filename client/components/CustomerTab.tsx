import React, { useState, useRef, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  Plus,
  Search,
  Pencil,
  Save,
  X,
  Users,
  FileSpreadsheet,
  Loader2,
  Type,
} from "lucide-react";

interface Customer {
  id: number;
  name: string;
  totalDeposits: number;
  transactionCount: number;
  lastTransaction: string;
  isActive: boolean;
}

interface CustomerTabProps {
  customers: Customer[];
  setCustomers: (customers: Customer[]) => void;
}

export default function CustomerTab({
  customers,
  setCustomers,
}: CustomerTabProps) {

  // Validate and fix duplicate IDs on component mount
  React.useEffect(() => {
    const seenIds = new Set<number>();
    const duplicatesFound = customers.some(customer => {
      if (seenIds.has(customer.id)) {
        return true;
      }
      seenIds.add(customer.id);
      return false;
    });

    if (duplicatesFound) {
      console.warn('Duplicate customer IDs detected, fixing...');
      const fixedCustomers = customers.map((customer, index) => ({
        ...customer,
        id: Date.now() + index // Assign unique timestamp-based IDs
      }));
      setCustomers(fixedCustomers);
    }
  }, []);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<Partial<Customer>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [showBulkInput, setShowBulkInput] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50); // Limit to 50 items per page
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleEdit = (customer: Customer) => {
    setEditingId(customer.id);
    setEditData(customer);
  };

  const handleSave = () => {
    if (editingId && editData) {
      // Convert name to uppercase
      const normalizedData = {
        ...editData,
        name: editData.name
          ? editData.name.toUpperCase().trim()
          : editData.name,
      };

      const updatedCustomers = customers.map((c) =>
        c.id === editingId ? { ...c, ...normalizedData } : c,
      );
      setCustomers(updatedCustomers);
      setEditingId(null);
      setEditData({});
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleDelete = (id: number) => {
    const updatedCustomers = customers.filter((c) => c.id !== id);
    setCustomers(updatedCustomers);
  };

  const handleAddNew = () => {
    // Generate unique ID using timestamp + random to prevent duplicates
    const uniqueId = Date.now() + Math.floor(Math.random() * 1000);
    const newCustomer: Customer = {
      id: uniqueId,
      name: "",
      totalDeposits: 0,
      transactionCount: 0,
      lastTransaction: new Date().toISOString().split("T")[0],
      isActive: true,
    };
    setCustomers([...customers, newCustomer]);
    setEditingId(newCustomer.id);
    setEditData(newCustomer);
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log(
      "File selected:",
      file.name,
      "Type:",
      file.type,
      "Size:",
      file.size,
    );

    // For now, we'll focus on CSV files since XLS requires special libraries
    if (file.type === "text/csv" || file.name.endsWith(".csv")) {
      setIsImporting(true);

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          console.log("File content preview:", text.substring(0, 200));

          const lines = text.split("\n").filter((line) => line.trim());
          console.log("Total lines found:", lines.length);

          const importedCustomers: Customer[] = [];

          // Process each line (skip first line if it looks like headers)
          const startIndex =
            lines[0] &&
            (lines[0].toLowerCase().includes("name") ||
              lines[0].toLowerCase().includes("customer"))
              ? 1
              : 0;

          for (let i = startIndex; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line) {
              // Handle both CSV and tab-delimited data
              const values = line.includes("\t")
                ? line.split("\t").map((v) => v.trim().replace(/['"]/g, ""))
                : line.split(",").map((v) => v.trim().replace(/['"]/g, ""));

              console.log(`Line ${i}:`, values);

              if (values.length >= 1 && values[0]) {
                let customerName = values[0].trim();

                // More robust cleaning and validation
                customerName = customerName
                  .replace(/['"]/g, "")
                  .trim()
                  .toUpperCase();

                // Skip if empty, too short, or contains invalid characters
                if (
                  customerName &&
                  customerName.length >= 2 &&
                  customerName.length <= 100 &&
                  !customerName.includes("NAME") &&
                  !customerName.includes("CUSTOMER") &&
                  !customerName.includes("PARTY") &&
                  !/^[\s\-_,.]*$/.test(customerName) && // Skip lines with only punctuation/spaces
                  !/^\d+$/.test(customerName)
                ) {
                  // Skip lines that are just numbers

                  // Check if customer already exists (case insensitive)
                  const existingCustomer = customers.find(
                    (c) => c.name.toUpperCase().trim() === customerName.trim(),
                  );

                  const alreadyInImported = importedCustomers.find(
                    (c) => c.name.toUpperCase().trim() === customerName.trim(),
                  );

                  if (!existingCustomer && !alreadyInImported) {
                  // Generate unique ID using timestamp + counter to prevent duplicates
                  const uniqueId = Date.now() + importedCustomers.length;
                  const customer: Customer = {
                    id: uniqueId,
                    name: customerName,
                    totalDeposits: 0,
                    transactionCount: 0,
                    lastTransaction: new Date().toISOString().split("T")[0],
                    isActive: true,
                  };
                  importedCustomers.push(customer);
                  console.log("Added customer:", customerName);
                  } else {
                    console.log("Skipped duplicate customer:", customerName);
                  }
                } else {
                  console.log("Skipped invalid entry:", customerName);
                }
              }
            }
          }

          console.log("Total customers to import:", importedCustomers.length);

          if (importedCustomers.length > 0) {
            setCustomers([...customers, ...importedCustomers]);
            alert(
              `Successfully imported ${importedCustomers.length} new customers`,
            );
          } else {
            alert(
              "No new customer data found in the file. Please check:\n- File has customer names in first column\n- Names are not already in the database\n- File format is correct",
            );
          }
        } catch (error) {
          console.error("Error parsing file:", error);
          alert(
            `Error reading the file: ${error instanceof Error ? error.message : "Unknown error"}`,
          );
        } finally {
          setIsImporting(false);
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        }
      };

      reader.onerror = () => {
        setIsImporting(false);
        alert("Error reading the file. Please try again.");
      };

      reader.readAsText(file);
    } else if (file.name.endsWith(".xls") || file.name.endsWith(".xlsx")) {
      setIsImporting(false);
      alert(
        "XLS/XLSX files are not supported yet. Please save your file as CSV format:\n1. Open in Excel\n2. File → Save As\n3. Choose CSV format\n4. Upload the CSV file",
      );
    } else {
      alert(
        "Please select a CSV file. For XLS files, please save as CSV format first.",
      );
    }
  };

  const handleImportButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleBulkTextImport = () => {
    if (!bulkText.trim()) {
      alert("Please enter customer names");
      return;
    }

    const lines = bulkText.split("\n").filter((line) => line.trim());
    const importedCustomers: Customer[] = [];

    lines.forEach((line) => {
      let customerName = line.trim().replace(/['"]/g, "").toUpperCase();

      if (
        customerName &&
        customerName.length >= 2 &&
        customerName.length <= 100 &&
        !customerName.includes("NAME") &&
        !customerName.includes("CUSTOMER") &&
        !/^[\s\-_,.]*$/.test(customerName) &&
        !/^\d+$/.test(customerName)
      ) {
        // Check if customer already exists (case insensitive)
        const existingCustomer = customers.find(
          (c) => c.name.toUpperCase().trim() === customerName.trim(),
        );

        const alreadyInImported = importedCustomers.find(
          (c) => c.name.toUpperCase().trim() === customerName.trim(),
        );

        if (!existingCustomer && !alreadyInImported) {
          // Generate unique ID using timestamp + counter to prevent duplicates
          const uniqueId = Date.now() + importedCustomers.length;
          const customer: Customer = {
            id: uniqueId,
            name: customerName,
            totalDeposits: 0,
            transactionCount: 0,
            lastTransaction: new Date().toISOString().split("T")[0],
            isActive: true,
          };
          importedCustomers.push(customer);
        }
      }
    });

    if (importedCustomers.length > 0) {
      setCustomers([...customers, ...importedCustomers]);
      setBulkText("");
      setShowBulkInput(false);
      alert(`Successfully added ${importedCustomers.length} new customers`);
    } else {
      alert(
        "No new customers to add. Names may already exist in the database.",
      );
    }
  };

  // Filter customers based on search with performance optimization
  const filteredCustomers = useMemo(() => {
    if (!searchTerm) return customers;
    return customers.filter((customer) =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [customers, searchTerm]);

  // Pagination logic
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const paginatedCustomers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredCustomers.slice(startIndex, endIndex);
  }, [filteredCustomers, currentPage, itemsPerPage]);

  // Reset to first page when search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN");
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">Customer Management</h3>
          <p className="text-muted-foreground">
            Manage customer database and import customer information
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileImport}
            className="hidden"
            ref={fileInputRef}
          />
          <Button
            onClick={handleImportButtonClick}
            variant="outline"
            disabled={isImporting}
          >
            {isImporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Import CSV
              </>
            )}
          </Button>
          <Button
            onClick={() => setShowBulkInput(!showBulkInput)}
            variant="outline"
          >
            <Type className="w-4 h-4 mr-2" />
            Bulk Add
          </Button>
          <Button onClick={handleAddNew}>
            <Plus className="w-4 h-4 mr-2" />
            Add One
          </Button>
        </div>
      </div>

      {/* Bulk Text Input */}
      {showBulkInput && (
        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-green-900 flex items-center gap-2">
              <Type className="w-5 h-5" />
              Bulk Add Customers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-green-800">
                Enter customer names, one per line:
              </p>
              <Textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder="SURESH LAL&#10;GOVIND RAM&#10;KEDAR RAM&#10;HARISH RAM"
                className="min-h-32"
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleBulkTextImport}
                  disabled={!bulkText.trim()}
                >
                  Add All Customers
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setBulkText("");
                    setShowBulkInput(false);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Import Instructions */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            CSV Import Instructions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <p className="text-blue-800 font-medium mb-2">
                Step 1: If you have an XLS file, convert it to CSV:
              </p>
              <ol className="text-sm text-blue-700 list-decimal list-inside space-y-1">
                <li>Open your XLS file in Excel</li>
                <li>Click File → Save As</li>
                <li>Choose "CSV (Comma delimited)" format</li>
                <li>Save the file</li>
              </ol>
            </div>

            <div>
              <p className="text-blue-800 font-medium mb-2">
                Step 2: CSV format should have customer names in first column:
              </p>
              <div className="font-mono text-sm bg-white p-3 rounded border">
                Name
                <br />
                SURESH LAL
                <br />
                GOVIND RAM
                <br />
                KEDAR RAM
              </div>
            </div>

            <p className="text-sm text-blue-700">
              <strong>Note:</strong> Only CSV format is supported. The system
              will automatically skip duplicate names.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Search customers by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Customer Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Customers
            </CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {customers.length}
            </div>
            <p className="text-xs text-muted-foreground">In database</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Customers
            </CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {customers.filter((c) => c.isActive).length}
            </div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              With Transactions
            </CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {customers.filter((c) => c.transactionCount > 0).length}
            </div>
            <p className="text-xs text-muted-foreground">Have made deposits</p>
          </CardContent>
        </Card>
      </div>

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Database ({filteredCustomers.length})</CardTitle>
          <CardDescription>
            Manage customer information and contact details - Page {currentPage}{" "}
            of {totalPages}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer Name</TableHead>
                  <TableHead className="text-right">Total Deposits</TableHead>
                  <TableHead className="text-right">Transactions</TableHead>
                  <TableHead className="text-right">Last Transaction</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedCustomers.map((customer, index) => (
                  <TableRow key={`customer-${customer.id}-${index}`} className="hover:bg-gray-50">
                    <TableCell>
                      {editingId === customer.id ? (
                        <Input
                          value={editData.name || customer.name}
                          onChange={(e) =>
                            setEditData({ ...editData, name: e.target.value })
                          }
                          className="w-48"
                          placeholder="Customer name"
                        />
                      ) : (
                        <span className="font-medium text-blue-700">
                          {customer.name}
                        </span>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      <span className="deposit-text font-medium">
                        {formatCurrency(customer.totalDeposits)}
                      </span>
                    </TableCell>

                    <TableCell className="text-right">
                      {customer.transactionCount}
                    </TableCell>

                    <TableCell className="text-right">
                      {formatDate(customer.lastTransaction)}
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant={customer.isActive ? "default" : "secondary"}
                      >
                        {customer.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-center">
                      {editingId === customer.id ? (
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
                            onClick={() => handleEdit(customer)}
                            variant="outline"
                          >
                            <Pencil className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleDelete(customer.id)}
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

          {filteredCustomers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No customers found matching your search criteria.
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-500">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                {Math.min(currentPage * itemsPerPage, filteredCustomers.length)}{" "}
                of {filteredCustomers.length} customers
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
    </div>
  );
}
