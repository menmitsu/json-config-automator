
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
        JSON.stringify({ error: "RTSP URL is required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing RTSP URL: ${rtspUrl}`);
    
    // Encode the RTSP URL for the API request
    const encodedRtspUrl = encodeURIComponent(rtspUrl);
    
    // Call the RTSP Extract API service
    // This is a third-party service that converts RTSP streams to images
    const apiResponse = await fetch(`https://rtspextract.com/api/frame?url=${encodedRtspUrl}&format=jpeg`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!apiResponse.ok) {
      const errorData = await apiResponse.text();
      console.error("Error from RTSP Extract service:", errorData);
      throw new Error(`RTSP Extract service returned status: ${apiResponse.status}`);
    }
    
    // Get the image data as a buffer
    const imageBuffer = await apiResponse.arrayBuffer();
    
    // Convert to base64
    const base64 = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));
    
    return new Response(
      JSON.stringify({ 
        frameData: `data:image/jpeg;base64,${base64}`,
        message: "Frame captured via RTSP Extract service" 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error processing RTSP frame:", error);
    
    // If the service fails, provide fallback information and suggestions
    return new Response(
      JSON.stringify({ 
        error: "Failed to capture frame from RTSP stream",
        details: error.message,
        suggestions: [
          "Check if the RTSP URL is accessible from the internet",
          "Verify that the RTSP stream is currently active",
          "Ensure the RTSP URL includes proper authentication if required"
        ]
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
