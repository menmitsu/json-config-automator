
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
    
    try {
      // Try multiple authentication methods
      // First attempt: Use credentials directly in URL as provided
      let response = await fetch(rtspUrl, {
        method: "GET",
        headers: {
          "Accept": "image/jpeg, image/png, */*"
        }
      });
      
      // If first attempt fails with 401, try with Authorization header
      if (response.status === 401) {
        console.log("First attempt failed with 401, trying Authorization header method");
        
        try {
          // Extract credentials from URL
          const urlObj = new URL(rtspUrl);
          if (urlObj.username && urlObj.password) {
            // Create a clean URL without credentials
            const cleanUrl = `${urlObj.protocol}//${urlObj.hostname}${urlObj.port ? ':' + urlObj.port : ''}${urlObj.pathname}${urlObj.search}`;
            
            // Create Authorization header
            const credentials = `${urlObj.username}:${urlObj.password}`;
            const auth = btoa(credentials);
            
            console.log(`Trying with Authorization header to: ${cleanUrl}`);
            
            // Try with Authorization header
            response = await fetch(cleanUrl, {
              method: "GET",
              headers: {
                "Accept": "image/jpeg, image/png, */*",
                "Authorization": `Basic ${auth}`
              }
            });
          }
        } catch (authError) {
          console.error("Error while trying auth header approach:", authError);
        }
      }
      
      // Check if any of the attempts was successful
      if (!response.ok) {
        const errorText = await response.text().catch(() => "No error details");
        console.error(`Error response (${response.status}):`, errorText);
        
        let suggestions = [
          "Verify the URL is correct and accessible",
          "Check if authentication credentials are required",
          "Ensure the camera/NVR is online and responding",
          "Try using the credentials in a different format (username:password@host vs. Authorization header)"
        ];
        
        return new Response(
          JSON.stringify({ 
            error: "Failed to fetch image from URL",
            details: `Server responded with status ${response.status}`,
            suggestions
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Get the image data
      const imageData = await response.arrayBuffer();
      const base64Image = btoa(String.fromCharCode(...new Uint8Array(imageData)));
      
      // Determine content type from response or default to jpeg
      const contentType = response.headers.get("content-type") || "image/jpeg";
      
      return new Response(
        JSON.stringify({ 
          frameData: `data:${contentType};base64,${base64Image}`,
          message: "Image successfully captured"
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
            "Ensure the URL includes proper authentication if required",
            "Try using credentials in HTTP Authorization header instead of the URL"
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
