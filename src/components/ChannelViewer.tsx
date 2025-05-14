import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Loader2, Play, Video, Search, RefreshCw, Image } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { fetchMultipleSheets } from "@/services/csvService";
import { fetchRtspFrame } from "@/services/rtspService";

interface ChannelViewerProps {
  currentConfig: any;
}

const ChannelViewer: React.FC<ChannelViewerProps> = ({ currentConfig }) => {
  const [ipAddress, setIpAddress] = useState(currentConfig.public_ip || "");
  const [port, setPort] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeChannel, setActiveChannel] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("standard");
  const [centerQuery, setCenterQuery] = useState("");
  const [csvData, setCsvData] = useState<Record<string, string>[]>([]);
  const [isFetchingCsv, setIsFetchingCsv] = useState(false);
  const [searchResults, setSearchResults] = useState<Record<string, string>[]>([]);
  const [loginId, setLoginId] = useState("admin");
  const [password, setPassword] = useState("");
  const [frameUrl, setFrameUrl] = useState<string | null>(null);
  const [isCapturingFrame, setIsCapturingFrame] = useState(false);
  
  // Google Sheets URLs
  const PRIMARY_SHEET_URL = "https://docs.google.com/spreadsheets/d/1EANvZgBTpp5siZVsgNjtWDUPZbZFsQALmBHO2zET7lw/edit?gid=0#gid=0";
  const SECONDARY_SHEET_URL = "https://docs.google.com/spreadsheets/d/1EANvZgBTpp5siZVsgNjtWDUPZbZFsQALmBHO2zET7lw/edit?gid=1876766802#gid=1876766802";
  
  // Generate channel numbers based on tab
  const channelNumbers = activeTab === "standard" 
    ? Array.from({ length: 20 }, (_, i) => i + 101) // Standard channels: 101-120
    : Array.from({ length: 20 }, (_, i) => i + 2001); // High channels: 2001-2020

  // Extract port from URL when ipAddress changes
  useEffect(() => {
    if (ipAddress) {
      // Try to extract port from the URL
      const urlRegex = /:(\d+)/;
      const portMatch = ipAddress.match(urlRegex);
      
      if (portMatch && portMatch[1]) {
        console.log(`Extracted port ${portMatch[1]} from URL`);
        setPort(portMatch[1]);
      } else {
        // Default port if not found
        console.log("No port found in URL, using default");
        setPort("80");
      }
    }
  }, [ipAddress]);

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

  // Format IP address and port - now separates port from IP
  const formatIpAddress = (ip: string): { cleanIp: string, extractedPort: string | null } => {
    // Remove protocol prefix if present
    let formattedIp = ip.replace(/^https?:\/\//i, '');
    
    // Check if there's a port in the URL
    const portRegex = /:(\d+)/;
    const portMatch = formattedIp.match(portRegex);
    let extractedPort = null;
    
    if (portMatch && portMatch[1]) {
      extractedPort = portMatch[1];
      // Remove port from IP for clean formatting
      formattedIp = formattedIp.split(':')[0];
    }
    
    // Remove any trailing path
    formattedIp = formattedIp.split('/')[0];
    
    return { cleanIp: formattedIp, extractedPort };
  };

  // Escape special characters in password for URL
  const escapePassword = (pass: string): string => {
    return pass.replace(/#/g, '%23');
  };

  // Generate HTTP image URL for a specific channel
  const generateImageUrl = (channelNumber: number): string => {
    const { cleanIp, extractedPort } = formatIpAddress(ipAddress);
    const portToUse = extractedPort || port || "80";
    
    // If login credentials are available, include them in the URL
    if (loginId && password) {
      const escapedPassword = escapePassword(password);
      return `http://${loginId}:${escapedPassword}@${cleanIp}:${portToUse}/ISAPI/Streaming/channels/${channelNumber}/picture`;
    } else {
      return `http://${cleanIp}:${portToUse}/ISAPI/Streaming/channels/${channelNumber}/picture`;
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
    
    // Extract IP from the NVR Login URL - now using the new function
    const { cleanIp, extractedPort } = formatIpAddress(nvrLoginUrl);
    setIpAddress(nvrLoginUrl); // Set the full URL to preserve port
    
    // Only set port if it wasn't found in the URL and is available in CSV
    if (!extractedPort) {
      const rtspPort = center["rtsp port"];
      if (rtspPort) {
        setPort(rtspPort);
      }
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
      description: `IP Address set to ${cleanIp}${extractedPort ? `, Port: ${extractedPort}` : ""}${loginID ? `, Login ID: ${loginID}` : ""}`,
    });
    
    // Clear search results
    setSearchResults([]);
  };

  // Function to view a channel and capture a frame
  const viewChannel = async (channelNumber: number) => {
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
    setFrameUrl(null); // Clear previous frame
    setIsCapturingFrame(true);

    const imageUrl = generateImageUrl(channelNumber);
    console.log(`Generated image URL: ${imageUrl}`);
    
    try {
      // Try to capture an image from the HTTP URL
      const capturedFrame = await fetchRtspFrame(imageUrl);
      
      if (capturedFrame) {
        setFrameUrl(capturedFrame);
        toast({
          title: "Image Captured",
          description: `Successfully captured image from channel ${channelNumber}`
        });
      } else {
        toast({
          title: "Image Capture Failed",
          description: "Could not capture image from the camera",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error viewing channel:", error);
      toast({
        title: "Error",
        description: "Failed to connect to the camera",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setIsCapturingFrame(false);
    }
  };

  // Function to refresh the current frame
  const refreshFrame = async () => {
    if (activeChannel) {
      setIsCapturingFrame(true);
      try {
        const imageUrl = generateImageUrl(activeChannel);
        const capturedFrame = await fetchRtspFrame(imageUrl);
        
        if (capturedFrame) {
          setFrameUrl(capturedFrame);
          toast({
            title: "Image Refreshed",
            description: `Successfully refreshed image from channel ${activeChannel}`
          });
        }
      } catch (error) {
        console.error("Error refreshing image:", error);
        toast({
          title: "Error",
          description: "Failed to refresh the image",
          variant: "destructive"
        });
      } finally {
        setIsCapturingFrame(false);
      }
    }
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
          <Label htmlFor="ipAddress">NVR URL</Label>
          <Input 
            id="ipAddress" 
            value={ipAddress} 
            onChange={(e) => setIpAddress(e.target.value)}
            placeholder="Enter IP address with port (e.g., 122.176.135.50:8098)"
            className="mt-1"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Include the port in the URL (e.g., 122.176.135.50:8098)
          </p>
        </div>
        <div>
          <Label htmlFor="port">Port (auto-detected)</Label>
          <Input 
            id="port" 
            value={port} 
            onChange={(e) => setPort(e.target.value)}
            placeholder="80"
            className="mt-1"
            disabled={ipAddress.includes(":")}
          />
          <p className="text-xs text-muted-foreground mt-1">
            {ipAddress.includes(":") ? "Port detected from URL" : "Manual port entry"}
          </p>
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input 
            id="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="Password for authentication"
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
              {generateImageUrl(activeChannel)}
            </div>
          )}
        </CardHeader>
        <CardContent>
          <AspectRatio ratio={16/9} className="bg-muted relative overflow-hidden rounded-md">
            {isLoading || isCapturingFrame ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : frameUrl && activeChannel ? (
              <div className="absolute inset-0">
                <img 
                  src={frameUrl} 
                  alt={`Frame from channel ${activeChannel}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-4 right-4">
                  <Button 
                    size="sm" 
                    variant="secondary" 
                    onClick={refreshFrame}
                    className="opacity-80 hover:opacity-100"
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Refresh
                  </Button>
                </div>
              </div>
            ) : activeChannel ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                <Image className="h-16 w-16 mb-2" />
                <p className="text-sm">Failed to capture frame</p>
                <p className="text-xs mt-1">Channel {activeChannel}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => viewChannel(activeChannel)}
                  className="mt-4"
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Try Again
                </Button>
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                <p>Select a channel to view frame</p>
              </div>
            )}
          </AspectRatio>
          <div className="text-xs mt-2 text-muted-foreground text-center">
            {frameUrl && activeChannel && (
              <p>Single frame captured from HTTP URL. Refresh to get the latest frame.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChannelViewer;
