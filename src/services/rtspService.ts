
import { toast } from "@/components/ui/use-toast";

/**
 * Service to handle HTTP image captures from NVR/camera systems
 * via local proxy
 */

// Local proxy URL - can be configured as needed
const LOCAL_PROXY_URL = "http://localhost:8080/";

// Function to fetch an image from an HTTP URL via local proxy
export const fetchRtspFrame = async (
  imageUrl: string, 
  username?: string, 
  password?: string
): Promise<string | null> => {
  try {
    console.log(`Requesting image capture for URL: ${imageUrl}`);
    
    // Build the complete URL with auth if provided
    let targetUrl = imageUrl;
    
    if (username && password && !imageUrl.includes('@')) {
      // Parse the URL to extract components and inject credentials
      try {
        const urlObj = new URL(imageUrl);
        const encodedUsername = encodeURIComponent(username);
        const encodedPassword = encodeURIComponent(password);
        
        // Reconstruct URL with credentials
        urlObj.username = encodedUsername;
        urlObj.password = encodedPassword;
        targetUrl = urlObj.toString();
      } catch (parseError) {
        console.error("Error parsing URL:", parseError);
        // Fall back to simple concatenation if URL parsing fails
        const urlParts = imageUrl.split('://');
        if (urlParts.length === 2) {
          const encodedUsername = encodeURIComponent(username);
          const encodedPassword = encodeURIComponent(password);
          targetUrl = `${urlParts[0]}://${encodedUsername}:${encodedPassword}@${urlParts[1]}`;
        }
      }
    }
    
    // Use local proxy URL
    const proxyUrl = `${LOCAL_PROXY_URL}${encodeURIComponent(targetUrl)}`;
    console.log("Fetching via proxy:", proxyUrl);
    
    // Make request to local proxy
    const response = await fetch(proxyUrl, {
      headers: {
        "Accept": "image/jpeg, image/png, image/*",
        "Cache-Control": "no-cache, no-store, must-revalidate"
      }
    });
    
    if (!response.ok) {
      console.error(`HTTP error! Status: ${response.status}`);
      
      toast({
        title: "Connection Error",
        description: `Failed to fetch image: ${response.statusText}`,
        variant: "destructive"
      });
      
      return null;
    }
    
    // Get image data
    const imageBlob = await response.blob();
    const contentType = response.headers.get("Content-Type") || "image/jpeg";
    
    // Convert to base64 for display
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        console.log("Image loaded successfully:", {
          size: imageBlob.size, 
          type: contentType
        });
        resolve(base64data);
      };
      reader.readAsDataURL(imageBlob);
    });
    
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
