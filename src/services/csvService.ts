
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

// Process data to create a consolidated dataset with center information
const processCenterData = (streamingData: Record<string, string>[], nvrData: Record<string, string>[]): Record<string, string>[] => {
  // Create a map to easily lookup NVR data by center name
  const nvrDataMap = new Map<string, Record<string, string>>();
  
  // Process NVR data and clean up center names
  nvrData.forEach(row => {
    if (row["Center Name"]) {
      // Clean up the center name (remove quotes and extra text)
      let centerName = row["Center Name"].replace(/^["']|["']$/g, '');
      // Remove anything after a double quote if it exists
      const quoteIndex = centerName.indexOf('"');
      if (quoteIndex > 0) {
        centerName = centerName.substring(0, quoteIndex).trim();
      }
      nvrDataMap.set(centerName.toLowerCase(), row);
    }
  });
  
  // Merge streaming data with NVR data
  return streamingData.map(streamRow => {
    if (!streamRow["Center Name"]) return streamRow;
    
    // Clean center name for lookup
    let centerName = streamRow["Center Name"].replace(/^["']|["']$/g, '');
    const quoteIndex = centerName.indexOf('"');
    if (quoteIndex > 0) {
      centerName = centerName.substring(0, quoteIndex).trim();
    }
    
    const nvrRow = nvrDataMap.get(centerName.toLowerCase());
    
    if (nvrRow) {
      // Create a merged row with data from both sheets
      return {
        ...streamRow,
        "NVR Login URL": nvrRow["NVR Login URL"] || "",
        "Login ID": nvrRow["Login ID"] || "",
        "Password": nvrRow["Password"] || "",
        "Local URL/ Public ip": nvrRow["Local URL/ Public ip"] || ""
      };
    }
    
    return streamRow;
  });
};

// Fetch multiple sheets and combine the data
export const fetchMultipleSheets = async (urls: string[]): Promise<Record<string, string>[]> => {
  try {
    if (urls.length !== 2) {
      throw new Error("Expected exactly 2 sheet URLs: one for streaming data and one for NVR data");
    }
    
    // Fetch data from both sheets
    const [streamingData, nvrData] = await Promise.all([
      fetchCsvData(urls[0]),
      fetchCsvData(urls[1])
    ]);
    
    console.log("Streaming sheet data:", streamingData);
    console.log("NVR sheet data:", nvrData);
    
    // Process and merge the data from both sheets
    const combinedData = processCenterData(streamingData, nvrData);
    console.log("Combined and processed data:", combinedData);
    
    return combinedData;
  } catch (error) {
    console.error("Error fetching multiple sheets:", error);
    throw error;
  }
};
