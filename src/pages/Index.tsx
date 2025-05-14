
import React, { useState, useMemo } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ConfigEditor from "@/components/ConfigEditor";
import QueryInterface from "@/components/QueryInterface";
import { toast } from "@/hooks/use-toast";
import { Download, FileText } from "lucide-react";
import CsvDataFetcher from "@/components/CsvDataFetcher";
import ConfigMappingRules from "@/components/ConfigMappingRules";
import useConfigMapping from "@/hooks/useConfigMapping";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  const [activeTab, setActiveTab] = useState("query");
  
  const { 
    csvData, 
    setData, 
    mappingRules, 
    setRules, 
    applyMappingRules, 
    isProcessing 
  } = useConfigMapping();

  // Get available fields from CSV data
  const availableCsvFields = useMemo(() => {
    if (csvData.length === 0) return [];
    return Object.keys(csvData[0]);
  }, [csvData]);

  // Get config fields
  const configFields = useMemo(() => {
    return Object.keys(configData).filter(key => key !== 'last_updated');
  }, [configData]);

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

  const handleApplyMappings = async () => {
    const updates = await applyMappingRules(configData);
    if (Object.keys(updates).length > 0) {
      updateConfig(updates);
      toast({
        title: "CSV Mapping Applied",
        description: `Updated ${Object.keys(updates).length} fields based on CSV data`
      });
    }
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
          Create and manage your master configuration file through queries, CSV data, or direct edits
        </p>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="query">Ask Questions</TabsTrigger>
            <TabsTrigger value="csv">Import from CSV</TabsTrigger>
            <TabsTrigger value="editor">JSON Editor</TabsTrigger>
          </TabsList>

          <TabsContent value="query" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Ask Questions</CardTitle>
              </CardHeader>
              <CardContent>
                <QueryInterface onUpdateConfig={updateConfig} currentConfig={configData} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="csv" className="mt-4 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Import from CSV or Google Sheets</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <CsvDataFetcher onDataFetched={setData} />
                
                {csvData.length > 0 && (
                  <>
                    <ConfigMappingRules 
                      onRulesChange={setRules} 
                      availableFields={availableCsvFields}
                      configFields={configFields}
                    />
                    
                    <Button 
                      onClick={handleApplyMappings} 
                      className="w-full"
                      disabled={isProcessing || mappingRules.length === 0}
                    >
                      {isProcessing ? "Processing..." : "Apply CSV Mapping to Config"}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="editor" className="mt-4">
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
          </TabsContent>
        </Tabs>

        {/* Preview Card - Always visible */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText size={18} />
              Current Configuration
            </CardTitle>
            <Button 
              onClick={handleDownload}
              size="sm"
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download size={16} />
              Download
            </Button>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-50 p-4 rounded-md text-sm overflow-auto max-h-64">
              {JSON.stringify(configData, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
