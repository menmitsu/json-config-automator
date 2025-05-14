
/**
 * Service to handle CSV data fetching and processing
 */

// Helper function to convert Google Sheets URL to CSV export URL
export const convertGoogleSheetUrlToCsvUrl = (url: string): string => {
  // Extract the spreadsheet ID from the Google Sheets URL
  const match = url.match(/\/d\/(.*?)\/edit/);
  if (!match || !match[1]) {
    throw new Error("Invalid Google Sheets URL");
  }
  
  const spreadsheetId = match[1];
  
  // Check if a specific sheet is specified (gid parameter)
  const gidMatch = url.match(/gid=(\d+)/);
  const gid = gidMatch ? gidMatch[1] : '0';
  
  // Construct the CSV export URL
  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`;
};

// Parse CSV data into array of objects
export const parseCsvData = (csvText: string): Record<string, string>[] => {
  const lines = csvText.split('\n');
  if (lines.length === 0) return [];
  
  const headers = lines[0].split(',').map(header => header.trim());
  
  return lines.slice(1).map(line => {
    const values = line.split(',').map(value => value.trim());
    const row: Record<string, string> = {};
    
    headers.forEach((header, index) => {
      if (index < values.length) {
        row[header] = values[index];
      } else {
        row[header] = '';
      }
    });
    
    return row;
  });
};

// Fetch CSV data from a URL
export const fetchCsvData = async (url: string): Promise<Record<string, string>[]> => {
  try {
    // Convert Google Sheets URL to CSV export URL if needed
    const csvUrl = url.includes('docs.google.com') 
      ? convertGoogleSheetUrlToCsvUrl(url)
      : url;
    
    const response = await fetch(csvUrl, {
      headers: {
        'Content-Type': 'text/csv',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const csvText = await response.text();
    return parseCsvData(csvText);
  } catch (error) {
    console.error("Error fetching CSV data:", error);
    throw error;
  }
};
