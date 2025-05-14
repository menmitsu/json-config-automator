
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { RefreshCw, AlertCircle, Info, ExternalLink, Check, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const DEFAULT_IP = "144.48.76.142";
const DEFAULT_PORT = "8098";
const DEFAULT_CHANNEL = "102";

// Sample channels for quick selection
const PRESET_CHANNELS = [
  { id: "101", name: "Channel 101" },
  { id: "102", name: "Channel 102" },
  { id: "103", name: "Channel 103" },
  { id: "104", name: "Channel 104" },
];

const ImageTest = () => {
  const [ipAddress, setIpAddress] = useState(DEFAULT_IP);
  const [port, setPort] = useState(DEFAULT_PORT);
  const [channel, setChannel] = useState(DEFAULT_CHANNEL);
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [showImage, setShowImage] = useState(true);
  const [mixedContentDetected, setMixedContentDetected] = useState(false);
  const [protocol, setProtocol] = useState("");
  
  // Full image URL construction
  const getImageUrl = () => {
    const credentials = username ? `${username}${password ? `:${encodeURIComponent(password)}@` : '@'}` : '';
    return `http://${credentials}${ipAddress}:${port}/ISAPI/Streaming/channels/${channel}/picture`;
  };

  // Check the current protocol
  useEffect(() => {
    setProtocol(window.location.protocol);
    // If we're on HTTPS and trying to load HTTP content, we have a mixed content issue
    if (window.location.protocol === "https:") {
      setMixedContentDetected(true);
    } else {
      setMixedContentDetected(false);
    }
  }, []);

  const handleImageError = () => {
    console.error("Image failed to load");
    setShowImage(false);
    toast({
      title: "Image Load Failed",
      description: "Could not load the image from the URL",
      variant: "destructive",
    });
  };

  const handleImageLoad = () => {
    console.log("Image loaded successfully");
    setShowImage(true);
    toast({
      title: "Success",
      description: "Image loaded successfully",
    });
  };

  const refreshImage = () => {
    setShowImage(true);
    // Force a re-render of the image
    const img = document.querySelector('#camera-image') as HTMLImageElement;
    if (img) {
      const timestamp = new Date().getTime();
      img.src = `${getImageUrl()}?t=${timestamp}`;
    }
  };

  const handleChannelSelect = (channelId: string) => {
    setChannel(channelId);
    // Refresh the image with the new channel
    setTimeout(refreshImage, 100);
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Camera Image Viewer</h1>
      
      {mixedContentDetected && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Mixed Content Warning</AlertTitle>
          <AlertDescription>
            You're trying to load HTTP content on an HTTPS page ({protocol}). 
            For best results, open this page using HTTP instead of HTTPS, or run the app locally.
          </AlertDescription>
        </Alert>
      )}
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Camera Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="ipAddress">IP Address</Label>
              <Input 
                id="ipAddress" 
                value={ipAddress} 
                onChange={(e) => setIpAddress(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="port">Port</Label>
              <Input 
                id="port" 
                value={port} 
                onChange={(e) => setPort(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="username">Username</Label>
              <Input 
                id="username" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password"
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="channel">Channel</Label>
              <div className="flex gap-2">
                <Input 
                  id="channel" 
                  value={channel} 
                  onChange={(e) => setChannel(e.target.value)}
                  className="flex-1"
                />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">Preset Channels</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-background border border-input">
                    {PRESET_CHANNELS.map((ch) => (
                      <DropdownMenuItem 
                        key={ch.id} 
                        onClick={() => handleChannelSelect(ch.id)}
                      >
                        {ch.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <div className="flex items-end">
              <Button onClick={refreshImage} className="w-full">
                <RefreshCw className="mr-2 h-4 w-4" />
                Reload Image
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Camera Image</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border p-4 rounded-md">
            {showImage ? (
              <div className="flex justify-center">
                <img
                  id="camera-image"
                  src={getImageUrl()}
                  alt="Camera image"
                  className="max-w-full h-auto border"
                  onError={handleImageError}
                  onLoad={handleImageLoad}
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center bg-gray-100 rounded-md">
                <p className="mb-4">Image failed to load</p>
                <Button onClick={refreshImage}>Try Again</Button>
              </div>
            )}
          </div>
          
          <div className="mt-6 space-y-2">
            <h3 className="font-medium">Image URL:</h3>
            <div className="bg-gray-100 p-3 rounded-md">
              <p className="font-mono text-sm break-all">{getImageUrl()}</p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-muted/50">
          <p className="text-sm text-muted-foreground">
            Tip: If the image doesn't load, check credentials and network settings.
          </p>
        </CardFooter>
      </Card>
      
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            Troubleshooting
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none">
            <ul className="space-y-2">
              <li>
                <strong>Mixed Content:</strong> If using HTTPS, browsers will block HTTP image requests. Consider running the app locally or via HTTP.
              </li>
              <li>
                <strong>Authentication:</strong> Ensure username and password are correct.
              </li>
              <li>
                <strong>Network Access:</strong> Make sure the camera is accessible from your network.
              </li>
              <li>
                <strong>Channel Number:</strong> Verify that the channel exists on the camera.
              </li>
            </ul>
            
            <div className="mt-4">
              <a 
                href="https://developer.mozilla.org/en-US/docs/Web/Security/Mixed_content"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-blue-600 hover:text-blue-800"
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                Learn more about Mixed Content
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ImageTest;
