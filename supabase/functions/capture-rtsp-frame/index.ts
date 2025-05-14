
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

    console.log(`Received request for RTSP URL: ${rtspUrl}`);
    
    // Since we can't run FFmpeg directly in the edge function,
    // we'll return a placeholder image or suggest alternatives
    
    // Generating a simple colored rectangle as a placeholder
    // This is just a temporary solution until we implement a proper solution
    const width = 640;
    const height = 480;
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext("2d");
    
    // Fill with dark gray background
    ctx.fillStyle = "#333333";
    ctx.fillRect(0, 0, width, height);
    
    // Add text explaining the situation
    ctx.fillStyle = "#ffffff";
    ctx.font = "16px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`RTSP URL: ${rtspUrl}`, width / 2, height / 2 - 20);
    ctx.fillText("FFmpeg execution is not available in Edge Functions", width / 2, height / 2 + 10);
    ctx.fillText("See console for alternative solutions", width / 2, height / 2 + 40);
    
    // Convert canvas to blob
    const blob = await canvas.convertToBlob();
    const buffer = await blob.arrayBuffer();
    
    // Convert to base64
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
    
    console.log("Generated placeholder image as FFmpeg cannot be executed directly in edge functions");
    console.log("Alternative solutions: 1) Use a dedicated server for FFmpeg, 2) Use a third-party RTSP to image service");
    
    return new Response(
      JSON.stringify({ 
        frameData: `data:image/png;base64,${base64}`,
        message: "This is a placeholder. FFmpeg cannot be executed directly in edge functions."
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error in edge function:", error);
    
    return new Response(
      JSON.stringify({ 
        error: "Failed to process request",
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
