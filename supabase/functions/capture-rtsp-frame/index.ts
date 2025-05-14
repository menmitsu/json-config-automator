
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Define the request body structure
interface RequestBody {
  rtspUrl: string;
  username?: string;
  password?: string;
}

// HTTP handler for the edge function
serve(async (req) => {
  try {
    // Extract request data
    const { rtspUrl, username, password } = await req.json() as RequestBody;
    
    // Log the incoming request (not logging password for security)
    console.log(`Processing request for URL: ${rtspUrl}`);
    
    if (!rtspUrl) {
      return new Response(
        JSON.stringify({ 
          error: "Missing required parameter: rtspUrl" 
        }),
        { headers: { "Content-Type": "application/json" }, status: 400 }
      );
    }
    
    // Build the request URL with authentication if provided
    let targetUrl = rtspUrl;
    
    // If URL doesn't include credentials but they're provided separately, add them
    if (username && password && !rtspUrl.includes('@')) {
      // Parse the URL to extract components
      try {
        const urlObj = new URL(rtspUrl);
        const encodedUsername = encodeURIComponent(username);
        const encodedPassword = encodeURIComponent(password);
        
        // Reconstruct URL with credentials
        urlObj.username = encodedUsername;
        urlObj.password = encodedPassword;
        targetUrl = urlObj.toString();
      } catch (parseError) {
        console.error("Error parsing URL:", parseError);
        // Fall back to simple concatenation if URL parsing fails
        const urlParts = rtspUrl.split('://');
        if (urlParts.length === 2) {
          const encodedUsername = encodeURIComponent(username);
          const encodedPassword = encodeURIComponent(password);
          targetUrl = `${urlParts[0]}://${encodedUsername}:${encodedPassword}@${urlParts[1]}`;
        }
      }
    }
    
    console.log("Fetching from target URL (credentials redacted)");
    
    // Make request to camera/NVR
    const response = await fetch(targetUrl, {
      headers: {
        "Accept": "image/jpeg, image/png, image/*",
        "Cache-Control": "no-cache, no-store, must-revalidate"
      }
    });
    
    if (!response.ok) {
      console.error(`HTTP error! Status: ${response.status}`);
      return new Response(
        JSON.stringify({ 
          error: `Failed to fetch image: ${response.statusText}`,
          status: response.status
        }),
        { headers: { "Content-Type": "application/json" }, status: response.status }
      );
    }
    
    // Get response data
    const imageData = await response.arrayBuffer();
    const contentType = response.headers.get("Content-Type") || "image/jpeg";
    
    // Convert to base64 for easy transport
    const base64Data = btoa(
      String.fromCharCode(...new Uint8Array(imageData))
    );
    
    // Construct data URL
    const dataUrl = `data:${contentType};base64,${base64Data}`;
    
    // Return success response with image data
    return new Response(
      JSON.stringify({ 
        message: "Image captured successfully",
        frameData: dataUrl,
        contentType,
        size: imageData.byteLength
      }),
      { 
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        }
      }
    );
  } catch (error) {
    // Handle any errors
    console.error("Edge function error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to process image capture request",
        details: error.message
      }),
      { headers: { "Content-Type": "application/json" }, status: 500 }
    );
  }
});
