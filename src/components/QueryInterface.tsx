
import React, { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { fetchMultipleSheets } from "@/services/csvService";
import { Loader2, Search, Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface QueryInterfaceProps {
  onUpdateConfig: (newData: any) => void;
  currentConfig: any;
}

const QueryInterface: React.FC<QueryInterfaceProps> = ({ onUpdateConfig, currentConfig }) => {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState("");
  const [customApiUrl, setCustomApiUrl] = useState("");
  const [useCustomApi, setUseCustomApi] = useState(false);
  const [csvData, setCsvData] = useState<Record<string, string>[]>([]);
  const [isFetchingCsv, setIsFetchingCsv] = useState(false);
  const [suggestedChanges, setSuggestedChanges] = useState<Record<string, any>>({});

  // Define the Google Sheet URLs
  const PRIMARY_SHEET_URL = "https://docs.google.com/spreadsheets/d/1EANvZgBTpp5siZVsgNjtWDUPZbZFsQALmBHO2zET7lw/edit?gid=0#gid=0";
  const SECONDARY_SHEET_URL = "https://docs.google.com/spreadsheets/d/1EANvZgBTpp5siZVsgNjtWDUPZbZFsQALmBHO2zET7lw/edit?gid=1876766802#gid=1876766802";
  
  // Fetch Google Sheets data on component mount
  useEffect(() => {
    fetchGoogleSheetData();
  }, []);

  const fetchGoogleSheetData = async () => {
    setIsFetchingCsv(true);
    try {
      // Fetch data from both sheets
      const combinedData = await fetchMultipleSheets([PRIMARY_SHEET_URL, SECONDARY_SHEET_URL]);
      setCsvData(combinedData);
      
      // Log the data to see what columns are available
      console.log("Combined data from sheets:", combinedData);
      
      toast({
        title: "Data Loaded",
        description: `Successfully loaded ${combinedData.length} rows from Google Sheets`,
      });
    } catch (error) {
      console.error("Error fetching Google Sheet data:", error);
      toast({
        title: "Error",
        description: "Failed to load data from Google Sheets",
        variant: "destructive",
      });
    } finally {
      setIsFetchingCsv(false);
    }
  };

  // Find matching center data from Google Sheets based on query
  const findMatchingCenterData = (queryText: string): Record<string, any> | null => {
    if (!csvData.length) return null;
    
    const centerQuery = queryText.trim().toLowerCase();
    if (!centerQuery) return null;
    
    // Exact match
    for (const row of csvData) {
      const centerName = row["Center Name"]?.toLowerCase() || "";
      
      if (centerName && centerName === centerQuery) {
        return {
          center_name: row["Center Name"],
          fpstream_url: row["Streaming URL"] || "",
          public_ip: row["NVR Login URL"] || row["NVR URL"] || "" // Check both column names
        };
      }
    }
    
    // Partial match - starts with
    for (const row of csvData) {
      const centerName = row["Center Name"]?.toLowerCase() || "";
      
      if (centerName && centerName.startsWith(centerQuery)) {
        return {
          center_name: row["Center Name"],
          fpstream_url: row["Streaming URL"] || "",
          public_ip: row["NVR Login URL"] || row["NVR URL"] || "" // Check both column names
        };
      }
    }
    
    // Partial match - contains
    for (const row of csvData) {
      const centerName = row["Center Name"]?.toLowerCase() || "";
      
      if (centerName && centerName.includes(centerQuery)) {
        return {
          center_name: row["Center Name"],
          fpstream_url: row["Streaming URL"] || "",
          public_ip: row["NVR Login URL"] || row["NVR URL"] || "" // Check both column names
        };
      }
    }
    
    // Word match
    for (const row of csvData) {
      const centerName = row["Center Name"]?.toLowerCase() || "";
      
      if (centerName) {
        const words = centerQuery.split(/\s+/);
        for (const word of words) {
          if (word.length > 2 && centerName.includes(word)) {
            return {
              center_name: row["Center Name"],
              fpstream_url: row["Streaming URL"] || "",
              public_ip: row["NVR Login URL"] || row["NVR URL"] || "" // Check both column names
            };
          }
        }
      }
    }
    
    return null;
  };

  // Process query to find matching center
  const processQuery = async (centerNameQuery: string) => {
    setIsLoading(true);
    setResponse("Searching for center...");
    setSuggestedChanges({});

    try {
      // Try to find matching center from Google Sheets data
      const match = findMatchingCenterData(centerNameQuery);
      
      if (match) {
        setResponse(`Found information for "${match.center_name}". Review the suggested updates below.`);
        setSuggestedChanges(match);
      } else {
        setResponse("No matching center found. Please check the center name and try again.");
      }
    } catch (error) {
      console.error("Error processing query:", error);
      setResponse("An error occurred while searching for the center. Please try again.");
      
      toast({
        title: "Error",
        description: "Failed to process your query. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) {
      toast({
        title: "Empty Query",
        description: "Please enter a center name to search.",
        variant: "destructive",
      });
      return;
    }

    await processQuery(query);
  };

  const acceptAllChanges = () => {
    if (Object.keys(suggestedChanges).length === 0) {
      toast({
        title: "No Changes",
        description: "There are no suggested changes to apply.",
        variant: "destructive",
      });
      return;
    }
    
    onUpdateConfig(suggestedChanges);
    toast({
      title: "Changes Applied",
      description: `Applied ${Object.keys(suggestedChanges).length} configuration changes.`
    });
    setSuggestedChanges({});
  };

  const acceptSingleChange = (key: string, value: any) => {
    onUpdateConfig({ [key]: value });
    
    // Remove this key from suggested changes
    const updatedSuggestions = { ...suggestedChanges };
    delete updatedSuggestions[key];
    setSuggestedChanges(updatedSuggestions);
    
    toast({
      title: "Change Applied",
      description: `Updated "${key}" in your configuration.`
    });
  };

  const rejectSingleChange = (key: string) => {
    // Remove this key from suggested changes
    const updatedSuggestions = { ...suggestedChanges };
    delete updatedSuggestions[key];
    setSuggestedChanges(updatedSuggestions);
    
    toast({
      description: `Rejected change for "${key}".`
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="query">Enter a center name to search</Label>
          {isFetchingCsv ? (
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Loading data...
            </div>
          ) : csvData.length > 0 ? (
            <div className="text-xs text-green-600 flex items-center gap-1">
              <Search className="h-3 w-3" /> 
              {csvData.length} centers loaded
            </div>
          ) : (
            <Button type="button" onClick={fetchGoogleSheetData} variant="outline" size="sm" className="h-6 text-xs">
              Reload data
            </Button>
          )}
        </div>
        <Textarea
          id="query"
          placeholder="Enter center name (e.g., Dwarka)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="min-h-[100px]"
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox 
          id="useCustomApi" 
          checked={useCustomApi} 
          onCheckedChange={(checked) => setUseCustomApi(checked === true)}
        />
        <Label htmlFor="useCustomApi" className="text-sm font-normal">Use custom API endpoint</Label>
      </div>

      {useCustomApi && (
        <div className="space-y-2">
          <Label htmlFor="apiUrl">API URL</Label>
          <Input
            id="apiUrl"
            placeholder="https://api.example.com/update-config"
            value={customApiUrl}
            onChange={(e) => setCustomApiUrl(e.target.value)}
          />
        </div>
      )}

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? "Searching..." : "Search Center"}
      </Button>

      {response && (
        <div className="mt-4 p-3 bg-gray-50 rounded-md">
          <p className="font-medium mb-1">Response:</p>
          <p className="text-sm">{response}</p>
        </div>
      )}

      {Object.keys(suggestedChanges).length > 0 && (
        <div className="mt-4 border rounded-md overflow-hidden">
          <div className="bg-gray-50 p-3 border-b">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Suggested Updates</h3>
              <Button onClick={acceptAllChanges} size="sm" variant="outline" className="h-8 text-xs">
                Apply All
              </Button>
            </div>
          </div>
          
          <ScrollArea className="max-h-80">
            <div className="divide-y">
              {Object.entries(suggestedChanges).map(([key, value]) => {
                // Skip center_name - just show it as reference but don't offer to update it
                if (key === "center_name") return null;
                
                // Add a label to help users understand what public_ip means
                const displayLabel = key === "public_ip" ? "public_ip (NVR Login URL)" : key;
                
                return (
                  <div key={key} className="p-3 flex items-center justify-between hover:bg-gray-50">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{displayLabel}</span>
                        <Badge variant="outline" className="text-xs">
                          {typeof value === 'number' ? 'number' : 'text'}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-500 break-all">{value?.toString()}</div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => acceptSingleChange(key, value)} 
                        size="sm" 
                        variant="ghost" 
                        className="h-8 w-8 p-0"
                      >
                        <Check className="h-4 w-4 text-green-500" />
                      </Button>
                      <Button 
                        onClick={() => rejectSingleChange(key)} 
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                );
              })}
              
              {/* Always show the center_name as reference info */}
              {suggestedChanges.center_name && (
                <div className="p-3 bg-gray-50">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Center Name</span>
                      <Badge variant="secondary" className="text-xs">reference</Badge>
                    </div>
                    <div className="text-sm text-gray-500">{suggestedChanges.center_name}</div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      )}
    </form>
  );
};

export default QueryInterface;
