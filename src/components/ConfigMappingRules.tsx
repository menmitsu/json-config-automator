
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { ConfigMappingRule } from "@/hooks/useConfigMapping";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ConfigMappingRulesProps {
  onRulesChange: (rules: ConfigMappingRule[]) => void;
  availableFields: string[];
  configFields: string[];
}

const ConfigMappingRules: React.FC<ConfigMappingRulesProps> = ({
  onRulesChange,
  availableFields,
  configFields
}) => {
  const [rules, setRules] = useState<ConfigMappingRule[]>([
    { csvField: "", configField: "" }
  ]);

  useEffect(() => {
    onRulesChange(rules.filter(rule => rule.csvField && rule.configField));
  }, [rules, onRulesChange]);

  const handleAddRule = () => {
    setRules([...rules, { csvField: "", configField: "" }]);
  };

  const handleRemoveRule = (index: number) => {
    const newRules = [...rules];
    newRules.splice(index, 1);
    setRules(newRules);
  };

  const handleRuleChange = (index: number, field: keyof ConfigMappingRule, value: string) => {
    const newRules = [...rules];
    (newRules[index] as any)[field] = value;
    setRules(newRules);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>CSV to Config Mapping Rules</span>
          <Button size="sm" variant="outline" onClick={handleAddRule}>
            <Plus className="h-4 w-4 mr-1" /> Add Rule
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {rules.map((rule, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-[2fr_2fr_1fr] gap-2 items-center">
              <div>
                <Label htmlFor={`csvField-${index}`} className="text-xs">CSV Field</Label>
                <Select
                  value={rule.csvField}
                  onValueChange={(value) => handleRuleChange(index, "csvField", value)}
                >
                  <SelectTrigger id={`csvField-${index}`}>
                    <SelectValue placeholder="Select CSV field" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableFields.map(field => (
                      <SelectItem key={field} value={field}>{field}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor={`configField-${index}`} className="text-xs">Config Field</Label>
                <Select
                  value={rule.configField}
                  onValueChange={(value) => handleRuleChange(index, "configField", value)}
                >
                  <SelectTrigger id={`configField-${index}`}>
                    <SelectValue placeholder="Select config field" />
                  </SelectTrigger>
                  <SelectContent>
                    {configFields.map(field => (
                      <SelectItem key={field} value={field}>{field}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button 
                variant="ghost" 
                size="icon" 
                className="mt-5"
                onClick={() => handleRemoveRule(index)}
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          ))}

          {rules.length === 0 && (
            <div className="text-center py-4 text-sm text-gray-500">
              No mapping rules defined. Click "Add Rule" to create a mapping.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ConfigMappingRules;
