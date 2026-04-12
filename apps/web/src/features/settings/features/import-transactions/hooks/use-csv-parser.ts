import { useState, useCallback } from "react";
import Papa from "papaparse";

const MAX_ROWS = 500;

type CsvParseResult = {
  headers: string[];
  rows: string[][];
  rowCount: number;
  error: string | null;
  isLoading: boolean;
  parseFile: (file: File) => void;
  reset: () => void;
};

export function useCsvParser(): CsvParseResult {
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const reset = useCallback(() => {
    setHeaders([]);
    setRows([]);
    setError(null);
    setIsLoading(false);
  }, []);

  const parseFile = useCallback((file: File) => {
    setIsLoading(true);
    setError(null);

    Papa.parse<string[]>(file, {
      header: false,
      skipEmptyLines: true,
      complete(results) {
        setIsLoading(false);

        if (results.errors.length > 0) {
          setError(
            `CSV parsing error: ${results.errors[0].message} (row ${results.errors[0].row})`
          );
          return;
        }

        const allRows = results.data;
        if (allRows.length < 2) {
          setError("CSV file appears to be empty or has no data rows.");
          return;
        }

        const [headerRow, ...dataRows] = allRows;

        if (dataRows.length > MAX_ROWS) {
          setError(
            `CSV contains ${dataRows.length} rows. Maximum is ${MAX_ROWS} per import. Please split your file.`
          );
          return;
        }

        setHeaders(headerRow);
        setRows(dataRows);
      },
      error(err) {
        setIsLoading(false);
        setError(`Failed to read file: ${err.message}`);
      },
    });
  }, []);

  return {
    headers,
    rows,
    rowCount: rows.length,
    error,
    isLoading,
    parseFile,
    reset,
  };
}
