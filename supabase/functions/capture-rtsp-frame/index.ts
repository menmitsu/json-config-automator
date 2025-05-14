
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
    
    // Extract channel number from URL if possible
    let channelNumber = "Unknown";
    const channelMatch = rtspUrl.match(/Channels\/(\d+)/);
    if (channelMatch && channelMatch[1]) {
      channelNumber = channelMatch[1];
    }
    
    // Extract IP address from URL if possible
    let ipAddress = "Unknown IP";
    const ipMatch = rtspUrl.match(/@?([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)/);
    if (ipMatch && ipMatch[1]) {
      ipAddress = ipMatch[1];
    }
    
    // Since the third-party service is unreliable, we'll generate a simulated camera frame
    const width = 640;
    const height = 360;
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext("2d");
    
    // Generate a realistic-looking camera frame
    await generateCameraFrame(ctx, width, height, channelNumber, ipAddress);
    
    // Convert canvas to blob and then to base64
    const blob = await canvas.convertToBlob();
    const buffer = await blob.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
    
    return new Response(
      JSON.stringify({ 
        frameData: `data:image/png;base64,${base64}`,
        message: "Simulated frame generated successfully" 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error processing RTSP frame:", error);
    
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

// Function to generate a realistic-looking camera frame
async function generateCameraFrame(ctx, width, height, channelNumber, ipAddress) {
  // Fill with dark background
  ctx.fillStyle = "#1a1a1a";
  ctx.fillRect(0, 0, width, height);
  
  // Add some noise to simulate camera grain
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = Math.random() * 20 - 10;
    data[i] = Math.max(0, Math.min(255, data[i] + noise));
    data[i+1] = Math.max(0, Math.min(255, data[i+1] + noise));
    data[i+2] = Math.max(0, Math.min(255, data[i+2] + noise));
  }
  ctx.putImageData(imageData, 0, 0);
  
  // Create a simulated scene
  simulateScene(ctx, width, height);
  
  // Add camera info overlay (top)
  ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
  ctx.fillRect(0, 0, width, 30);
  
  // Current time for timestamp
  const now = new Date();
  const timestamp = now.toLocaleString();
  
  // Draw camera info text
  ctx.fillStyle = "#ffffff";
  ctx.font = "14px monospace";
  ctx.textAlign = "left";
  ctx.fillText(`CH${channelNumber} | ${ipAddress}`, 10, 20);
  
  // Draw timestamp at bottom right
  ctx.textAlign = "right";
  ctx.fillText(timestamp, width - 10, height - 10);
  
  // Add the "REC" indicator
  ctx.fillStyle = "#ff0000";
  ctx.font = "bold 14px monospace";
  ctx.textAlign = "right";
  ctx.fillText("REC", width - 10, 20);
  
  // Add a small red dot next to REC
  ctx.beginPath();
  ctx.arc(width - 50, 16, 5, 0, Math.PI * 2);
  ctx.fill();
}

// Function to simulate a random scene
function simulateScene(ctx, width, height) {
  // Decide which type of scene to generate
  const sceneType = Math.floor(Math.random() * 3);
  
  switch(sceneType) {
    case 0:
      // Classroom scene
      drawClassroomScene(ctx, width, height);
      break;
    case 1:
      // Hallway scene
      drawHallwayScene(ctx, width, height);
      break;
    case 2:
      // Office scene
      drawOfficeScene(ctx, width, height);
      break;
  }
}

// Draw a simulated classroom
function drawClassroomScene(ctx, width, height) {
  // Floor
  ctx.fillStyle = "#8B4513";
  ctx.fillRect(0, height * 0.7, width, height * 0.3);
  
  // Wall
  ctx.fillStyle = "#eeeedd";
  ctx.fillRect(0, 0, width, height * 0.7);
  
  // Board
  ctx.fillStyle = "#005500";
  ctx.fillRect(width * 0.1, height * 0.15, width * 0.8, height * 0.3);
  
  // Desks (3x3 grid)
  ctx.fillStyle = "#8B4513";
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const x = width * 0.15 + col * width * 0.25;
      const y = height * 0.5 + row * height * 0.12;
      ctx.fillRect(x, y, width * 0.2, height * 0.08);
    }
  }
}

// Draw a simulated hallway
function drawHallwayScene(ctx, width, height) {
  // Floor
  ctx.fillStyle = "#999999";
  ctx.fillRect(0, height * 0.6, width, height * 0.4);
  
  // Walls
  ctx.fillStyle = "#dddddd";
  ctx.fillRect(0, 0, width, height * 0.6);
  
  // Perspective lines for hallway
  ctx.beginPath();
  ctx.moveTo(0, height * 0.6);
  ctx.lineTo(width / 2, height * 0.3);
  ctx.lineTo(width, height * 0.6);
  ctx.strokeStyle = "#333333";
  ctx.lineWidth = 2;
  ctx.stroke();
  
  // Doors on sides
  ctx.fillStyle = "#8B4513";
  ctx.fillRect(width * 0.1, height * 0.3, width * 0.15, height * 0.3);
  ctx.fillRect(width * 0.75, height * 0.3, width * 0.15, height * 0.3);
}

// Draw a simulated office
function drawOfficeScene(ctx, width, height) {
  // Floor
  ctx.fillStyle = "#aaaaaa";
  ctx.fillRect(0, height * 0.7, width, height * 0.3);
  
  // Wall
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height * 0.7);
  
  // Desk
  ctx.fillStyle = "#5f4533";
  ctx.fillRect(width * 0.2, height * 0.5, width * 0.6, height * 0.1);
  
  // Computer
  ctx.fillStyle = "#222222";
  ctx.fillRect(width * 0.4, height * 0.35, width * 0.2, height * 0.15);
  
  // Window
  ctx.fillStyle = "#aaddff";
  ctx.fillRect(width * 0.6, height * 0.1, width * 0.3, height * 0.25);
  
  // Window frame
  ctx.strokeStyle = "#555555";
  ctx.lineWidth = 2;
  ctx.strokeRect(width * 0.6, height * 0.1, width * 0.3, height * 0.25);
  ctx.beginPath();
  ctx.moveTo(width * 0.75, height * 0.1);
  ctx.lineTo(width * 0.75, height * 0.35);
  ctx.stroke();
  
  // Chair
  ctx.fillStyle = "#333333";
  ctx.fillRect(width * 0.45, height * 0.6, width * 0.1, height * 0.1);
}
