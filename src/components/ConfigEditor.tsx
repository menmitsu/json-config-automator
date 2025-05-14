
import React, { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface ConfigEditorProps {
  config: any;
  onUpdateConfig: (newConfig: any) => void;
}

const ConfigEditor: React.FC<ConfigEditorProps> = ({ config, onUpdateConfig }) => {
  const [jsonText, setJsonText] = useState(JSON.stringify(config, null, 2));
  const [isOpen, setIsOpen] = useState(false);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setJsonText(e.target.value);
  };

  const handleSave = () => {
    try {
      const parsedJson = JSON.parse(jsonText);
      onUpdateConfig(parsedJson);
      toast({
        title: "Success",
        description: "Configuration successfully updated",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Invalid JSON format. Please check your input.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        {Object.entries(config).map(([key, value]) => (
          <div key={key} className="grid grid-cols-2 gap-2 items-center">
            <div className="font-medium text-sm">{key}</div>
            <div className="text-sm truncate">
              {typeof value === "string" || typeof value === "number" ? String(value) : JSON.stringify(value)}
            </div>
          </div>
        ))}
      </div>

      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
        <CollapsibleTrigger asChild>
          <Button variant="outline" size="sm" className="w-full">
            {isOpen ? "Hide JSON Editor" : "Edit JSON Directly"}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-4 space-y-4">
          <Textarea
            value={jsonText}
            onChange={handleTextChange}
            className="font-mono h-[300px]"
          />
          <Button onClick={handleSave} className="w-full">
            Save Changes
          </Button>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default ConfigEditor;
