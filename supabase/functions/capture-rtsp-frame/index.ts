
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Error response helper
function errorResponse(message: string, details: any, status = 500) {
  console.error(`Error: ${message}`, details);
  return new Response(
    JSON.stringify({ 
      error: message,
      details: details
    }),
    { 
      status: status, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}

// Success response helper
function successResponse(data: any) {
  return new Response(
    JSON.stringify(data),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { rtspUrl, username, password } = await req.json();

    if (!rtspUrl) {
      return errorResponse("URL is required", null, 400);
    }

    console.log(`Processing image URL: ${rtspUrl}`);
    
    // Create fetch options with longer timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    const fetchOptions: RequestInit = {
      method: "GET",
      headers: {
        "Accept": "image/jpeg, image/png, */*"
      },
      signal: controller.signal
    };
    
    // Add basic auth header if username and password provided separately
    if (username && password) {
      const authString = btoa(`${username}:${password}`);
      fetchOptions.headers = {
        ...fetchOptions.headers,
        "Authorization": `Basic ${authString}`
      };
      console.log("Using explicit Basic Auth authentication");
    } else {
      console.log("No explicit credentials provided, assuming they're in the URL if needed");
    }

    try {
      // Attempt to fetch the image
      console.log("Fetching URL with options:", { url: rtspUrl, method: fetchOptions.method });
      const response = await fetch(rtspUrl, fetchOptions);
      clearTimeout(timeoutId); // Clear timeout if fetch completes

      // Handle error response
      if (!response.ok) {
        const statusText = response.statusText;
        const status = response.status;
        
        let errorBody;
        try {
          // Try to get response body for more details
          errorBody = await response.text();
        } catch (e) {
          errorBody = "Could not read response body";
        }
        
        return errorResponse(
          `Server responded with status ${status} ${statusText}`,
          { 
            status,
            statusText,
            responseBody: errorBody.substring(0, 1000) // Limit size of error body
          }, 
          502 // Gateway error
        );
      }
      
      // Handle successful response
      try {
        const contentType = response.headers.get("content-type") || "image/jpeg";
        const imageData = await response.arrayBuffer();
        
        if (imageData.byteLength === 0) {
          return errorResponse("Image data is empty", null, 502);
        }
        
        // Convert to base64
        const base64Image = btoa(String.fromCharCode(...new Uint8Array(imageData)));
        
        return successResponse({ 
          frameData: `data:${contentType};base64,${base64Image}`,
          message: "Image successfully captured",
          size: imageData.byteLength,
          contentType
        });
      } catch (imageError) {
        return errorResponse("Failed to process image data", imageError.message, 502);
      }
    } catch (fetchError) {
      clearTimeout(timeoutId);
      // Check if the error is due to timeout
      if (fetchError.name === 'AbortError') {
        return errorResponse("Request timed out after 15 seconds", null, 504);
      }
      return errorResponse("Failed to fetch image", fetchError.message, 502);
    }
  } catch (error) {
    return errorResponse(
      "Failed to process request", 
      error instanceof Error ? error.message : String(error)
    );
  }
});
