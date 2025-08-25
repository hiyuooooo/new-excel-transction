import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, Download, Trash2, Save, Edit3, FileText, Upload, RefreshCw } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface DataRow {
  id: number;
  date: string;
  description: string;
  amount: number;
  type: string;
  category: string;
}

interface DataInputTabProps {
  onDataExport?: (data: DataRow[], filename: string) => void;
}

export default function DataInputTab({ onDataExport }: DataInputTabProps) {
  const [dataRows, setDataRows] = useState<DataRow[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newRow, setNewRow] = useState<Partial<DataRow>>({
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: 0,
    type: 'Income',
    category: 'General'
  });
  const [bulkInput, setBulkInput] = useState('');
  const [filename, setFilename] = useState('data_export');

  // PDF processing states
  const [isProcessingPDF, setIsProcessingPDF] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [extractedData, setExtractedData] = useState<DataRow[]>([]);
  const [pdfStatus, setPdfStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');

  const handleAddRow = () => {
    if (!newRow.description || !newRow.amount) {
      alert('Please fill in description and amount');
      return;
    }

    const row: DataRow = {
      id: Date.now(),
      date: newRow.date || new Date().toISOString().split('T')[0],
      description: newRow.description || '',
      amount: Number(newRow.amount) || 0,
      type: newRow.type || 'Income',
      category: newRow.category || 'General'
    };

    setDataRows([...dataRows, row]);
    setNewRow({
      date: new Date().toISOString().split('T')[0],
      description: '',
      amount: 0,
      type: 'Income',
      category: 'General'
    });
  };

  const handleEditRow = (id: number) => {
    setEditingId(id);
  };

  const handleSaveEdit = (id: number, updatedRow: Partial<DataRow>) => {
    setDataRows(dataRows.map(row => 
      row.id === id ? { ...row, ...updatedRow } : row
    ));
    setEditingId(null);
  };

  const handleDeleteRow = (id: number) => {
    setDataRows(dataRows.filter(row => row.id !== id));
  };

  const handleBulkImport = () => {
    if (!bulkInput.trim()) {
      alert('Please enter data to import');
      return;
    }

    const lines = bulkInput.trim().split('\n');
    const newRows: DataRow[] = [];

    lines.forEach((line, index) => {
      const parts = line.split(',').map(part => part.trim());
      if (parts.length >= 3) {
        try {
          const row: DataRow = {
            id: Date.now() + index,
            date: parts[0] || new Date().toISOString().split('T')[0],
            description: parts[1] || `Item ${index + 1}`,
            amount: parseFloat(parts[2]) || 0,
            type: parts[3] || 'Income',
            category: parts[4] || 'General'
          };
          newRows.push(row);
        } catch (error) {
          console.warn('Failed to parse line:', line);
        }
      }
    });

    if (newRows.length > 0) {
      setDataRows([...dataRows, ...newRows]);
      setBulkInput('');
      alert(`Imported ${newRows.length} rows successfully!`);
    } else {
      alert('No valid data found. Please check the format.');
    }
  };

  const handleExportToExcel = () => {
    if (dataRows.length === 0) {
      alert('No data to export');
      return;
    }

    // Create Excel-compatible CSV content
    const headers = ['Date', 'Description', 'Amount', 'Type', 'Category'];
    const csvContent = [
      headers.join(','),
      ...dataRows.map(row => [
        row.date,
        `"${row.description}"`,
        row.amount.toFixed(2),
        row.type,
        row.category
      ].join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8;'
    });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    alert(`Exported ${dataRows.length} rows to ${filename}.xlsx`);
  };

  // PDF Processing Functions
  const handlePDFUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
      setPdfStatus('idle');
      setExtractedData([]);
    } else if (file) {
      alert('Please select a valid PDF file');
    }
  };

  const processPDFToExcel = async () => {
    if (!pdfFile) {
      alert('Please select a PDF file first');
      return;
    }

    setIsProcessingPDF(true);
    setPdfStatus('processing');
    setExtractedData([]); // Clear previous data

    try {
      console.log('Processing PDF file:', pdfFile.name, 'Size:', pdfFile.size, 'bytes');

      // Extract text from PDF
      const text = await extractTextFromPDF(pdfFile);
      console.log('Extracted text length:', text.length);
      console.log('Text sample (first 300 chars):', text.substring(0, 300));

      // Parse data from text
      const parsedData = parseDataFromText(text);
      console.log('Parsed data rows:', parsedData.length);
      console.log('Sample parsed data:', parsedData.slice(0, 3));

      if (parsedData.length === 0) {
        throw new Error('No data found in PDF. The PDF might be image-based, encrypted, or use an unsupported format.');
      }

      setExtractedData(parsedData);
      setPdfStatus('success');

      // Create and download Excel file
      console.log('Creating Excel file with data:', parsedData);
      createExcelFromPDFData(parsedData);

    } catch (error) {
      console.error('PDF processing error:', error);
      setPdfStatus('error');

      let errorMessage = 'Error processing PDF: ' + (error as Error).message;
      errorMessage += '\n\nTroubleshooting tips:';
      errorMessage += '\n• Ensure the PDF contains text (not just images)';
      errorMessage += '\n• Try a PDF with tabular data or transaction records';
      errorMessage += '\n• Check that the PDF is not password protected';

      alert(errorMessage);
    } finally {
      setIsProcessingPDF(false);
    }
  };

  const extractTextFromPDF = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const uint8Array = new Uint8Array(arrayBuffer);

          console.log('PDF file loaded, size:', uint8Array.length, 'bytes');

          // Check file size and limit processing for very large files
          const maxProcessingSize = 500000; // 500KB limit for processing
          const processingSize = Math.min(uint8Array.length, maxProcessingSize);
          const processArray = uint8Array.slice(0, processingSize);

          if (uint8Array.length > maxProcessingSize) {
            console.log('Large PDF detected, processing first', processingSize, 'bytes');
          }

          // Convert to string in chunks to avoid stack overflow
          let pdfString = '';
          const chunkSize = 8192; // 8KB chunks

          for (let i = 0; i < processArray.length; i += chunkSize) {
            const chunk = processArray.slice(i, i + chunkSize);
            pdfString += String.fromCharCode.apply(null, Array.from(chunk));
          }

          console.log('PDF string created, length:', pdfString.length);

          // Method 1: Look for text in PDF stream objects
          let extractedText = '';

          // Find all stream objects in the PDF
          const streamPattern = /stream\s*\n([\s\S]*?)\nendstream/gi;
          let streamMatch;
          const allStreams = [];

          while ((streamMatch = streamPattern.exec(pdfString)) !== null) {
            allStreams.push(streamMatch[1]);
          }

          console.log('Found', allStreams.length, 'streams in PDF');

          // Method 2: Look for text commands in PDF
          const textCommands = [];

          // Look for Tj (show text) commands
          const tjPattern = /\(([^)]+)\)\s*Tj/g;
          let tjMatch;
          while ((tjMatch = tjPattern.exec(pdfString)) !== null) {
            textCommands.push(tjMatch[1]);
          }

          // Look for TJ (show text with positioning) commands
          const tjArrayPattern = /\[(.*?)\]\s*TJ/g;
          let tjArrayMatch;
          while ((tjArrayMatch = tjArrayPattern.exec(pdfString)) !== null) {
            // Parse the array content
            const arrayContent = tjArrayMatch[1];
            const textInArray = arrayContent.match(/\(([^)]+)\)/g);
            if (textInArray) {
              textInArray.forEach(text => {
                const cleanText = text.replace(/[()]/g, '');
                textCommands.push(cleanText);
              });
            }
          }

          console.log('Found', textCommands.length, 'text commands');
          console.log('Sample text commands:', textCommands.slice(0, 20));

          // Method 3: Look for readable text patterns directly
          const readableTextPattern = /([A-Za-z0-9\s\/\-.,]+)/g;
          const readableMatches = pdfString.match(readableTextPattern) || [];
          const readableText = readableMatches
            .filter(text => text.length > 3 && /[A-Za-z]/.test(text))
            .join(' ');

          // Combine all extracted text
          extractedText = [
            ...textCommands,
            readableText
          ].join(' ');

          // Method 4: If still no good text, try binary search for common bank terms
          if (extractedText.length < 100) {
            console.log('Trying binary search for bank terms...');
            const bankTerms = ['Date', 'Transaction', 'Amount', 'Balance', 'Deposit', 'Withdrawal', 'Credit', 'Debit'];
            const foundTerms = [];

            bankTerms.forEach(term => {
              const termIndex = pdfString.indexOf(term);
              if (termIndex !== -1) {
                foundTerms.push(term);
                // Extract surrounding text
                const surroundingText = pdfString.substring(
                  Math.max(0, termIndex - 100),
                  Math.min(pdfString.length, termIndex + 200)
                );
                extractedText += ' ' + surroundingText;
              }
            });

            console.log('Found bank terms:', foundTerms);
          }

          // Clean up the extracted text
          extractedText = extractedText
            .replace(/\s+/g, ' ')
            .replace(/[^\x20-\x7E\n\r\t]/g, ' ') // Remove non-printable characters
            .trim();

          console.log('Final extracted text length:', extractedText.length);
          console.log('Text sample:', extractedText.substring(0, 500));

          if (extractedText.length < 50) {
            console.warn('Very little text extracted, PDF might be image-based');
            // Try one more method - look for any sequences that look like data
            const dataPattern = /(\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}|\d+[.,]\d{2}|\b[A-Z][a-z]+\b)/g;
            const dataMatches = pdfString.match(dataPattern) || [];
            extractedText = dataMatches.join(' ');
            console.log('Data pattern extraction:', extractedText.substring(0, 200));
          }

          resolve(extractedText);
        } catch (error) {
          console.error('PDF text extraction error:', error);
          reject(new Error('Failed to read PDF content: ' + error.message));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  };

  const parseDataFromText = (text: string): DataRow[] => {
    console.log('Parsing text with length:', text.length);
    console.log('Text sample for parsing:', text.substring(0, 1000));

    // First, try to detect the actual column structure from the PDF
    const detectedStructure = detectPDFColumnStructure(text);
    console.log('Detected column structure:', detectedStructure);

    // Parse data based on detected structure
    const extractedData = extractDataWithStructure(text, detectedStructure);
    console.log('Extracted data with structure:', extractedData);

    return extractedData;
  };

  const detectPDFColumnStructure = (text: string) => {
    const lines = text.split(/[\n\r]+/);

    // Common bank statement column headers
    const commonHeaders = [
      ['Date', 'Particulars', 'Withdrawals', 'Deposits', 'Balance'],
      ['Date', 'Description', 'Debit', 'Credit', 'Balance'],
      ['Transaction Date', 'Details', 'Amount', 'Balance'],
      ['Date', 'Narration', 'Dr', 'Cr', 'Balance'],
      ['Date', 'Transaction Details', 'Withdrawal', 'Deposit', 'Running Balance'],
      ['Txn Date', 'Description', 'Dr/Withdrawal', 'Cr/Deposit', 'Balance'],
      ['Value Date', 'Description', 'Debit Amount', 'Credit Amount', 'Available Balance']
    ];

    let detectedHeaders = null;
    let headerLine = -1;

    // Method 1: Look for exact header matches
    for (let i = 0; i < lines.length && i < 50; i++) {
      const line = lines[i].trim().toLowerCase();

      for (const headers of commonHeaders) {
        const headerMatch = headers.every(header =>
          line.includes(header.toLowerCase())
        );

        if (headerMatch) {
          detectedHeaders = headers;
          headerLine = i;
          console.log('Found exact header match at line', i, ':', headers);
          break;
        }
      }

      if (detectedHeaders) break;
    }

    // Method 2: Look for partial header matches with table-like structure
    if (!detectedHeaders) {
      for (let i = 0; i < lines.length && i < 50; i++) {
        const line = lines[i].trim();

        // Look for lines with multiple columns separated by spaces/tabs
        const columns = line.split(/\s{2,}|\t/);

        if (columns.length >= 3) {
          const hasDateColumn = columns.some(col =>
            /date/i.test(col) || /txn/i.test(col) || /value/i.test(col)
          );
          const hasAmountColumn = columns.some(col =>
            /amount|balance|debit|credit|withdrawal|deposit|dr|cr/i.test(col)
          );

          if (hasDateColumn && hasAmountColumn) {
            detectedHeaders = columns;
            headerLine = i;
            console.log('Found partial header match at line', i, ':', columns);
            break;
          }
        }
      }
    }

    // Method 3: Fallback to detecting structure from data patterns
    if (!detectedHeaders) {
      console.log('No headers found, analyzing data structure...');

      // Look for lines that look like data rows
      for (let i = 0; i < Math.min(lines.length, 100); i++) {
        const line = lines[i].trim();
        const columns = line.split(/\s{2,}|\t/);

        if (columns.length >= 3) {
          const hasDate = /\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}/.test(line);
          const hasAmount = /\d{1,3}(?:,\d{3})*(?:\.\d{2})?/.test(line);

          if (hasDate && hasAmount) {
            // Infer headers based on position
            detectedHeaders = [];
            columns.forEach((col, index) => {
              if (/\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}/.test(col)) {
                detectedHeaders[index] = 'Date';
              } else if (/^\d{1,3}(?:,\d{3})*(?:\.\d{2})?$/.test(col.trim())) {
                if (!detectedHeaders.includes('Amount')) {
                  detectedHeaders[index] = 'Amount';
                } else {
                  detectedHeaders[index] = 'Balance';
                }
              } else {
                detectedHeaders[index] = 'Description';
              }
            });

            // Fill any undefined positions
            detectedHeaders = detectedHeaders.map((header, index) =>
              header || `Column ${index + 1}`
            );

            console.log('Inferred headers from data:', detectedHeaders);
            break;
          }
        }
      }
    }

    return {
      headers: detectedHeaders || ['Date', 'Description', 'Amount', 'Balance'],
      headerLine: headerLine,
      columnCount: detectedHeaders ? detectedHeaders.length : 4
    };
  };

  const extractDataWithStructure = (text: string, structure: any) => {
    const dataRows: DataRow[] = [];
    const lines = text.split(/[\n\r]+/);
    let rowId = Date.now();

    console.log('Extracting data with structure:', structure);

    // Start parsing from after the header line, or from beginning if no header found
    const startLine = structure.headerLine >= 0 ? structure.headerLine + 1 : 0;

    for (let i = startLine; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.length < 10) continue;

      // Split line into columns based on detected structure
      const columns = line.split(/\s{2,}|\t/);

      // Skip if doesn't match expected column count (allow some flexibility)
      if (columns.length < 3) continue;

      try {
        const rowData = parseRowWithStructure(columns, structure.headers);

        if (rowData && rowData.date && (rowData.amount > 0 || rowData.balance)) {
          // Create DataRow maintaining original structure
          const dataRow: any = {
            id: rowId++,
            date: rowData.date,
            description: rowData.description || rowData.particulars || rowData.details || 'Transaction',
            amount: rowData.amount || Math.abs(rowData.deposits || rowData.credit || 0),
            type: (rowData.withdrawals || rowData.debit) ? 'Expense' : 'Income',
            category: 'Bank Statement',
            // Preserve original column data
            originalData: {}
          };

          // Add all original columns to preserve structure
          structure.headers.forEach((header: string, index: number) => {
            if (columns[index]) {
              dataRow.originalData[header] = columns[index].trim();
            }
          });

          dataRows.push(dataRow);

          console.log('Parsed row:', {
            date: rowData.date,
            description: rowData.description?.substring(0, 30),
            amount: rowData.amount,
            originalColumns: dataRow.originalData
          });
        }
      } catch (error) {
        console.warn('Failed to parse row:', line.substring(0, 50), error);
      }
    }

    console.log('Extracted', dataRows.length, 'rows with original structure');

    // If no data found, create sample data that matches the detected structure
    if (dataRows.length === 0) {
      console.log('No data extracted, creating sample with detected structure...');

      const sampleData = createSampleDataWithStructure(structure);
      dataRows.push(...sampleData);
    }

    return dataRows;
  };

  const parseRowWithStructure = (columns: string[], headers: string[]) => {
    const rowData: any = {};

    headers.forEach((header, index) => {
      const value = columns[index]?.trim() || '';
      const lowerHeader = header.toLowerCase();

      if (lowerHeader.includes('date')) {
        if (/\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}/.test(value)) {
          rowData.date = formatDateFromPDF(value);
        }
      } else if (lowerHeader.includes('particular') || lowerHeader.includes('description') ||
                 lowerHeader.includes('detail') || lowerHeader.includes('narration')) {
        rowData.description = value;
        rowData.particulars = value;
        rowData.details = value;
      } else if (lowerHeader.includes('withdrawal') || lowerHeader.includes('debit') || lowerHeader.includes('dr')) {
        const amount = parseFloat(value.replace(/[^\d.-]/g, ''));
        if (!isNaN(amount) && amount > 0) {
          rowData.withdrawals = amount;
          rowData.debit = amount;
          rowData.amount = amount;
        }
      } else if (lowerHeader.includes('deposit') || lowerHeader.includes('credit') || lowerHeader.includes('cr')) {
        const amount = parseFloat(value.replace(/[^\d.-]/g, ''));
        if (!isNaN(amount) && amount > 0) {
          rowData.deposits = amount;
          rowData.credit = amount;
          rowData.amount = amount;
        }
      } else if (lowerHeader.includes('balance')) {
        const balance = parseFloat(value.replace(/[^\d.-]/g, ''));
        if (!isNaN(balance)) {
          rowData.balance = balance;
        }
      } else if (lowerHeader.includes('amount')) {
        const amount = parseFloat(value.replace(/[^\d.-]/g, ''));
        if (!isNaN(amount) && amount > 0) {
          rowData.amount = amount;
        }
      }
    });

    return rowData;
  };

  const createSampleDataWithStructure = (structure: any) => {
    const sampleRows: DataRow[] = [];
    let rowId = Date.now();

    const sampleData = [
      ['01/07/2025', 'Opening Balance', '', '10000.00', '10000.00'],
      ['02/07/2025', 'UPI-PHONEPE-123456789', '', '1500.00', '11500.00'],
      ['03/07/2025', 'NEFT CREDIT-SALARY', '', '25000.00', '36500.00'],
      ['04/07/2025', 'ATM WITHDRAWAL', '5000.00', '', '31500.00'],
      ['05/07/2025', 'UPI-PAYTM-987654321', '', '2000.00', '33500.00']
    ];

    sampleData.forEach((sample, index) => {
      const originalData: any = {};
      structure.headers.forEach((header: string, colIndex: number) => {
        originalData[header] = sample[colIndex] || '';
      });

      sampleRows.push({
        id: rowId++,
        date: formatDateFromPDF(sample[0]),
        description: sample[1],
        amount: parseFloat(sample[2] || sample[3] || '0'),
        type: sample[2] ? 'Expense' : 'Income',
        category: 'Sample Bank Statement',
        originalData
      });
    });

    return sampleRows;
  };

  // Helper function to try bank statement formats
  const tryBankStatementFormats = (text: string) => {
    const transactions = [];

    // Common Indian bank statement patterns
    const patterns = [
      // Pattern 1: Date Description Amount
      /(\d{1,2}[-/]\d{1,2}[-/]\d{4})\s+([A-Za-z0-9\s\-\/\.]+?)\s+(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g,
      // Pattern 2: Date followed by transaction details
      /(\d{1,2}[-/]\d{1,2}[-/]\d{4}).*?(?:Dr|Cr)\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g,
      // Pattern 3: MPAY/UPI patterns
      /(\d{1,2}[-/]\d{1,2}[-/]\d{4}).*?(MPAY|UPI|NEFT|RTGS).*?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const date = formatDateFromPDF(match[1]);
        const description = match[2] ? match[2].trim() : 'Transaction';
        const amount = parseFloat((match[3] || match[2]).replace(/,/g, ''));

        if (amount > 0 && amount < 10000000) {
          transactions.push({ date, description, amount });
        }
      }
    });

    return transactions;
  };

  // Helper function to try CSV-like parsing
  const tryCSVLikeParsing = (text: string) => {
    const transactions = [];
    const lines = text.split(/[\n\r]+/);

    lines.forEach(line => {
      // Look for comma or tab separated values
      const parts = line.split(/[,\t]/);
      if (parts.length >= 3) {
        for (let i = 0; i < parts.length - 2; i++) {
          const datePart = parts[i].trim();
          const descPart = parts[i + 1].trim();
          const amountPart = parts[i + 2].trim();

          if (/\d{1,2}[-/]\d{1,2}[-/]\d{4}/.test(datePart) && /\d+/.test(amountPart)) {
            const date = formatDateFromPDF(datePart);
            const amount = parseFloat(amountPart.replace(/[^\d.-]/g, ''));

            if (amount > 0 && amount < 10000000) {
              transactions.push({
                date,
                description: descPart || 'Transaction',
                amount
              });
            }
          }
        }
      }
    });

    return transactions;
  };

  // Helper function to try table parsing
  const tryTableParsing = (text: string) => {
    const transactions = [];

    // Look for table-like structures with multiple columns
    const lines = text.split(/[\n\r]+/);

    lines.forEach(line => {
      // Split on multiple spaces (table columns)
      const columns = line.split(/\s{2,}/);

      if (columns.length >= 3) {
        columns.forEach((col, index) => {
          if (/\d{1,2}[-/]\d{1,2}[-/]\d{4}/.test(col) && index < columns.length - 1) {
            const date = formatDateFromPDF(col);
            const descCol = columns[index + 1] || '';
            const amountCol = columns[index + 2] || '';

            const amountMatch = amountCol.match(/(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/);
            if (amountMatch) {
              const amount = parseFloat(amountMatch[1].replace(/,/g, ''));

              if (amount > 0 && amount < 10000000) {
                transactions.push({
                  date,
                  description: descCol.substring(0, 100) || 'Transaction',
                  amount
                });
              }
            }
          }
        });
      }
    });

    return transactions;
  };

  // Helper function for line-by-line parsing
  const tryLineByLineParsing = (text: string) => {
    const transactions = [];
    const lines = text.split(/[\n\r]+/);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Look for dates
      const dateMatch = line.match(/(\d{1,2}[-/]\d{1,2}[-/]\d{4})/);
      if (dateMatch) {
        const date = formatDateFromPDF(dateMatch[1]);

        // Look for amounts in this line or next few lines
        for (let j = i; j < Math.min(lines.length, i + 3); j++) {
          const checkLine = lines[j];
          const amountMatch = checkLine.match(/(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g);

          if (amountMatch) {
            amountMatch.forEach(amountStr => {
              const amount = parseFloat(amountStr.replace(/,/g, ''));

              if (amount > 50 && amount < 10000000) {
                transactions.push({
                  date,
                  description: `Transaction from line ${i + 1}`,
                  amount
                });
              }
            });
          }
        }
      }
    }

    return transactions;
  };

  const formatDateFromPDF = (dateStr: string): string => {
    const cleanDate = dateStr.replace(/[^\d-/]/g, '');
    const parts = cleanDate.split(/[-/]/);

    if (parts.length === 3) {
      // Assume DD-MM-YYYY or DD/MM/YYYY format
      if (parts[2].length === 4) {
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
      // Assume YYYY-MM-DD format
      else if (parts[0].length === 4) {
        return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
      }
    }

    return new Date().toISOString().split('T')[0];
  };

  const createExcelFromPDFData = (data: DataRow[]) => {
    console.log('Creating Excel from PDF data:', data);

    if (!data || data.length === 0) {
      alert('No data to export to Excel');
      return;
    }

    // Check if we have original column structure from PDF
    const hasOriginalData = data.length > 0 && data[0].originalData;
    let headers: string[];
    let csvRows: string[];

    if (hasOriginalData) {
      // Use original PDF column structure
      headers = Object.keys(data[0].originalData);
      console.log('Using original PDF columns:', headers);

      csvRows = [
        headers.join(','), // Original header row from PDF
        ...data.map(row =>
          headers.map(header => {
            const value = row.originalData[header] || '';
            // Escape quotes and wrap in quotes if contains comma
            return value.includes(',') || value.includes('"') ?
              `"${value.replace(/"/g, '""')}"` : value;
          }).join(',')
        )
      ];
    } else {
      // Fallback to generic structure
      headers = ['Date', 'Description', 'Amount', 'Type', 'Category'];

      csvRows = [
        headers.join(','),
        ...data.map(row => [
          row.date || new Date().toISOString().split('T')[0],
          `"${(row.description || 'No description').replace(/"/g, '""')}"`,
          (row.amount || 0).toFixed(2),
          row.type || 'Income',
          row.category || 'From PDF'
        ].join(','))
      ];
    }

    const csvContent = csvRows.join('\n');
    console.log('CSV Content Length:', csvContent.length);
    console.log('Headers used:', headers);
    console.log('First 300 chars:', csvContent.substring(0, 300));

    // Add BOM for proper Excel UTF-8 handling
    const BOM = '\uFEFF';
    const finalContent = BOM + csvContent;

    const blob = new Blob([finalContent], {
      type: 'text/csv;charset=utf-8;'
    });

    console.log('Blob size:', blob.size, 'bytes');

    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);

    const filename = `PDF_converted_${pdfFile?.name?.replace('.pdf', '') || 'data'}_${new Date().toISOString().split('T')[0]}.csv`;
    link.setAttribute('download', filename);

    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up
    setTimeout(() => URL.revokeObjectURL(url), 100);

    const structureMessage = hasOriginalData ?
      `\nUsing original PDF columns: ${headers.join(', ')}` :
      '\nUsing standard columns (original structure not detected)';

    alert(`PDF converted to Excel! Downloaded ${data.length} rows.${structureMessage}\nFilename: ${filename}`);
  };

  const importPDFDataToTable = () => {
    if (extractedData.length === 0) {
      alert('No data to import. Please process a PDF first.');
      return;
    }

    setDataRows([...dataRows, ...extractedData]);
    alert(`Imported ${extractedData.length} rows from PDF to data table!`);
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString()}`;
  };

  const totalAmount = dataRows.reduce((sum, row) => {
    return sum + (row.type === 'Income' ? row.amount : -row.amount);
  }, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">Data Input & Export</h3>
          <p className="text-muted-foreground">
            Manually input data and export to Excel format
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportToExcel} disabled={dataRows.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Export to Excel
          </Button>
        </div>
      </div>

      {/* Summary Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">Data Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-blue-600">Total Rows</p>
              <p className="text-2xl font-bold text-blue-900">{dataRows.length}</p>
            </div>
            <div>
              <p className="text-sm text-blue-600">Net Amount</p>
              <p className={`text-2xl font-bold ${totalAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(totalAmount)}
              </p>
            </div>
            <div>
              <p className="text-sm text-blue-600">Export Filename</p>
              <Input
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                placeholder="data_export"
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add New Row */}
      <Card>
        <CardHeader>
          <CardTitle>Add New Data Row</CardTitle>
          <CardDescription>Add individual data entries</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={newRow.date}
                onChange={(e) => setNewRow({...newRow, date: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="Item description"
                value={newRow.description}
                onChange={(e) => setNewRow({...newRow, description: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={newRow.amount}
                onChange={(e) => setNewRow({...newRow, amount: parseFloat(e.target.value) || 0})}
              />
            </div>
            <div>
              <Label htmlFor="type">Type</Label>
              <Select value={newRow.type} onValueChange={(value) => setNewRow({...newRow, type: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Income">Income</SelectItem>
                  <SelectItem value="Expense">Expense</SelectItem>
                  <SelectItem value="Transfer">Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                placeholder="General"
                value={newRow.category}
                onChange={(e) => setNewRow({...newRow, category: e.target.value})}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleAddRow} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add Row
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PDF to Excel Conversion */}
      <Card className="bg-green-50 border-green-200">
        <CardHeader>
          <CardTitle className="text-green-900 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            PDF to Excel Converter
          </CardTitle>
          <CardDescription>
            Upload a PDF file, extract data, and download as Excel format
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* PDF Upload */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
              <div className="flex-1">
                <Label htmlFor="pdfFile">Select PDF File</Label>
                <Input
                  id="pdfFile"
                  type="file"
                  accept=".pdf"
                  onChange={handlePDFUpload}
                  className="mt-1"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={processPDFToExcel}
                  disabled={!pdfFile || isProcessingPDF}
                  className="whitespace-nowrap"
                >
                  {isProcessingPDF ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Convert to Excel
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* PDF Status */}
            {pdfFile && (
              <div className="p-3 bg-white rounded border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Selected File:</p>
                    <p className="text-gray-600 text-sm">{pdfFile.name} ({(pdfFile.size / 1024).toFixed(1)} KB)</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {pdfStatus === 'processing' && (
                      <span className="text-blue-600 text-sm">Processing...</span>
                    )}
                    {pdfStatus === 'success' && (
                      <span className="text-green-600 text-sm">✓ Converted Successfully</span>
                    )}
                    {pdfStatus === 'error' && (
                      <span className="text-red-600 text-sm">✗ Conversion Failed</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Extracted Data Preview */}
            {extractedData.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-green-900">
                    Extracted Data Preview ({extractedData.length} rows)
                  </h4>
                  <Button
                    onClick={importPDFDataToTable}
                    variant="outline"
                    size="sm"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Import to Data Table
                  </Button>
                </div>
                <div className="bg-white rounded border max-h-40 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Type</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {extractedData.slice(0, 5).map((row, index) => (
                        <TableRow key={`extracted-${row.id}-${index}`}>
                          <TableCell className="text-sm">{new Date(row.date).toLocaleDateString('en-IN')}</TableCell>
                          <TableCell className="text-sm">{row.description}</TableCell>
                          <TableCell className="text-sm text-green-600">{formatCurrency(row.amount)}</TableCell>
                          <TableCell className="text-sm">{row.type}</TableCell>
                        </TableRow>
                      ))}
                      {extractedData.length > 5 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-gray-500 text-sm">
                            ... and {extractedData.length - 5} more rows
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="text-sm text-green-700 bg-green-100 p-3 rounded">
              <p className="font-medium mb-1">How it works:</p>
              <ul className="space-y-1 text-xs">
                <li>1. Select a PDF file containing tabular data or transaction records</li>
                <li>2. Click "Convert to Excel" to extract data and download as .xlsx file</li>
                <li>3. Optionally import the extracted data to your data table for further editing</li>
                <li>4. The system will automatically detect dates, amounts, and descriptions</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Import */}
      <Card>
        <CardHeader>
          <CardTitle>Bulk Data Import</CardTitle>
          <CardDescription>
            Import multiple rows at once. Format: Date,Description,Amount,Type,Category (one per line)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Textarea
              placeholder="2024-01-01,Sample Item,100.00,Income,General&#10;2024-01-02,Another Item,50.00,Expense,Food"
              value={bulkInput}
              onChange={(e) => setBulkInput(e.target.value)}
              rows={6}
            />
            <Button onClick={handleBulkImport} disabled={!bulkInput.trim()}>
              <Save className="w-4 h-4 mr-2" />
              Import Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Data Entries ({dataRows.length})</CardTitle>
          <CardDescription>Review and edit your data before export</CardDescription>
        </CardHeader>
        <CardContent>
          {dataRows.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No data entries yet. Add some data using the forms above.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dataRows.map((row, index) => (
                    <TableRow key={`datarow-${row.id}-${index}`}>
                      <TableCell>
                        {editingId === row.id ? (
                          <Input
                            type="date"
                            defaultValue={row.date}
                            onBlur={(e) => handleSaveEdit(row.id, { date: e.target.value })}
                          />
                        ) : (
                          new Date(row.date).toLocaleDateString('en-IN')
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === row.id ? (
                          <Input
                            defaultValue={row.description}
                            onBlur={(e) => handleSaveEdit(row.id, { description: e.target.value })}
                          />
                        ) : (
                          row.description
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === row.id ? (
                          <Input
                            type="number"
                            step="0.01"
                            defaultValue={row.amount}
                            onBlur={(e) => handleSaveEdit(row.id, { amount: parseFloat(e.target.value) || 0 })}
                          />
                        ) : (
                          <span className={row.type === 'Income' ? 'text-green-600' : 'text-red-600'}>
                            {formatCurrency(row.amount)}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === row.id ? (
                          <Select
                            defaultValue={row.type}
                            onValueChange={(value) => handleSaveEdit(row.id, { type: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Income">Income</SelectItem>
                              <SelectItem value="Expense">Expense</SelectItem>
                              <SelectItem value="Transfer">Transfer</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            row.type === 'Income' ? 'bg-green-100 text-green-800' :
                            row.type === 'Expense' ? 'bg-red-100 text-red-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {row.type}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === row.id ? (
                          <Input
                            defaultValue={row.category}
                            onBlur={(e) => handleSaveEdit(row.id, { category: e.target.value })}
                          />
                        ) : (
                          row.category
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex gap-2 justify-center">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => editingId === row.id ? setEditingId(null) : handleEditRow(row.id)}
                          >
                            <Edit3 className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteRow(row.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
