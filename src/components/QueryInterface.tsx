
import React, { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

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

  // Mock function to process a query and simulate API calls
  // In a real implementation, this would call your actual API endpoints
  const processQuery = async (questionText: string) => {
    setIsLoading(true);
    setResponse("Processing request...");

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // For demonstration purposes, we'll parse the query and update based on keywords
      let updates: Record<string, any> = {};
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

      // If we have updates to make
      if (Object.keys(updates).length > 0) {
        onUpdateConfig(updates);
        setResponse(`Updated configuration with new values for: ${Object.keys(updates).join(", ")}`);
      } else {
        setResponse("I couldn't find any specific configuration to update based on your question. Please be more specific about what you want to update (e.g., camera, center, classroom, IP, streaming URL, WhatsApp group, channel).");
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
        description: "Please enter a question to update the configuration.",
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="query">Ask a question to update the configuration</Label>
        <Textarea
          id="query"
          placeholder="e.g., Update the camera information for Dwarka center"
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
        <div className="mt-4 p-3 bg-gray-100 rounded-md text-sm">
          <p className="font-medium mb-1">Response:</p>
          <p>{response}</p>
        </div>
      )}
    </form>
  );
};

export default QueryInterface;
