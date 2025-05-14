import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { Loader2, Play, Video, Search, RefreshCw, Image, Terminal } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { fetchMultipleSheets } from "@/services/csvService";

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
  const [password, setPassword] = useState("fp123456");
  const [imageUrl, setImageUrl] = useState("");
  const [imageError, setImageError] = useState<string | null>(null);
  const [httpCommand, setHttpCommand] = useState("");
  const [directImageUrl, setDirectImageUrl] = useState("http://admin:fp123456@122.176.135.50:8098/ISAPI/Streaming/channels/102/picture");
  const [showDirectImage, setShowDirectImage] = useState(true);
  
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

  // Format IP address and port
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

  // Generate HTTP image URL for a specific channel with authentication
  const generateImageUrl = (channelNumber: number): string => {
    const { cleanIp, extractedPort } = formatIpAddress(ipAddress);
    const portToUse = extractedPort || port || "80";
    
    // URL encode the username and password - ensure special characters are properly encoded
    const encodedLoginId = encodeURIComponent(loginId);
    const encodedPassword = encodeURIComponent(password);
    
    // Build the URL with encoded credentials
    let baseUrl = `http://${encodedLoginId}:${encodedPassword}@${cleanIp}:${portToUse}/ISAPI/Streaming/channels/${channelNumber}/picture`;
    
    // Update HTTP command for display with proper escaping for terminal
    setHttpCommand(`curl -u "${loginId}:${password.replace(/"/g, '\\"')}" "http://${cleanIp}:${portToUse}/ISAPI/Streaming/channels/${channelNumber}/picture" -o snapshot.jpg`);
    
    return baseUrl;
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
    const { cleanIp, extractedPort } = formatIpAddress(nvrLoginUrl);
    setIpAddress(nvrLoginUrl); // Set the full URL to preserve port
    
    // Only set port if it wasn't found in the URL and is available in CSV
    if (!extractedPort) {
      const rtspPort = center["rtsp port"];
      if (rtspPort) {
        setPort(rtspPort);
      }
    }
    
    // Get login credentials from the CSV data
    const loginID = center["Login ID"];
    const pwd = center["Password"];
    
    if (loginID) {
      setLoginId(loginID);
    } else {
      setLoginId("admin"); // Default fallback
    }
    
    if (pwd) {
      setPassword(pwd);
    } else {
      setPassword("fp123456"); // Default fallback
    }
    
    // Also update the direct image test URL
    const encodedLoginID = encodeURIComponent(loginID || "admin");
    const encodedPwd = encodeURIComponent(pwd || "fp123456");
    
    const portToUse = extractedPort || "80";
    const directUrl = `http://${encodedLoginID}:${encodedPwd}@${cleanIp}:${portToUse}/ISAPI/Streaming/channels/102/picture`;
    setDirectImageUrl(directUrl);
    setShowDirectImage(true); // Reset display state
    
    toast({
      title: "Center Selected",
      description: `IP Address set to ${cleanIp}${extractedPort ? `, Port: ${extractedPort}` : ""}${loginID ? `, Login ID: ${loginID}` : ""}${pwd ? `, Password set` : ""}`,
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
    setImageError(null);
    
    // Generate image URL without timestamp to prevent caching issues
    const baseUrl = generateImageUrl(channelNumber);
    setImageUrl(baseUrl);
    
    toast({
      title: "Loading Image",
      description: `Attempting to load image from channel ${channelNumber}`
    });
  };

  // Function to manually refresh the current frame
  const refreshFrame = () => {
    if (activeChannel) {
      // Simply call viewChannel again to refresh
      viewChannel(activeChannel);
      
      toast({
        title: "Manual Refresh",
        description: "Refreshing image..."
      });
    }
  };

  const handleImageLoad = () => {
    setIsLoading(false);
    setImageError(null);
    console.log("Image loaded successfully");
  };

  const handleImageError = () => {
    setIsLoading(false);
    setImageError(`Failed to load image from channel ${activeChannel}`);
    console.error(`Failed to load image from channel ${activeChannel}`);
    toast({
      title: "Image Load Failed",
      description: "Could not load image from the camera",
      variant: "destructive"
    });
  };

  // Function to refresh the direct image test URL
  const refreshDirectImageUrl = () => {
    // Re-create URL with proper encoding but without timestamp
    const { cleanIp, extractedPort } = formatIpAddress(ipAddress || "");
    const portToUse = extractedPort || port || "80";
    
    // Properly encode the credentials
    const encodedLoginID = encodeURIComponent(loginId);
    const encodedPassword = encodeURIComponent(password);
    
    // Build the URL with proper encoding
    const newUrl = `http://${encodedLoginID}:${encodedPassword}@${cleanIp || "122.176.135.50"}:${portToUse}/ISAPI/Streaming/channels/102/picture`;
    
    setDirectImageUrl(newUrl);
    setShowDirectImage(true); // Reset display state
    
    toast({
      title: "Test Image Refreshed",
      description: "Direct image test URL refreshed with encoded credentials"
    });
  };

  // Function to handle direct image error
  const handleDirectImageError = () => {
    console.error("Direct image test loading failed");
    setShowDirectImage(false);
    toast({
      title: "Test Image Failed",
      description: "Could not load test image. Check credentials and URL.",
      variant: "destructive"
    });
  };

  return (
    <div className="space-y-6">
      {/* Search section */}
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

        {/* Search Results */}
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

      {/* Credential inputs */}
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
          <Label htmlFor="loginId">Login ID</Label>
          <Input 
            id="loginId" 
            value={loginId} 
            onChange={(e) => setLoginId(e.target.value)}
            placeholder="admin"
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
            placeholder="Password for authentication"
            className="mt-1"
          />
        </div>
      </div>

      {/* Channel tabs and buttons */}
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

      {/* Main image display card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Video className="h-5 w-5" />
            {activeChannel ? `Channel ${activeChannel}` : 'No Channel Selected'}
          </CardTitle>
          {activeChannel && (
            <div className="text-xs text-muted-foreground">
              Use manual refresh for new image
            </div>
          )}
        </CardHeader>
        <CardContent>
          <AspectRatio ratio={16/9} className="bg-muted relative overflow-hidden rounded-md">
            {/* Image loading states */}
            {isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <span className="ml-2">Loading image...</span>
              </div>
            ) : activeChannel ? (
              <div className="absolute inset-0">
                {imageUrl && (
                  <img 
                    src={imageUrl}
                    alt={`Frame from channel ${activeChannel}`}
                    className="w-full h-full object-cover"
                    onLoad={handleImageLoad}
                    onError={handleImageError}
                    referrerPolicy="no-referrer"
                    crossOrigin="anonymous"
                  />
                )}
                
                {imageError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                    <Image className="h-16 w-16 mb-2" />
                    <p className="text-sm">{imageError}</p>
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
                )}

                <div className="absolute bottom-4 right-4">
                  <Button 
                    size="sm" 
                    variant="secondary" 
                    onClick={refreshFrame}
                    className="opacity-80 hover:opacity-100"
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Manual Refresh
                  </Button>
                </div>
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                <p>Select a channel to view frame</p>
              </div>
            )}
          </AspectRatio>
          <div className="text-xs mt-2 text-muted-foreground text-center">
            {activeChannel && (
              <p>Click "Manual Refresh" button to update the image.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* HTTP Command Display */}
      {activeChannel && httpCommand && (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="flex items-center gap-2 text-md">
              <Terminal className="h-4 w-4" />
              HTTP Command
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-900 text-gray-100 p-3 rounded-md overflow-x-auto">
              <code className="text-sm whitespace-pre-wrap break-all">{httpCommand}</code>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              This command can be used in terminal/command prompt to download the current frame.
            </p>
          </CardContent>
        </Card>
      )}
      
      {/* Debug Information - Direct Image Example */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Direct Image Test</CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshDirectImageUrl}
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh Test Image
          </Button>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm">This is a simple direct image tag for testing:</p>
          <div className="border p-4 rounded-md">
            <div className="flex flex-col items-center">
              {showDirectImage ? (
                <img
                  src={directImageUrl}
                  alt="Snapshot from camera 102"
                  className="max-w-full h-auto"
                  onError={handleDirectImageError}
                  onLoad={() => console.log("Direct image test loaded successfully")}
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <Image className="h-12 w-12 mb-2 text-gray-400" />
                  <p>Image failed to load</p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setShowDirectImage(true);
                      refreshDirectImageUrl();
                    }}
                    className="mt-3"
                  >
                    Try Again
                  </Button>
                </div>
              )}
              <p className="text-center text-sm mt-2">
                If the image isn't showing, try the "Refresh Test Image" button
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Complete URL: <span className="font-mono break-all">{directImageUrl}</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Note: Special characters like # have been URL encoded as %23
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChannelViewer;
