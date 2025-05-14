
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Loader2, Play, Video, Search, RefreshCw } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { fetchMultipleSheets } from "@/services/csvService";

interface ChannelViewerProps {
  currentConfig: any;
}

const ChannelViewer: React.FC<ChannelViewerProps> = ({ currentConfig }) => {
  const [ipAddress, setIpAddress] = useState(currentConfig.public_ip || "");
  const [port, setPort] = useState("1024");
  const [isLoading, setIsLoading] = useState(false);
  const [activeChannel, setActiveChannel] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("standard");
  const [centerQuery, setCenterQuery] = useState("");
  const [csvData, setCsvData] = useState<Record<string, string>[]>([]);
  const [isFetchingCsv, setIsFetchingCsv] = useState(false);
  const [searchResults, setSearchResults] = useState<Record<string, string>[]>([]);
  const [loginId, setLoginId] = useState("admin");
  const [password, setPassword] = useState("");
  
  // Google Sheets URLs
  const PRIMARY_SHEET_URL = "https://docs.google.com/spreadsheets/d/1EANvZgBTpp5siZVsgNjtWDUPZbZFsQALmBHO2zET7lw/edit?gid=0#gid=0";
  const SECONDARY_SHEET_URL = "https://docs.google.com/spreadsheets/d/1EANvZgBTpp5siZVsgNjtWDUPZbZFsQALmBHO2zET7lw/edit?gid=1876766802#gid=1876766802";
  
  // Generate channel numbers based on tab
  const channelNumbers = activeTab === "standard" 
    ? Array.from({ length: 20 }, (_, i) => i + 101) // Standard channels: 101-120
    : Array.from({ length: 20 }, (_, i) => i + 2001); // High channels: 2001-2020

  // Load data on component mount
  useEffect(() => {
    fetchGoogleSheetData();
  }, []);

  // Fetch Google Sheets data
  const fetchGoogleSheetData = async () => {
    setIsFetchingCsv(true);
    try {
      // Fetch data from both sheets
      const combinedData = await fetchMultipleSheets([PRIMARY_SHEET_URL, SECONDARY_SHEET_URL]);
      setCsvData(combinedData);
      
      toast({
        title: "Data Loaded",
        description: `Successfully loaded ${combinedData.length} centers from Google Sheets`,
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

  // Format IP address to remove any http:// or trailing paths/ports
  const formatIpAddress = (ip: string): string => {
    // Remove protocol prefix if present
    let formattedIp = ip.replace(/^https?:\/\//i, '');
    
    // Remove port and any trailing path
    formattedIp = formattedIp.split(':')[0];
    formattedIp = formattedIp.split('/')[0];
    
    return formattedIp;
  };

  // Escape special characters in password for RTSP URL
  const escapePassword = (pass: string): string => {
    return pass.replace(/#/g, '%23');
  };

  // Generate RTSP URL for a specific channel
  const generateRtspUrl = (channelNumber: number): string => {
    const cleanIp = formatIpAddress(ipAddress);
    
    // If login credentials are available, include them in the URL
    if (loginId && password) {
      const escapedPassword = escapePassword(password);
      return `rtsp://${loginId}:${escapedPassword}@${cleanIp}:${port}/Streaming/Channels/${channelNumber}`;
    } else {
      return `rtsp://${cleanIp}:${port}/Streaming/Channels/${channelNumber}`;
    }
  };

  // Search for centers by name
  const searchCenters = () => {
    if (!centerQuery.trim()) {
      toast({
        title: "Empty Query",
        description: "Please enter a center name to search",
        variant: "destructive"
      });
      return;
    }

    if (!csvData.length) {
      toast({
        title: "No Data",
        description: "Please wait for the data to load before searching",
        variant: "destructive"
      });
      return;
    }

    const query = centerQuery.toLowerCase().trim();
    
    // Search for matches in center name
    const results = csvData.filter(row => {
      const centerName = String(row["Center Name"] || "").toLowerCase();
      return centerName.includes(query);
    });

    setSearchResults(results);
    
    if (results.length === 0) {
      toast({
        title: "No Results",
        description: "No centers found with that name",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Search Results",
        description: `Found ${results.length} matching centers`,
      });
    }
  };

  // Select a center from search results
  const selectCenter = (center: Record<string, string>) => {
    // Get the NVR Login URL
    const nvrLoginUrl = center["NVR Login URL"];
    
    if (!nvrLoginUrl) {
      toast({
        title: "Missing Data",
        description: "This center doesn't have an NVR Login URL",
        variant: "destructive"
      });
      return;
    }
    
    // Extract IP from the NVR Login URL
    const extractedIp = formatIpAddress(nvrLoginUrl);
    setIpAddress(extractedIp);
    
    // Get RTSP port if available
    const rtspPort = center["rtsp port"];
    if (rtspPort) {
      setPort(rtspPort);
    }
    
    // Get login credentials
    const loginID = center["Login ID"];
    const pwd = center["Password"];
    
    if (loginID) {
      setLoginId(loginID);
    }
    
    if (pwd) {
      setPassword(pwd);
    }
    
    toast({
      title: "Center Selected",
      description: `IP Address set to ${extractedIp}${loginID ? `, Login ID: ${loginID}` : ""}`,
    });
    
    // Clear search results
    setSearchResults([]);
  };

  // Function to view a channel
  const viewChannel = (channelNumber: number) => {
    if (!ipAddress) {
      toast({
        title: "IP Address Required",
        description: "Please enter an IP address or search for a center",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setActiveChannel(channelNumber);

    // In a real application, we would connect to the RTSP stream here
    // For this demo, we'll simulate loading and then show a placeholder
    setTimeout(() => {
      setIsLoading(false);
      
      toast({
        title: "Channel Connected",
        description: `Connected to channel ${channelNumber}`
      });
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="centerQuery">Search for a center</Label>
          <div className="flex space-x-2">
            <Input 
              id="centerQuery"
              value={centerQuery}
              onChange={(e) => setCenterQuery(e.target.value)}
              placeholder="Enter center name (e.g., Dwarka)"
              onKeyDown={(e) => e.key === 'Enter' && searchCenters()}
            />
            <Button onClick={searchCenters} disabled={isFetchingCsv} type="button">
              {isFetchingCsv ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
            <Button onClick={fetchGoogleSheetData} variant="outline" type="button">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {searchResults.length > 0 && (
          <Card className="mt-4">
            <CardHeader className="py-2">
              <CardTitle className="text-sm">Search Results</CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <div className="max-h-40 overflow-auto space-y-1">
                {searchResults.map((result, index) => (
                  <Button 
                    key={index} 
                    variant="outline" 
                    className="w-full justify-start text-left h-auto py-2"
                    onClick={() => selectCenter(result)}
                  >
                    <div>
                      <div className="font-medium">{result["Center Name"]}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-xs">
                        {result["NVR Login URL"] || "No URL"}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="ipAddress">IP Address</Label>
          <Input 
            id="ipAddress" 
            value={ipAddress} 
            onChange={(e) => setIpAddress(e.target.value)}
            placeholder="Enter IP address"
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="port">RTSP Port</Label>
          <Input 
            id="port" 
            value={port} 
            onChange={(e) => setPort(e.target.value)}
            placeholder="1024"
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input 
            id="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="Password for RTSP authentication"
            className="mt-1"
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="standard">Standard Channels (101-120)</TabsTrigger>
          <TabsTrigger value="high">High Channels (2001-2020)</TabsTrigger>
        </TabsList>
      </Tabs>
      
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {channelNumbers.map((channelNum) => (
          <Button 
            key={channelNum}
            variant={activeChannel === channelNum ? "default" : "outline"}
            className="h-12"
            onClick={() => viewChannel(channelNum)}
          >
            <Play className="h-4 w-4 mr-2" />
            {channelNum}
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Video className="h-5 w-5" />
            {activeChannel ? `Channel ${activeChannel}` : 'No Channel Selected'}
          </CardTitle>
          {activeChannel && (
            <div className="text-xs text-muted-foreground">
              {generateRtspUrl(activeChannel)}
            </div>
          )}
        </CardHeader>
        <CardContent>
          <AspectRatio ratio={16/9} className="bg-muted relative overflow-hidden rounded-md">
            {isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : activeChannel ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                <Video className="h-16 w-16 mb-2" />
                <p className="text-sm">RTSP Stream Placeholder</p>
                <p className="text-xs mt-1">Channel {activeChannel}</p>
                <p className="text-xs mt-4 max-w-md text-center">
                  Note: Browser cannot display RTSP streams directly. In a real application, 
                  you would need a server-side component to convert RTSP to a web-compatible format.
                </p>
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                <p>Select a channel to view stream</p>
              </div>
            )}
          </AspectRatio>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChannelViewer;
