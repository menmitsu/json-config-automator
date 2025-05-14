
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { RefreshCw, AlertCircle, Info, ExternalLink, Check, X, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// List of CORS proxies to try - many options with focus on Indian region
const CORS_PROXIES = [
  { id: "corsproxy", url: "https://corsproxy.io/?", name: "CORS Proxy IO" },
  { id: "corsanywhere", url: "https://cors-anywhere.herokuapp.com/", name: "CORS Anywhere" },
  { id: "allorigins", url: "https://api.allorigins.win/raw?url=", name: "All Origins" },
  { id: "proxyfyio", url: "https://api.proxyfy.io/v1/proxy?url=", name: "Proxyfy IO" },
  { id: "jsonp", url: "https://jsonp.afeld.me/?url=", name: "JSONP ME" },
  { id: "thingproxy", url: "https://thingproxy.freeboard.io/fetch/", name: "ThingProxy" },
  { id: "apiproxyfree", url: "https://api.proxyscrape.com/v2/?request=displayproxies&protocol=http", name: "API Proxy Free" },
  { id: "yesno", url: "https://api.yesno.wtf/proxy/", name: "YesNo Proxy" },
  { id: "bypass", url: "https://api.bypass.vip/?url=", name: "Bypass VIP" },
  { id: "whatcors", url: "https://whatcors.vercel.app/api?url=", name: "WhatCORS" },
  { id: "akshit", url: "https://proxy.akshit.cc/?url=", name: "Akshit Proxy" },
  { id: "codeblock", url: "https://cors.codeblock.cz/?url=", name: "Codeblock CZ" },
  { id: "nsfw", url: "https://api.nsfw.xxx/proxy?url=", name: "NSFW Proxy" },
  { id: "hackerearth", url: "https://cors.hackerearth.com/", name: "HackerEarth (India)" },
  { id: "onrender", url: "https://cors-proxy-server-two.onrender.com/api?url=", name: "OnRender" },
  { id: "nextjs", url: "https://nextjs-cors-proxy.vercel.app/api?url=", name: "NextJS Proxy" },
  { id: "allorsignin", url: "https://api.allorigins.win/get?url=", name: "All Origins Get" },
  { id: "proxylist", url: "https://www.proxylist.geonode.com/api/proxy-list?limit=10&page=1&sort_by=lastChecked&sort_type=desc&country=IN", name: "GeoNode India" },
  { id: "proxylistapp", url: "https://proxy-list.app/api/proxy?lastChecked=300&country=IN", name: "Proxy List App (India)" },
  { id: "cloudflare", url: "https://cloudflare-cors-anywhere.andy-3.workers.dev/?", name: "Cloudflare Workers" },
  { id: "cors-anywhere-worker", url: "https://cors-anywhere-worker.warengonzaga.workers.dev/?", name: "CORS Worker" },
  { id: "rapidapi", url: "https://cors-proxy1.p.rapidapi.com/", name: "RapidAPI CORS" },
  { id: "httpbin", url: "https://httpbin.org/get?url=", name: "HTTPBin" },
  { id: "roamingproxy", url: "https://api.roamingproxy.com/v1/fetch?url=", name: "Roaming Proxy" },
  { id: "cors-proxy-ede", url: "https://cors-proxy-ede.herokuapp.com/", name: "CORS Proxy EDE" },
  { id: "zips", url: "https://zips.fly.dev/", name: "Zips Proxy" },
  { id: "kuma", url: "https://kuma-cors-anywhere.herokuapp.com/", name: "Kuma CORS" },
  { id: "prism", url: "https://prism-proxy.app/", name: "Prism Proxy" },
  { id: "allorigins-raw", url: "https://api.allorigins.win/raw?url=", name: "All Origins Raw" },
  { id: "corsproxy-org", url: "https://corsproxy.org/?", name: "CORSProxy Org" },
  { id: "fastapi", url: "https://fastapi-proxy.onrender.com/get?url=", name: "FastAPI Proxy" },
  { id: "localproxy", url: "http://localhost:8080/", name: "Local Proxy (Dev)" },
  { id: "directproxy", url: "", name: "Direct (No Proxy)" },
];

// Define a proper type for the proxy object
interface ProxyConfig {
  id: string;
  url: string;
  name: string;
}

const ImageTest = () => {
  const [imageUrl, setImageUrl] = useState("http://admin:fp%23bl170522@144.48.76.142:8098/ISAPI/Streaming/channels/102/picture");
  const [showImage, setShowImage] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("direct");
  const [selectedProxy, setSelectedProxy] = useState(CORS_PROXIES[0].id);
  const [customProxyUrl, setCustomProxyUrl] = useState("");
  const [useCustomProxy, setUseCustomProxy] = useState(false);
  const [mixedContentDetected, setMixedContentDetected] = useState(false);
  const [protocol, setProtocol] = useState("");
  const [successfulProxies, setSuccessfulProxies] = useState<string[]>([]);
  const [failedProxies, setFailedProxies] = useState<string[]>([]);
  const [isAutotesting, setIsAutotesting] = useState(false);
  const [currentTestingIndex, setCurrentTestingIndex] = useState(0);

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

  // Generate the proxied URL based on selection
  const getProxiedUrl = () => {
    // Find the selected proxy
    const proxy = useCustomProxy 
      ? { url: customProxyUrl, id: 'custom', name: 'Custom Proxy' } as ProxyConfig // Cast to ProxyConfig
      : CORS_PROXIES.find(p => p.id === selectedProxy) || CORS_PROXIES[0];
    
    // If it's the direct option, just return the image URL
    if (proxy.id === "directproxy") {
      return imageUrl;
    }
    
    // Remove existing protocol for consistent handling
    const urlWithoutProtocol = imageUrl.replace(/^https?:\/\//, '');
    return `${proxy.url}http://${urlWithoutProtocol}`;
  };

  // Handle proxy selection change
  const handleProxyChange = (value: string) => {
    setSelectedProxy(value);
    // Reset custom proxy setting when a preset is selected
    if (value !== "custom") {
      setUseCustomProxy(false);
    }
  };

  // Handle proxy success during autotest
  const handleProxySuccess = (proxyId: string) => {
    if (!successfulProxies.includes(proxyId)) {
      setSuccessfulProxies(prev => [...prev, proxyId]);
    }
    
    // If we're autotesting, continue with next proxy
    if (isAutotesting) {
      moveToNextProxy();
    }
  };

  // Handle proxy failure during autotest
  const handleProxyFailure = (proxyId: string) => {
    if (!failedProxies.includes(proxyId)) {
      setFailedProxies(prev => [...prev, proxyId]);
    }
    
    // If we're autotesting, continue with next proxy
    if (isAutotesting) {
      moveToNextProxy();
    }
  };

  // Start auto testing all proxies
  const startAutotesting = () => {
    setIsAutotesting(true);
    setCurrentTestingIndex(0);
    setSuccessfulProxies([]);
    setFailedProxies([]);
    setActiveTab("proxy");
    setSelectedProxy(CORS_PROXIES[0].id);
  };

  // Move to the next proxy in the autotest sequence
  const moveToNextProxy = () => {
    const nextIndex = currentTestingIndex + 1;
    
    if (nextIndex < CORS_PROXIES.length) {
      setCurrentTestingIndex(nextIndex);
      setSelectedProxy(CORS_PROXIES[nextIndex].id);
    } else {
      // We've tested all proxies
      setIsAutotesting(false);
      toast({
        title: "Testing Complete",
        description: `Found ${successfulProxies.length} working proxies out of ${CORS_PROXIES.length}`,
      });
    }
  };

  // Stop autotesting
  const stopAutotesting = () => {
    setIsAutotesting(false);
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
              <div className="space-y-4">
                <div>
                  <Label htmlFor="proxySelect">Select CORS Proxy</Label>
                  <Select 
                    value={selectedProxy} 
                    onValueChange={handleProxyChange}
                  >
                    <SelectTrigger id="proxySelect">
                      <SelectValue placeholder="Select a proxy" />
                    </SelectTrigger>
                    <SelectContent>
                      {CORS_PROXIES.map(proxy => (
                        <SelectItem 
                          key={proxy.id} 
                          value={proxy.id}
                          className={
                            successfulProxies.includes(proxy.id) 
                              ? "text-green-600" 
                              : failedProxies.includes(proxy.id) 
                                ? "text-red-600" 
                                : ""
                          }
                        >
                          {proxy.name}
                          {successfulProxies.includes(proxy.id) && <Check className="h-4 w-4 ml-1 inline text-green-600" />}
                          {failedProxies.includes(proxy.id) && <X className="h-4 w-4 ml-1 inline text-red-600" />}
                        </SelectItem>
                      ))}
                      <SelectItem value="custom">Custom Proxy URL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {selectedProxy === "custom" && (
                  <div>
                    <Label htmlFor="customProxy">Custom CORS Proxy URL</Label>
                    <Input 
                      id="customProxy" 
                      value={customProxyUrl}
                      onChange={(e) => setCustomProxyUrl(e.target.value)}
                      className="font-mono text-sm"
                      placeholder="https://your-proxy-url.com/?"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Enter your custom proxy URL including trailing characters (like ? or /)
                    </p>
                  </div>
                )}
                
                <div className="flex space-x-2">
                  <Button
                    variant="secondary"
                    onClick={startAutotesting}
                    disabled={isAutotesting}
                  >
                    {isAutotesting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Testing ({currentTestingIndex + 1}/{CORS_PROXIES.length})
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Auto-Test All Proxies
                      </>
                    )}
                  </Button>
                  
                  {isAutotesting && (
                    <Button variant="destructive" onClick={stopAutotesting}>
                      Stop Testing
                    </Button>
                  )}
                </div>
                
                <div className="text-sm">
                  <p className="font-medium">Testing status:</p>
                  <p className="text-green-600">Working proxies: {successfulProxies.length}</p>
                  <p className="text-red-600">Failed proxies: {failedProxies.length}</p>
                  <p className="text-gray-600">Remaining: {CORS_PROXIES.length - successfulProxies.length - failedProxies.length}</p>
                </div>
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
                  {isAutotesting && currentTestingIndex > 0 && (
                    <div className="text-center p-4">
                      <p className="mb-2">Auto-testing proxies ({currentTestingIndex + 1}/{CORS_PROXIES.length})</p>
                      <p className="text-sm">Currently testing: {CORS_PROXIES[currentTestingIndex]?.name}</p>
                      <Loader2 className="h-8 w-8 animate-spin mx-auto my-4" />
                    </div>
                  )}
                  <img
                    src={getProxiedUrl()}
                    alt="Proxied test image"
                    className="max-w-full h-auto border"
                    onError={() => {
                      console.error("Proxied image failed to load");
                      
                      // Record failure in autotesting
                      if (isAutotesting) {
                        handleProxyFailure(selectedProxy);
                      } else {
                        toast({
                          title: "Proxy Image Failed",
                          description: "Could not load the image through the proxy",
                          variant: "destructive",
                        });
                      }
                    }}
                    onLoad={() => {
                      console.log("Proxied image loaded successfully");
                      
                      // Record success in autotesting
                      if (isAutotesting) {
                        handleProxySuccess(selectedProxy);
                      } else {
                        toast({
                          title: "Proxy Success",
                          description: "Image loaded successfully through proxy",
                        });
                      }
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
                
                {successfulProxies.length > 0 && (
                  <div className="mt-4">
                    <h3 className="font-medium text-green-600">Working Proxies:</h3>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                      {successfulProxies.map(proxyId => {
                        const proxy = CORS_PROXIES.find(p => p.id === proxyId);
                        return (
                          <li key={proxyId} className="text-sm">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-green-600 p-0 h-auto"
                              onClick={() => setSelectedProxy(proxyId)}
                            >
                              {proxy?.name || proxyId}
                            </Button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
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
