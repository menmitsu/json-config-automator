
import React, { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { fetchCsvData } from "@/services/csvService";
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

  // Default Google Sheet URL
  const DEFAULT_SHEET_URL = "https://docs.google.com/spreadsheets/d/1EANvZgBTpp5siZVsgNjtWDUPZbZFsQALmBHO2zET7lw/edit?gid=0#gid=0";
  
  // Fetch CSV data on component mount
  useEffect(() => {
    fetchGoogleSheetData();
  }, []);

  const fetchGoogleSheetData = async () => {
    setIsFetchingCsv(true);
    try {
      const data = await fetchCsvData(DEFAULT_SHEET_URL);
      setCsvData(data);
      toast({
        title: "CSV Data Loaded",
        description: `Successfully loaded ${data.length} rows from Google Sheet`,
      });
    } catch (error) {
      console.error("Error fetching Google Sheet data:", error);
      toast({
        title: "Error",
        description: "Failed to load data from Google Sheet",
        variant: "destructive",
      });
    } finally {
      setIsFetchingCsv(false);
    }
  };

  // Find matching data from CSV based on query
  const findMatchingCsvData = (queryText: string): Record<string, any> | null => {
    if (!csvData.length) return null;
    
    const lowerQuery = queryText.toLowerCase();
    
    // Search for center name in the query
    for (const row of csvData) {
      const centerName = row["Center Name"]?.toLowerCase() || "";
      
      if (centerName && lowerQuery.includes(centerName.toLowerCase())) {
        return {
          center_name: row["Center Name"],
          fpstream_url: row["Streaming URL"],
          center_id: centerName.toLowerCase().replace(/\s+/g, "_") + "_" + Math.floor(Math.random() * 900 + 100),
          // Add more mappings as needed
        };
      }
    }
    
    // Search for partial matches if exact match not found
    for (const row of csvData) {
      const centerName = row["Center Name"]?.toLowerCase() || "";
      
      if (centerName) {
        const centerWords = centerName.split(/\s+/);
        for (const word of centerWords) {
          if (word.length > 3 && lowerQuery.includes(word.toLowerCase())) {
            return {
              center_name: row["Center Name"],
              fpstream_url: row["Streaming URL"],
              center_id: centerName.toLowerCase().replace(/\s+/g, "_") + "_" + Math.floor(Math.random() * 900 + 100),
              // Add more mappings as needed
            };
          }
        }
      }
    }
    
    return null;
  };

  // Process query and update config based on CSV data
  const processQuery = async (questionText: string) => {
    setIsLoading(true);
    setResponse("Processing request...");
    setSuggestedChanges({});

    try {
      // Try to find matching data from CSV
      const csvMatch = findMatchingCsvData(questionText);
      
      // Initialize updates object
      let updates: Record<string, any> = {};
      
      // If we found a match in the CSV
      if (csvMatch) {
        updates = { ...csvMatch };
        
        // If streaming URL found, generate a channel number
        if (csvMatch.fpstream_url) {
          updates.channel = Math.floor(Math.random() * 999) + 1;
        }
        
        setResponse(`Found information in Google Sheet for "${csvMatch.center_name}". Review the suggested changes below.`);
        setSuggestedChanges(updates);
      } else {
        // Fallback to the default mock behavior if no CSV match found
        const lowerQuery = questionText.toLowerCase();

        // This is just a demonstration - in a real app, you'd connect to actual APIs
        if (lowerQuery.includes("camera")) {
          updates.camera_id = `CAM-${Math.floor(Math.random() * 9000) + 1000}`;
        }
        
        if (lowerQuery.includes("center") || lowerQuery.includes("branch")) {
          const centers = ["Dwarka", "Rohini", "Vasant Kunj", "Noida", "Gurgaon"];
          const randomCenter = centers[Math.floor(Math.random() * centers.length)];
          updates.center_id = `${randomCenter.toLowerCase()}_${Math.floor(Math.random() * 900) + 100}`;
          updates.center_name = `${randomCenter} Branch`;
        }
        
        if (lowerQuery.includes("classroom")) {
          const classroomSizes = ["small", "medium", "large"];
          const randomSize = classroomSizes[Math.floor(Math.random() * classroomSizes.length)];
          updates.classroom_size = randomSize;
          updates.classroom_name = `Classroom ${String.fromCharCode(65 + Math.floor(Math.random() * 6))}`;
          updates.classroom_code = `${currentConfig.center_id || "center"}_${Math.floor(Math.random() * 9000) + 1000}`;
        }

        if (lowerQuery.includes("ip") || lowerQuery.includes("address")) {
          updates.public_ip = `${Math.floor(Math.random() * 223) + 1}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
          updates.cut_evidence_ip = `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
        }

        if (lowerQuery.includes("stream") || lowerQuery.includes("url")) {
          updates.fpstream_url = `https://fp.streamonweb.com/footprints/live/${(currentConfig.center_id || "center").toLowerCase()}stream${Math.floor(Math.random() * 100)}`;
        }

        if (lowerQuery.includes("whatsapp") || lowerQuery.includes("group")) {
          updates.whatsapp_group_id = `${Math.floor(Math.random() * 9000000000) + 1000000000}@group.whatsapp.com`;
        }

        if (lowerQuery.includes("channel")) {
          updates.channel = Math.floor(Math.random() * 999) + 1;
        }

        if (Object.keys(updates).length > 0) {
          setResponse(`Here are suggested changes based on your query. Review and apply if they look good.`);
          setSuggestedChanges(updates);
        } else {
          setResponse("I couldn't find any specific configuration to update based on your question. Please be more specific about what you want to update (e.g., camera, center, classroom, IP, streaming URL, WhatsApp group, channel).");
        }
      }
    } catch (error) {
      console.error("Error processing query:", error);
      setResponse("An error occurred while processing your query. Please try again.");
      
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
        description: "Please enter a question to suggest configuration changes.",
        variant: "destructive",
      });
      return;
    }

    if (useCustomApi && !customApiUrl) {
      toast({
        title: "Missing API URL",
        description: "Please provide a custom API URL or disable the custom API option.",
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
          <Label htmlFor="query">Ask a question to update the configuration</Label>
          {isFetchingCsv ? (
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Loading data...
            </div>
          ) : csvData.length > 0 ? (
            <div className="text-xs text-green-600 flex items-center gap-1">
              <Search className="h-3 w-3" /> 
              {csvData.length} rows loaded
            </div>
          ) : (
            <Button type="button" onClick={fetchGoogleSheetData} variant="outline" size="sm" className="h-6 text-xs">
              Reload data
            </Button>
          )}
        </div>
        <Textarea
          id="query"
          placeholder="e.g., What's the streaming URL for Dwarka center?"
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
        {isLoading ? "Processing..." : "Submit Query"}
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
              <h3 className="font-medium">Suggested Changes</h3>
              <Button onClick={acceptAllChanges} size="sm" variant="outline" className="h-8 text-xs">
                Apply All
              </Button>
            </div>
          </div>
          
          <ScrollArea className="max-h-80">
            <div className="divide-y">
              {Object.entries(suggestedChanges).map(([key, value]) => (
                <div key={key} className="p-3 flex items-center justify-between hover:bg-gray-50">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{key}</span>
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
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </form>
  );
};

export default QueryInterface;
