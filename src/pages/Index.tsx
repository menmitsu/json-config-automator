
import React, { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ConfigEditor from "@/components/ConfigEditor";
import QueryInterface from "@/components/QueryInterface";
import { toast } from "@/hooks/use-toast";
import { Download } from "lucide-react";

// Initial configuration template
const initialConfig = {
  camera_id: "",
  center_id: "",
  center_name: "",
  classroom_code: "",
  classroom_name: "",
  classroom_size: "",
  channel: 0,
  fpstream_url: "",
  cut_evidence_ip: "",
  public_ip: "",
  whatsapp_group_id: "",
  dictionary: "",
  last_updated: new Date().toISOString()
};

const Index = () => {
  const [configData, setConfigData] = useState(initialConfig);

  const updateConfig = (newData: Partial<typeof initialConfig>) => {
    setConfigData(prev => ({
      ...prev,
      ...newData,
      last_updated: new Date().toISOString()
    }));
    
    toast({
      title: "Configuration Updated",
      description: "The configuration has been updated successfully."
    });
  };

  const handleDownload = () => {
    const jsonString = JSON.stringify(configData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "config.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Configuration Downloaded",
      description: "Your configuration file has been downloaded."
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold mb-6 text-center">JSON Config Automator</h1>
        <p className="text-gray-600 text-center mb-8">
          Create and manage your master configuration file through queries or direct edits
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Ask Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <QueryInterface onUpdateConfig={updateConfig} currentConfig={configData} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Configuration Editor</CardTitle>
              <Button 
                onClick={handleDownload}
                size="sm"
                className="flex items-center gap-2"
              >
                <Download size={16} />
                Download JSON
              </Button>
            </CardHeader>
            <CardContent>
              <ConfigEditor config={configData} onUpdateConfig={updateConfig} />
            </CardContent>
            <CardFooter className="text-sm text-gray-500">
              Last updated: {new Date(configData.last_updated).toLocaleString()}
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
