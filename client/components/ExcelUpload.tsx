import React, { useCallback, useState, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import * as XLSX from "xlsx";

interface ExcelUploadProps {
  onTransactionsImported: (transactions: any[]) => void;
}

export default function ExcelUpload({
  onTransactionsImported,
}: ExcelUploadProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "processing" | "success" | "error"
  >("idle");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file && (file.name.endsWith(".xlsx") || file.name.endsWith(".xls"))) {
        setIsProcessing(true);
        setUploadStatus("processing");
        processExcelFile(file);
      } else if (file) {
        setUploadStatus("error");
        alert("Please select a valid Excel file (.xlsx or .xls).");
      }
    },
    [],
  );

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const processExcelFile = async (file: File) => {
    console.log(
      "Processing Excel file:",
      file.name,
      "Size:",
      file.size,
      "bytes",
    );

    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });

      console.log("Excel workbook sheets:", workbook.SheetNames);

      // Try to find the sheet with transaction data
      let worksheet = null;
      let sheetName = "";

      // Look for sheets that might contain transaction data
      const possibleSheetNames = workbook.SheetNames.filter(
        (name) =>
          name.toLowerCase().includes("transaction") ||
          name.toLowerCase().includes("statement") ||
          name.toLowerCase().includes("data") ||
          name === workbook.SheetNames[0], // fallback to first sheet
      );

      if (possibleSheetNames.length > 0) {
        sheetName = possibleSheetNames[0];
        worksheet = workbook.Sheets[sheetName];
      } else {
        // Use the first sheet as fallback
        sheetName = workbook.SheetNames[0];
        worksheet = workbook.Sheets[sheetName];
      }

      console.log("Using sheet:", sheetName);

      // Convert to JSON with header detection
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: "",
        raw: false,
      }) as any[][];

      console.log("Raw Excel data:", jsonData.slice(0, 5));

      const transactions = parseTransactionsFromExcelData(jsonData);

      if (transactions.length === 0) {
        throw new Error(
          "No valid transactions found in Excel file. Please ensure the file contains columns like Date, Amount, Depositor/Customer, etc.",
        );
      }

      console.log(
        "Successfully parsed",
        transactions.length,
        "transactions from Excel",
      );
      setUploadStatus("success");
      setIsProcessing(false);
      onTransactionsImported(transactions);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Error processing Excel:", error);
      setUploadStatus("error");
      setIsProcessing(false);

      let errorMessage =
        "Error reading Excel file: " + (error as Error).message;
      errorMessage += "\n\nTips:";
      errorMessage += "\n• Make sure the Excel file contains transaction data";
      errorMessage +=
        "\n• Include columns like Date, Amount, Customer/Depositor";
      errorMessage +=
        "\n• Ensure dates are in a recognizable format (DD/MM/YYYY or similar)";

      alert(errorMessage);
    }
  };

  const parseTransactionsFromExcelData = (data: any[][]) => {
    const transactions = [];

    if (data.length === 0) return transactions;

    // Find header row (look for common header patterns)
    let headerRowIndex = 0;
    let headers: string[] = [];

    for (let i = 0; i < Math.min(5, data.length); i++) {
      const row = data[i];
      const rowStr = row.join("").toLowerCase();

      if (
        rowStr.includes("date") ||
        rowStr.includes("amount") ||
        rowStr.includes("depositor") ||
        rowStr.includes("customer") ||
        rowStr.includes("transaction") ||
        rowStr.includes("particulars")
      ) {
        headerRowIndex = i;
        headers = row.map((cell) => String(cell).trim().toLowerCase());
        break;
      }
    }

    console.log("Found headers at row", headerRowIndex, ":", headers);

    // If no clear headers found, try to infer from data structure
    if (headers.length === 0 && data.length > 0) {
      console.log("No headers found, using default mapping");
      headers = data[0].map((_, index) => `column_${index}`);
      headerRowIndex = 0;
    }

    // Map column indices
    const columnMap = {
      date: findColumnIndex(headers, [
        "date",
        "transaction date",
        "trans date",
      ]),
      particulars: findColumnIndex(headers, [
        "particulars",
        "description",
        "details",
        "narration",
        "reference",
      ]),
      depositor: findColumnIndex(headers, [
        "depositor",
        "customer",
        "name",
        "customer name",
        "from",
        "to",
      ]),
      amount: findColumnIndex(headers, [
        "amount",
        "transaction amount",
        "credit",
        "debit",
      ]),
      deposits: findColumnIndex(headers, [
        "deposits",
        "credit",
        "cr",
        "credit amount",
      ]),
      withdrawals: findColumnIndex(headers, [
        "withdrawals",
        "debit",
        "dr",
        "debit amount",
      ]),
      balance: findColumnIndex(headers, [
        "balance",
        "closing balance",
        "running balance",
      ]),
      type: findColumnIndex(headers, [
        "type",
        "transaction type",
        "mode",
        "channel",
      ]),
    };

    console.log("Column mapping:", columnMap);

    // Parse data rows
    for (let i = headerRowIndex + 1; i < data.length; i++) {
      const row = data[i];

      if (
        row.length === 0 ||
        row.every((cell) => !cell || String(cell).trim() === "")
      ) {
        continue; // Skip empty rows
      }

      try {
        const transaction = parseTransactionRow(row, columnMap, i);
        if (transaction) {
          const transactionWithId = {
            ...transaction,
            id: Date.now() + i,
          };
          transactions.push(transactionWithId);
        }
      } catch (error) {
        console.warn("Failed to parse row", i, ":", row, error);
      }
    }

    console.log("Parsed", transactions.length, "transactions from Excel");
    return transactions;
  };

  const findColumnIndex = (headers: string[], patterns: string[]): number => {
    for (const pattern of patterns) {
      const index = headers.findIndex(
        (header) => header.includes(pattern) || pattern.includes(header),
      );
      if (index !== -1) return index;
    }
    return -1;
  };

  const parseTransactionRow = (
    row: any[],
    columnMap: any,
    rowIndex: number,
  ) => {
    const getValue = (columnIndex: number) => {
      if (columnIndex === -1 || columnIndex >= row.length) return "";
      const value = row[columnIndex];
      return value ? String(value).trim() : "";
    };

    const getNumericValue = (columnIndex: number): number => {
      const value = getValue(columnIndex);
      if (!value) return 0;

      // Remove currency symbols and commas
      const cleanValue = value.replace(/[₹$,\s]/g, "");
      const numeric = parseFloat(cleanValue);
      return isNaN(numeric) ? 0 : numeric;
    };

    // Extract date
    let date = getValue(columnMap.date);
    if (!date) {
      // Try to find date in any column
      for (let i = 0; i < row.length; i++) {
        const cellValue = String(row[i] || "");
        if (cellValue.match(/\d{1,2}[-/]\d{1,2}[-/]\d{2,4}/)) {
          date = cellValue;
          break;
        }
      }
    }

    // Format date
    const formattedDate = formatDate(date);

    // Extract amounts
    let deposits = 0;
    let withdrawals = 0;

    if (columnMap.deposits !== -1) {
      deposits = getNumericValue(columnMap.deposits);
    }

    if (columnMap.withdrawals !== -1) {
      withdrawals = getNumericValue(columnMap.withdrawals);
    }

    // If no separate deposit/withdrawal columns, try to get from amount column
    if (deposits === 0 && withdrawals === 0 && columnMap.amount !== -1) {
      const amount = getNumericValue(columnMap.amount);
      if (amount !== 0) {
        // Determine if it's deposit or withdrawal based on context
        const particulars = getValue(columnMap.particulars).toLowerCase();
        const isWithdrawal =
          particulars.includes("withdraw") ||
          particulars.includes("debit") ||
          particulars.includes("payment") ||
          particulars.includes("transfer out") ||
          amount < 0;

        if (isWithdrawal) {
          withdrawals = Math.abs(amount);
        } else {
          deposits = Math.abs(amount);
        }
      }
    }

    // Skip rows with no meaningful amount
    if (deposits === 0 && withdrawals === 0) {
      return null;
    }

    const particulars =
      getValue(columnMap.particulars) || `Transaction Row ${rowIndex + 1}`;
    const depositor =
      getValue(columnMap.depositor) ||
      extractDepositorFromParticulars(particulars);
    const balance = getNumericValue(columnMap.balance);

    // Determine transaction type
    let type = getValue(columnMap.type).toUpperCase();
    if (!type) {
      if (particulars.toUpperCase().includes("UPI")) type = "UPI";
      else if (particulars.toUpperCase().includes("TRANSFER"))
        type = "TRANSFER";
      else if (particulars.toUpperCase().includes("NEFT")) type = "NEFT";
      else if (particulars.toUpperCase().includes("RTGS")) type = "RTGS";
      else type = "OTHER";
    }

    return {
      date: formattedDate,
      particulars: particulars.substring(0, 100),
      depositor: depositor || "Unknown Customer",
      deposits,
      withdrawals,
      balance,
      type,
    };
  };

  const extractDepositorFromParticulars = (particulars: string): string => {
    // Improved patterns to correctly extract customer names

    // Extract depositor name with multiple patterns
    if (particulars.includes("MPAY")) {
      // Pattern 1: Skip transaction identifiers like UPITRTR and look for actual names
      // Example: MPAYUPITRTR5222741 19801 NAVEENKUMARSBINXXX30 -> NAVEENKUMAR
      let mpayPattern =
        /MPAY(?:UPITRTR|UPI|TRTR)?\d+\s+\d+\s+([A-Z][A-Z\s]+?)(?:SBIN|PUNB|BARB|JIOPXXX|UCBA|IBKL|XXX)/i;
      let depositorMatch = particulars.match(mpayPattern);

      if (depositorMatch) {
        const name = depositorMatch[1].trim().replace(/\s+/g, " ");
        return name.replace(/(?:SBIN|PUNB|BARB|UCBA|IBKL|JIOPXXX)XX$/i, '').trim();
      } else {
        // Pattern 2: Look for names after any MPAY transaction identifier and numbers
        mpayPattern = /MPAY\w*\d+\s+\d*\s*([A-Z][A-Z\s]{2,20}?)(?:SBIN|PUNB|BARB|JIOPXXX|UCBA|IBKL|XXX|\d|$)/i;
        depositorMatch = particulars.match(mpayPattern);
        if (depositorMatch) {
          const name = depositorMatch[1].trim().replace(/\s+/g, " ");
          return name.replace(/(?:SBIN|PUNB|BARB|UCBA|IBKL|JIOPXXX)XX$/i, '').trim();
        }

        // Pattern 3: Fallback - look for names after MPAY but skip common transaction codes
        mpayPattern = /MPAY(?:UPITRTR|UPI|TRTR)?.*?\d+.*?([A-Z][A-Z\s]{3,20}?)(?:[A-Z]{3,4}XXX|\d|$)/i;
        depositorMatch = particulars.match(mpayPattern);
        if (depositorMatch) {
          const name = depositorMatch[1].trim().replace(/\s+/g, " ");
          // Skip transaction identifiers
          if (!name.match(/^(UPITRTR|TRTR|UPI|MPAY)$/i)) {
            return name.replace(/(?:SBIN|PUNB|BARB|UCBA|IBKL|JIOPXXX)XX$/i, '').trim();
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
        // Clean bank codes from the end of names
        const cleanedName = name.replace(/(?:SBIN|PUNB|BARB|UCBA|IBKL|JIOPXXX)XX$/i, '').trim();

        if (
          !cleanedName.match(
            /^(UPITRTR|TRTR|MPAY|UPI|TRANSFER|NEFT|RTGS|XXX|SBIN|PUNB|BARB|UCBA|IBKL|JIOPXXX)$/i,
          ) &&
          cleanedName.length > 2 &&
          !cleanedName.match(/^\d+$/) // Exclude pure numbers
        ) {
          return cleanedName;
        }
      }
    }

    return "Unknown Customer";
  };

  const formatDate = (dateStr: string): string => {
    if (!dateStr) return new Date().toISOString().split("T")[0];

    // Try various date formats
    const cleanDate = dateStr.replace(/[^\d-/\s]/g, "").trim();

    // Handle Excel date numbers
    if (/^\d{5}$/.test(cleanDate)) {
      // Excel date serial number
      const excelDate = new Date(1900, 0, parseInt(cleanDate) - 1);
      return excelDate.toISOString().split("T")[0];
    }

    // Handle DD/MM/YYYY or DD-MM-YYYY
    if (/^\d{1,2}[-/]\d{1,2}[-/]\d{2,4}$/.test(cleanDate)) {
      const parts = cleanDate.split(/[-/]/);
      if (parts.length === 3) {
        const day = parts[0].padStart(2, "0");
        const month = parts[1].padStart(2, "0");
        let year = parts[2];

        if (year.length === 2) {
          year = parseInt(year) > 50 ? "19" + year : "20" + year;
        }

        return `${year}-${month}-${day}`;
      }
    }

    // Handle YYYY-MM-DD
    if (/^\d{4}[-/]\d{1,2}[-/]\d{1,2}$/.test(cleanDate)) {
      const parts = cleanDate.split(/[-/]/);
      if (parts.length === 3) {
        return `${parts[0]}-${parts[1].padStart(2, "0")}-${parts[2].padStart(2, "0")}`;
      }
    }

    // Fallback to today's date
    return new Date().toISOString().split("T")[0];
  };

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
  }, []);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (
      files.length > 0 &&
      (files[0].name.endsWith(".xlsx") || files[0].name.endsWith(".xls"))
    ) {
      setIsProcessing(true);
      setUploadStatus("processing");
      processExcelFile(files[0]);
    }
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Import Excel File
        </CardTitle>
        <CardDescription>
          Upload your transaction data in Excel format (.xlsx or .xls) to
          automatically import records
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            uploadStatus === "processing"
              ? "border-blue-300 bg-blue-50"
              : uploadStatus === "success"
                ? "border-green-300 bg-green-50"
                : uploadStatus === "error"
                  ? "border-red-300 bg-red-50"
                  : "border-gray-300 hover:border-primary"
          }`}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {isProcessing ? (
            <Loader2 className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-spin" />
          ) : uploadStatus === "success" ? (
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          ) : uploadStatus === "error" ? (
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          ) : (
            <FileSpreadsheet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          )}

          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {isProcessing
              ? "Processing Excel..."
              : uploadStatus === "success"
                ? "Excel imported successfully!"
                : uploadStatus === "error"
                  ? "Upload failed"
                  : "Drop your Excel file here or click to browse"}
          </h3>
          <p className="text-gray-500 mb-4">
            {isProcessing
              ? "Extracting transaction data from your Excel file"
              : uploadStatus === "success"
                ? "Transaction data has been added to your records"
                : uploadStatus === "error"
                  ? "Please try again with a valid Excel file"
                  : "Supports .xlsx and .xls files with transaction data"}
          </p>

          <Input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileSelect}
            className="hidden"
            ref={fileInputRef}
            disabled={isProcessing}
          />

          <Button
            onClick={handleButtonClick}
            disabled={isProcessing}
            className="cursor-pointer"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Choose Excel File
              </>
            )}
          </Button>

          <div className="mt-4 flex flex-wrap gap-2 justify-center">
            <Badge variant="outline">
              <CheckCircle className="w-3 h-3 mr-1" />
              .xlsx Support
            </Badge>
            <Badge variant="outline">
              <CheckCircle className="w-3 h-3 mr-1" />
              .xls Support
            </Badge>
            <Badge variant="outline">
              <CheckCircle className="w-3 h-3 mr-1" />
              Auto Header Detection
            </Badge>
            <Badge variant="outline">
              <CheckCircle className="w-3 h-3 mr-1" />
              Smart Parsing
            </Badge>
          </div>
        </div>

        <div className="mt-4 p-3 bg-green-50 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-green-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-green-900">
                Excel Processing Features:
              </p>
              <ul className="text-green-700 mt-1 space-y-1">
                <li>• Automatically detects headers in your Excel file</li>
                <li>
                  • Supports multiple date formats (DD/MM/YYYY, YYYY-MM-DD,
                  etc.)
                </li>
                <li>• Extracts customer names from transaction descriptions</li>
                <li>
                  • Handles both separate deposit/withdrawal columns or combined
                  amounts
                </li>
                <li>• Works with .xlsx and .xls file formats</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-start gap-2">
            <FileSpreadsheet className="w-4 h-4 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-900">
                Expected Excel Columns:
              </p>
              <p className="text-blue-700 mt-1">
                Date, Amount/Deposits/Withdrawals, Customer/Depositor,
                Description/Particulars, Type (optional)
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
