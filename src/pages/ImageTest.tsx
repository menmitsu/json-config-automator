
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { RefreshCw } from "lucide-react";

const ImageTest = () => {
  const [imageUrl, setImageUrl] = useState("http://admin:fp%23bl170522@144.48.76.142:8098/ISAPI/Streaming/channels/102/picture");
  const [showImage, setShowImage] = useState(true);

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

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Image Loading Test Page</h1>
      
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
            </div>
            
            <Button onClick={refreshImage}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Reload Image
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Image Test</CardTitle>
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
      
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>HTML-Only Test</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">This is a simple HTML img tag without React handling:</p>
          <div className="border p-4 rounded-md flex justify-center">
            <img 
              src="http://admin:fp%23bl170522@144.48.76.142:8098/ISAPI/Streaming/channels/102/picture"
              alt="Pure HTML test"
              className="max-w-full h-auto border"
              referrerPolicy="no-referrer"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ImageTest;
