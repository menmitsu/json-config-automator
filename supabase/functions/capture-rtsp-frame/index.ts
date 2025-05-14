
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
      // Simple direct fetch approach
      const response = await fetch(rtspUrl, {
        method: "GET",
        headers: {
          "Accept": "image/jpeg, image/png, */*"
        }
      });
      
      // Handle error response
      if (!response.ok) {
        const errorText = await response.text().catch(() => "No error details");
        console.error(`Error response (${response.status}):`, errorText);
        
        return new Response(
          JSON.stringify({ 
            error: "Failed to fetch image from URL",
            details: `Server responded with status ${response.status}`,
            errorText: errorText.substring(0, 500)
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
            "Try a different URL format or authentication method"
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
