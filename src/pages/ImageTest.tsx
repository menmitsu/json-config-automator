
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { RefreshCw, AlertCircle, Info, ExternalLink } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const ImageTest = () => {
  const [imageUrl, setImageUrl] = useState("http://admin:fp%23bl170522@144.48.76.142:8098/ISAPI/Streaming/channels/102/picture");
  const [showImage, setShowImage] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("direct");
  const [corsProxyUrl, setCorsProxyUrl] = useState("https://corsproxy.io/?");
  const [mixedContentDetected, setMixedContentDetected] = useState(false);
  const [protocol, setProtocol] = useState("");

  // Check the current protocol
  useEffect(() => {
    setProtocol(window.location.protocol);
    // If we're on HTTPS and trying to load HTTP content, we have a mixed content issue
    if (window.location.protocol === "https:" && imageUrl.startsWith("http:")) {
      setMixedContentDetected(true);
    } else {
      setMixedContentDetected(false);
    }
  }, [imageUrl]);

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
    toast({
      title: "Success",
      description: "Image loaded successfully",
    });
  };

  const refreshImage = () => {
    setShowImage(true);
    // Force refresh by appending a cache-busting parameter
    const cacheBuster = `?cb=${new Date().getTime()}`;
    const baseUrl = imageUrl.split('?')[0]; // Remove any existing query params
    setImageUrl(`${baseUrl}${cacheBuster}`);
  };

  // Generate the proxied URL for CORS/Mixed Content issues
  const getProxiedUrl = () => {
    // Remove existing protocol
    const urlWithoutProtocol = imageUrl.replace(/^https?:\/\//, '');
    return `${corsProxyUrl}http://${urlWithoutProtocol}`;
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Image Loading Test Page</h1>
      
      {mixedContentDetected && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Mixed Content Warning</AlertTitle>
          <AlertDescription>
            You're trying to load HTTP content on an HTTPS page ({protocol}), which browsers block by default.
            Try using the Proxy tab or open this page directly on HTTP.
          </AlertDescription>
        </Alert>
      )}
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Test Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="imageUrl">Image URL</Label>
              <Input 
                id="imageUrl" 
                value={imageUrl.split('?')[0]} // Display without cache buster
                onChange={(e) => setImageUrl(e.target.value)}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Current page protocol: <strong>{protocol}</strong>
              </p>
            </div>
            
            {activeTab === "proxy" && (
              <div>
                <Label htmlFor="corsProxy">CORS Proxy URL</Label>
                <Input 
                  id="corsProxy" 
                  value={corsProxyUrl}
                  onChange={(e) => setCorsProxyUrl(e.target.value)}
                  className="font-mono text-sm"
                  placeholder="https://corsproxy.io/?"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter a CORS proxy URL that can bypass mixed content restrictions
                </p>
              </div>
            )}
            
            <Button onClick={refreshImage}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Reload Image
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="direct">Direct Access</TabsTrigger>
          <TabsTrigger value="proxy">Use Proxy (For HTTPS pages)</TabsTrigger>
        </TabsList>
        
        <TabsContent value="direct">
          <Card>
            <CardHeader>
              <CardTitle>Direct Image Test</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border p-4 rounded-md">
                {showImage ? (
                  <div className="flex justify-center">
                    <img
                      src={imageUrl}
                      alt="Test image"
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
                <h3 className="font-medium">Debugging Information:</h3>
                <div className="bg-gray-100 p-3 rounded-md">
                  <p className="font-mono text-sm break-all">
                    Direct image tag in HTML: <br />
                    {`<img src="${imageUrl.split('?')[0]}" referrerPolicy="no-referrer" crossOrigin="anonymous" />`}
                  </p>
                </div>
                <p className="text-sm text-gray-500">
                  Try opening the image URL directly in a new browser tab to compare results.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="proxy">
          <Card>
            <CardHeader>
              <CardTitle>Proxied Image Test</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border p-4 rounded-md">
                <div className="flex justify-center">
                  <img
                    src={getProxiedUrl()}
                    alt="Proxied test image"
                    className="max-w-full h-auto border"
                    onError={() => {
                      console.error("Proxied image failed to load");
                      toast({
                        title: "Proxy Image Failed",
                        description: "Could not load the image through the proxy",
                        variant: "destructive",
                      });
                    }}
                    onLoad={() => {
                      console.log("Proxied image loaded successfully");
                      toast({
                        title: "Proxy Success",
                        description: "Image loaded successfully through proxy",
                      });
                    }}
                    referrerPolicy="no-referrer"
                    crossOrigin="anonymous"
                  />
                </div>
              </div>
              
              <div className="mt-6 space-y-2">
                <h3 className="font-medium">Proxy URL:</h3>
                <div className="bg-gray-100 p-3 rounded-md">
                  <p className="font-mono text-sm break-all">
                    {getProxiedUrl()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            About Mixed Content
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none">
            <p>
              <strong>Mixed Content</strong> occurs when initial HTML is loaded over a secure HTTPS
              connection, but other resources (like images or scripts) are loaded over an insecure HTTP connection.
            </p>
            <p>
              Modern browsers block mixed content by default as a security measure.
              This is why HTTP images won't load on HTTPS pages.
            </p>
            
            <h4>Solutions:</h4>
            <ul>
              <li>Ensure all resources use HTTPS</li>
              <li>Use a CORS proxy service (as demonstrated in the Proxy tab)</li>
              <li>
                For testing only: Access the app on HTTP or disable mixed content blocking in your browser
                (not recommended for production)
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
        <CardFooter className="bg-muted/50">
          <p className="text-sm text-muted-foreground">
            For production use, always ensure all resources are served over HTTPS.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ImageTest;
