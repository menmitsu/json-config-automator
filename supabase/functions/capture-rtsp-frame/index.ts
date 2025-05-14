
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { exec } from "https://deno.land/x/exec@0.0.5/mod.ts";
import { decode as base64Decode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

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

    console.log(`Attempting to capture frame from: ${rtspUrl}`);

    // Create a temporary file name
    const tempFileName = `frame_${Date.now()}.png`;
    
    // Construct the FFmpeg command
    const command = `ffmpeg -loglevel verbose -rtsp_transport tcp -i '${rtspUrl}' -frames:v 1 ${tempFileName}`;
    
    // Execute the FFmpeg command
    console.log(`Executing command: ${command}`);
    const result = await exec(command);
    console.log("FFmpeg execution result:", result);

    // Read the captured frame
    const fileData = await Deno.readFile(tempFileName);
    
    // Convert to base64
    const base64 = btoa(
      new Uint8Array(fileData).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );
    
    // Clean up the temporary file
    await Deno.remove(tempFileName);
    
    // Return the image as base64
    return new Response(
      JSON.stringify({ frameData: `data:image/png;base64,${base64}` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error capturing RTSP frame:", error);
    
    return new Response(
      JSON.stringify({ 
        error: "Failed to capture frame",
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
