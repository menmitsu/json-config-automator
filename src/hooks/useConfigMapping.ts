
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import useConfigApi from "@/hooks/useConfigApi";

export interface ConfigMappingRule {
  csvField: string;
  configField: string;
  transformFn?: (value: string) => string | Promise<string>;
  apiEndpoint?: string;
}

export const useConfigMapping = () => {
  const [csvData, setCsvData] = useState<Record<string, string>[]>([]);
  const [mappingRules, setMappingRules] = useState<ConfigMappingRule[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { fetchConfigUpdate } = useConfigApi();
  
  // Set the CSV data
  const setData = (data: Record<string, string>[]) => {
    setCsvData(data);
  };

  // Set the mapping rules
  const setRules = (rules: ConfigMappingRule[]) => {
    setMappingRules(rules);
  };

  // Apply mapping rules to CSV data to update config
  const applyMappingRules = async (
    currentConfig: any,
    customEndpoint?: string
  ): Promise<Record<string, any>> => {
    if (csvData.length === 0 || mappingRules.length === 0) {
      toast({
        title: "Cannot process",
        description: "Please fetch CSV data and define mapping rules first",
        variant: "destructive",
      });
      return {};
    }

    setIsProcessing(true);
    try {
      // Start with an empty updates object
      const updates: Record<string, any> = {};

      // For this simple example, we'll just use the first row of data
      const dataRow = csvData[0];

      // Process each mapping rule
      for (const rule of mappingRules) {
        const { csvField, configField, transformFn } = rule;
        
        if (dataRow[csvField] !== undefined) {
          // Apply transformation if specified
          if (transformFn) {
            updates[configField] = await transformFn(dataRow[csvField]);
          } else {
            updates[configField] = dataRow[csvField];
          }
        }
      }

      // If specific API processing is required, we can call fetchConfigUpdate
      if (mappingRules.some(rule => rule.apiEndpoint)) {
        const query = `Update config with CSV data: ${JSON.stringify(updates)}`;
        const apiResult = await fetchConfigUpdate(query, currentConfig, {
          customEndpoint: customEndpoint || undefined
        });
        
        // Merge API results with direct mappings
        Object.assign(updates, apiResult.updates);
      }

      setIsProcessing(false);
      return updates;
    } catch (error) {
      console.error("Error applying mapping rules:", error);
      setIsProcessing(false);
      toast({
        title: "Error",
        description: "Failed to apply mapping rules to update configuration",
        variant: "destructive",
      });
      return {};
    }
  };

  return {
    csvData,
    setData,
    mappingRules,
    setRules,
    applyMappingRules,
    isProcessing
  };
};

export default useConfigMapping;
