
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Loader2, Play, Video } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface ChannelViewerProps {
  currentConfig: any;
}

const ChannelViewer: React.FC<ChannelViewerProps> = ({ currentConfig }) => {
  const [ipAddress, setIpAddress] = useState(currentConfig.public_ip || "");
  const [port, setPort] = useState("1024");
  const [isLoading, setIsLoading] = useState(false);
  const [activeChannel, setActiveChannel] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("standard");
  
  // Generate channel numbers based on tab
  const channelNumbers = activeTab === "standard" 
    ? Array.from({ length: 20 }, (_, i) => i + 101) // Standard channels: 101-120
    : Array.from({ length: 20 }, (_, i) => i + 2001); // High channels: 2001-2020

  // Format IP address to remove any http:// or trailing paths/ports
  const formatIpAddress = (ip: string): string => {
    // Remove protocol prefix if present
    let formattedIp = ip.replace(/^https?:\/\//i, '');
    
    // Remove port and any trailing path
    formattedIp = formattedIp.split(':')[0];
    formattedIp = formattedIp.split('/')[0];
    
    return formattedIp;
  };

  // Generate RTSP URL for a specific channel
  const generateRtspUrl = (channelNumber: number): string => {
    const cleanIp = formatIpAddress(ipAddress);
    return `rtsp://${cleanIp}:${port}/Streaming/Channels/${channelNumber}`;
  };

  // Function to view a channel
  const viewChannel = (channelNumber: number) => {
    if (!ipAddress) {
      toast({
        title: "IP Address Required",
        description: "Please enter an IP address to view channels",
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="ipAddress">IP Address (from public_ip)</Label>
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
