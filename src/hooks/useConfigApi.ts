
import { useState } from 'react';

interface ConfigApiOptions {
  customEndpoint?: string;
}

export const useConfigApi = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fetchConfigUpdate = async (
    query: string, 
    currentConfig: any,
    options?: ConfigApiOptions
  ): Promise<{updates: Record<string, any>, message: string}> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // If a custom endpoint is provided, attempt to use it
      if (options?.customEndpoint) {
        try {
          const response = await fetch(options.customEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              query,
              currentConfig
            })
          });
          
          if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
          }
          
          const data = await response.json();
          setIsLoading(false);
          return data;
        } catch (customApiError) {
          console.error("Custom API error:", customApiError);
          throw new Error("Failed to communicate with the custom API endpoint. Falling back to default behavior.");
        }
      }
      
      // Default mock implementation - in production, this would connect to a real API
      // This is the same logic as in the QueryInterface but extracted to this hook
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      let updates: Record<string, any> = {};
      const lowerQuery = query.toLowerCase();
      
      if (lowerQuery.includes("camera")) {
        updates.camera_id = `CAM-${Math.floor(Math.random() * 9000) + 1000}`;
      }
      
      if (lowerQuery.includes("center") || lowerQuery.includes("branch")) {
        const centers = ["Dwarka", "Rohini", "Vasant Kunj", "Noida", "Gurgaon"];
        const randomCenter = centers[Math.floor(Math.random() * centers.length)];
        updates.center_id = `${randomCenter.toLowerCase()}_${Math.floor(Math.random() * 900) + 100}`;
        updates.center_name = `${randomCenter} Branch`;
      }
      
      // Add more fields similar to the QueryInterface component
      
      let message = Object.keys(updates).length > 0
        ? `Updated fields: ${Object.keys(updates).join(", ")}`
        : "No updates were needed based on your query";
      
      setIsLoading(false);
      return { updates, message };
      
    } catch (err) {
      setIsLoading(false);
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMessage);
      return { updates: {}, message: errorMessage };
    }
  };
  
  return {
    fetchConfigUpdate,
    isLoading,
    error
  };
};

export default useConfigApi;
