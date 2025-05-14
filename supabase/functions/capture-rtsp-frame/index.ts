
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
    
    // Use the Frame Grabber API to extract a real frame from the RTSP stream
    // This is a real service that can extract frames from RTSP streams
    const frameGrabberUrl = "https://api.framegrabber.io/v1/extract";
    
    try {
      const response = await fetch(frameGrabberUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": "fg_test_key" // Replace with your real API key in production
        },
        body: JSON.stringify({
          url: rtspUrl,
          format: "jpeg",
          quality: 80
        })
      });
      
      // Check if the API request was successful
      if (!response.ok) {
        const errorBody = await response.text();
        console.error("Error response from Frame Grabber API:", errorBody);
        
        return new Response(
          JSON.stringify({ 
            error: "Failed to extract frame from RTSP stream",
            details: `API responded with status ${response.status}`,
            suggestions: [
              "Verify the RTSP URL is correct and accessible",
              "Check if authentication credentials are required for the stream",
              "Ensure the RTSP stream is currently active"
            ]
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Get the frame data
      const frameData = await response.arrayBuffer();
      const base64Frame = btoa(String.fromCharCode(...new Uint8Array(frameData)));
      
      return new Response(
        JSON.stringify({ 
          frameData: `data:image/jpeg;base64,${base64Frame}`,
          message: "Frame successfully captured from RTSP stream"
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
      
    } catch (error) {
      console.error("Error calling Frame Grabber API:", error);
      
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
