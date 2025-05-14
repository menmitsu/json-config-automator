
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

/**
 * Service to handle HTTP image captures from NVR/camera systems
 * via Supabase Edge Function
 */

// Function to fetch an image from an HTTP URL
export const fetchRtspFrame = async (imageUrl: string): Promise<string | null> => {
  try {
    console.log(`Requesting image capture for URL: ${imageUrl}`);
    
    // Call the Supabase Edge Function
    const { data, error } = await supabase.functions.invoke("capture-rtsp-frame", {
      body: { rtspUrl: imageUrl }
    });
    
    if (error) {
      console.error("Error from edge function:", error);
      
      // Show toast with error message
      toast({
        title: "Connection Error",
        description: "Could not connect to image capture service",
        variant: "destructive"
      });
      
      return null;
    }
    
    if (data.error) {
      console.error("Error in edge function response:", data.error);
      
      // Log any details if available
      if (data.details) {
        console.error("Error details:", data.details);
      }
      
      // Log method errors if available
      if (data.methodErrors) {
        console.error("Authentication method errors:");
        data.methodErrors.forEach((methodError: string, index: number) => {
          console.error(`${index + 1}. ${methodError}`);
        });
      }
      
      // Log any suggestions if available
      if (data.suggestions) {
        console.log("Suggestions to fix the issue:");
        data.suggestions.forEach((suggestion: string, index: number) => {
          console.log(`${index + 1}. ${suggestion}`);
        });
      }
      
      // Show toast with error message
      toast({
        title: "Image Capture Failed",
        description: data.details || data.error,
        variant: "destructive"
      });
      
      return null;
    }
    
    console.log("Image response received:", data.message || "Success");
    return data.frameData;
  } catch (error) {
    console.error("Error capturing image:", error);
    
    // Show toast with error message
    toast({
      title: "Error",
      description: "An unexpected error occurred during image capture",
      variant: "destructive"
    });
    
    return null;
  }
};
