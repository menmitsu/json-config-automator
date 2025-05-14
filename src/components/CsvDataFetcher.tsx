
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { fetchCsvData } from "@/services/csvService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CsvDataFetcherProps {
  onDataFetched: (data: Record<string, string>[]) => void;
  initialUrl?: string;
}

const CsvDataFetcher: React.FC<CsvDataFetcherProps> = ({ onDataFetched, initialUrl }) => {
  const [csvUrl, setCsvUrl] = useState<string>(initialUrl || "https://docs.google.com/spreadsheets/d/1EANvZgBTpp5siZVsgNjtWDUPZbZFsQALmBHO2zET7lw/edit?gid=0#gid=0");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [previewData, setPreviewData] = useState<Record<string, string>[]>([]);

  const handleFetchCsv = async () => {
    if (!csvUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid Google Sheets or CSV URL",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const data = await fetchCsvData(csvUrl);
      setPreviewData(data.slice(0, 5)); // Preview first 5 rows
      onDataFetched(data);
      toast({
        title: "Success",
        description: `Fetched ${data.length} rows of data from CSV`,
      });
    } catch (error) {
      console.error("Error fetching CSV:", error);
      toast({
        title: "Error",
        description: "Failed to fetch CSV data. Please check the URL and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="csvUrl">Google Sheets or CSV URL</Label>
        <div className="flex gap-2">
          <Input
            id="csvUrl"
            value={csvUrl}
            onChange={(e) => setCsvUrl(e.target.value)}
            placeholder="Enter Google Sheets URL or CSV URL"
            className="flex-1"
            disabled={isLoading}
          />
          <Button onClick={handleFetchCsv} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Fetching...
              </>
            ) : (
              "Fetch Data"
            )}
          </Button>
        </div>
      </div>

      {previewData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Preview (First 5 Rows)</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64 w-full">
              <div className="w-full">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b">
                      {Object.keys(previewData[0]).map((header) => (
                        <th key={header} className="p-2 font-medium">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((row, index) => (
                      <tr key={index} className="border-b border-gray-100">
                        {Object.values(row).map((value, cellIndex) => (
                          <td key={cellIndex} className="p-2">{value}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CsvDataFetcher;
