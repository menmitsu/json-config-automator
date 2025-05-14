
import { supabase } from "@/integrations/supabase/client";

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
      body: { rtspUrl: imageUrl } // Keeping parameter name for backward compatibility
    });
    
    if (error) {
      console.error("Error from edge function:", error);
      return null;
    }
    
    if (data.error) {
      console.error("Error in edge function response:", data.error);
      
      // Log any suggestions if available
      if (data.suggestions) {
        console.log("Suggestions to fix the issue:");
        data.suggestions.forEach((suggestion: string, index: number) => {
          console.log(`${index + 1}. ${suggestion}`);
        });
      }
      
      return null;
    }
    
    console.log("Image response received:", data.message || "Success");
    return data.frameData;
  } catch (error) {
    console.error("Error capturing image:", error);
    return null;
  }
};
