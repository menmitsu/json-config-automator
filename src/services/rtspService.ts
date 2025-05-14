
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

/**
 * Service to handle HTTP image captures from NVR/camera systems
 * via Supabase Edge Function
 */

// Function to fetch an image from an HTTP URL
export const fetchRtspFrame = async (
  imageUrl: string, 
  username?: string, 
  password?: string
): Promise<string | null> => {
  try {
    console.log(`Requesting image capture for URL: ${imageUrl}`);
    
    // Prepare request body
    const requestBody: {
      rtspUrl: string;
      username?: string;
      password?: string;
    } = { rtspUrl: imageUrl };
    
    // Add explicit credentials if provided
    if (username && password) {
      requestBody.username = username;
      requestBody.password = password;
    }
    
    // Call the Supabase Edge Function - removed timeout as it's not supported
    const { data, error } = await supabase.functions.invoke("capture-rtsp-frame", {
      body: requestBody
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
      
      // Show toast with error message
      toast({
        title: "Image Capture Failed",
        description: data.error,
        variant: "destructive"
      });
      
      return null;
    }
    
    console.log("Image response received:", data.message || "Success", {
      size: data.size, 
      type: data.contentType
    });
    
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
