
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { rtspUrl } = await req.json();

    if (!rtspUrl) {
      return new Response(
        JSON.stringify({ error: "URL is required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing HTTP image URL: ${rtspUrl}`);
    
    // Extract credentials from URL for debugging
    let username = "";
    let password = "";
    
    try {
      const urlObj = new URL(rtspUrl);
      username = urlObj.username || "";
      password = urlObj.password || "";
      console.log(`Extracted credentials - Username: ${username}, Password: ${password ? "provided" : "not provided"}`);
    } catch (e) {
      console.error("Error parsing URL:", e);
    }
    
    try {
      // Try multiple authentication methods with detailed error logging
      const authMethods = [
        // Method 1: Direct URL with credentials as provided
        {
          name: "Direct URL with embedded credentials",
          fetch: async () => {
            console.log(`Trying method 1: ${rtspUrl}`);
            return await fetch(rtspUrl, {
              method: "GET",
              headers: {
                "Accept": "image/jpeg, image/png, */*"
              }
            });
          }
        },
        
        // Method 2: Separate URL and Authorization header
        {
          name: "Authorization header with Basic auth",
          fetch: async () => {
            try {
              const urlObj = new URL(rtspUrl);
              if (urlObj.username && urlObj.password) {
                // Create a clean URL without credentials
                const cleanUrl = `${urlObj.protocol}//${urlObj.hostname}${urlObj.port ? ':' + urlObj.port : ''}${urlObj.pathname}${urlObj.search}`;
                
                // Create Authorization header
                const credentials = `${urlObj.username}:${urlObj.password}`;
                const auth = btoa(credentials);
                
                console.log(`Trying method 2: ${cleanUrl} with Authorization header`);
                
                return await fetch(cleanUrl, {
                  method: "GET",
                  headers: {
                    "Accept": "image/jpeg, image/png, */*",
                    "Authorization": `Basic ${auth}`
                  }
                });
              }
              throw new Error("No credentials in URL for method 2");
            } catch (e) {
              console.error("Error in method 2:", e);
              throw e;
            }
          }
        },
        
        // Method 3: URL-encoded credentials (some systems require this)
        {
          name: "URL with encoded credentials",
          fetch: async () => {
            try {
              const urlObj = new URL(rtspUrl);
              if (urlObj.username && urlObj.password) {
                // Create URL with explicitly encoded credentials
                const encodedUsername = encodeURIComponent(urlObj.username);
                const encodedPassword = encodeURIComponent(urlObj.password);
                const cleanUrl = `${urlObj.protocol}//${encodedUsername}:${encodedPassword}@${urlObj.hostname}${urlObj.port ? ':' + urlObj.port : ''}${urlObj.pathname}${urlObj.search}`;
                
                console.log(`Trying method 3: URL with encoded credentials`);
                
                return await fetch(cleanUrl, {
                  method: "GET",
                  headers: {
                    "Accept": "image/jpeg, image/png, */*"
                  }
                });
              }
              throw new Error("No credentials in URL for method 3");
            } catch (e) {
              console.error("Error in method 3:", e);
              throw e;
            }
          }
        }
      ];
      
      // Try each method until one succeeds
      const errors = [];
      
      for (const method of authMethods) {
        try {
          console.log(`Attempting authentication method: ${method.name}`);
          const response = await method.fetch();
          
          // If this method succeeded, process the image
          if (response.ok) {
            console.log(`Success with method: ${method.name}`);
            
            // Get the image data
            const imageData = await response.arrayBuffer();
            const base64Image = btoa(String.fromCharCode(...new Uint8Array(imageData)));
            
            // Determine content type from response or default to jpeg
            const contentType = response.headers.get("content-type") || "image/jpeg";
            
            return new Response(
              JSON.stringify({ 
                frameData: `data:${contentType};base64,${base64Image}`,
                message: `Image successfully captured using ${method.name}`
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          
          // Log the error for this method
          const errorText = await response.text().catch(() => "No error details");
          console.error(`Method ${method.name} failed with status ${response.status}:`, errorText);
          errors.push(`${method.name}: Status ${response.status} - ${errorText.substring(0, 100)}${errorText.length > 100 ? '...' : ''}`);
        } catch (error) {
          console.error(`Method ${method.name} threw exception:`, error);
          errors.push(`${method.name}: ${error.message}`);
        }
      }
      
      // If we reached here, all methods failed
      return new Response(
        JSON.stringify({ 
          error: "Failed to fetch image from URL",
          details: "All authentication methods failed",
          methodErrors: errors,
          suggestions: [
            "Verify the URL and credentials are correct",
            "Ensure the NVR/camera system is online and accessible",
            "Check if the camera requires a special authentication method",
            "Try a different channel number",
            "Verify that the NVR system supports HTTP image snapshot URLs"
          ]
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
      
    } catch (error) {
      console.error("Error fetching image:", error);
      
      return new Response(
        JSON.stringify({ 
          error: "Failed to capture image",
          details: error.message,
          suggestions: [
            "Check if the URL is accessible from the internet",
            "Verify that the camera/NVR is currently online",
            "Ensure the URL includes proper authentication if required"
          ]
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
  } catch (error) {
    console.error("General error processing request:", error);
    
    return new Response(
      JSON.stringify({ 
        error: "Failed to process request",
        details: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
