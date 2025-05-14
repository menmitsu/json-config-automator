
import { supabase } from "@/integrations/supabase/client";

/**
 * Service to handle RTSP stream captures using a simulated camera image generation
 * via Supabase Edge Function
 */

// Function to fetch a single frame from an RTSP stream
export const fetchRtspFrame = async (rtspUrl: string): Promise<string | null> => {
  try {
    console.log(`Requesting frame capture for RTSP URL: ${rtspUrl}`);
    
    // Call the Supabase Edge Function
    const { data, error } = await supabase.functions.invoke("capture-rtsp-frame", {
      body: { rtspUrl }
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
    
    console.log("Frame response received:", data.message || "Success");
    return data.frameData;
  } catch (error) {
    console.error("Error capturing RTSP frame:", error);
    return null;
  }
};
