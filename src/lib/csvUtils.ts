import Papa from "papaparse";

export interface CsvData {
  headers: string[];
  /**
   * Represents sample rows from the CSV file. Each inner array is a row, and each string is a cell value.
   * For example, if the CSV has columns "Name" and "Age", and the first row is "John,25",
   * the sampleRows would be:
   * [
   *   { Name: "John", Age: "25" },
   *   { Name: "Jane", Age: "30" },
   *   ...
   * ]
   * The keys are the column names, and the values are the cell values.
   */
  sampleRows: { [key: string]: string }[];
}

const AMOUNT_SAMPLE_ROWS = 4;

export const extractCsvData = (file: File): Promise<CsvData> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = (results.meta.fields || []).map((field) =>
          field.trim()
        );
        const allRows = results.data as { [key: string]: string }[];
        const sampleRows: { [key: string]: string }[] = [];

        if (allRows.length <= AMOUNT_SAMPLE_ROWS) {
          sampleRows.push(...allRows);
        } else {
          const step = (allRows.length - 1) / 3;
          for (let i = 0; i < AMOUNT_SAMPLE_ROWS; i++) {
            sampleRows.push(allRows[Math.floor(i * step)]);
          }
        }

        resolve({ headers, sampleRows });
      },
      error: (error) => {
        console.error("Error parsing CSV:", error.message);
        reject(error);
      },
    });
  });
};
