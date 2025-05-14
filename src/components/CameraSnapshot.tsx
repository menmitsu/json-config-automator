
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { Loader2, Image, RefreshCw } from "lucide-react";
import { fetchRtspFrame } from "@/services/rtspService";

const CameraSnapshot: React.FC = () => {
  const [url, setUrl] = useState('http://144.48.76.142:8098/ISAPI/Streaming/channels/102/picture');
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('fp#bl170522');
  const [isLoading, setIsLoading] = useState(false);
  const [imageData, setImageData] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFetchImage = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Use the rtspService to fetch the image
      const frameData = await fetchRtspFrame(url, username, password);
      
      if (!frameData) {
        throw new Error("Failed to receive image data");
      }
      
      setImageData(frameData);
      toast({
        title: "Success",
        description: "Image successfully captured",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
      setImageData(null);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to capture image",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Camera Snapshot</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleFetchImage} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="url">Camera URL</Label>
            <Input 
              id="url" 
              value={url} 
              onChange={(e) => setUrl(e.target.value)}
              placeholder="http://camera-ip:port/ISAPI/Streaming/channels/101/picture"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input 
                id="username" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                placeholder="password"
              />
            </div>
          </div>
          
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Fetching...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Fetch Image
              </>
            )}
          </Button>
        </form>

        {error && (
          <div className="bg-destructive/15 text-destructive p-3 rounded-md text-sm">
            Error: {error}
          </div>
        )}

        {imageData && (
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Captured Image</h3>
            <div className="border rounded-md overflow-hidden">
              <img 
                src={imageData} 
                alt="Camera snapshot" 
                className="max-w-full h-auto"
                onError={() => {
                  setError("Failed to display image data");
                  toast({
                    title: "Error",
                    description: "Failed to display the received image data",
                    variant: "destructive"
                  });
                }}
              />
            </div>
          </div>
        )}

        {!imageData && !error && !isLoading && (
          <div className="flex flex-col items-center justify-center p-8 text-center bg-muted rounded-md">
            <Image className="h-12 w-12 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No image captured yet</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground">
        <p>
          Images are fetched securely through Supabase Edge Functions to avoid CORS issues.
        </p>
      </CardFooter>
    </Card>
  );
};

export default CameraSnapshot;
