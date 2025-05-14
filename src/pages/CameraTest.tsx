
import React from "react";
import CameraSnapshot from "@/components/CameraSnapshot";
import Navigation from "@/components/Navigation";

const CameraTest: React.FC = () => {
  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="flex justify-center mb-6">
        <Navigation />
      </div>
      
      <h1 className="text-3xl font-bold mb-6">Camera Snapshot Test</h1>
      <CameraSnapshot />
      
      <div className="mt-8 p-4 bg-muted rounded-md">
        <h2 className="font-semibold mb-2">How this works</h2>
        <p className="text-sm">
          This page uses a Supabase Edge Function to proxy requests to your camera system. 
          The Edge Function makes the request with your credentials and returns the image data,
          avoiding any CORS or mixed content issues that occur with client-side requests.
        </p>
      </div>
    </div>
  );
};

export default CameraTest;
