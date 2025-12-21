import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, FileText, Calendar, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { postData, getData } from "@/lib/api";

// Boolean keys in reportConfig
type ReportBooleanKeys =
  | "includeCharts"
  | "includeTrends"
  | "includeComparisons"
  | "includeRecommendations";

// Helper: remove "_24" etc.
const cleanName = (val: string) => val.split("_")[0];

const Report = () => {
  const { toast } = useToast();

  // Final dropdown state
  const [filterOptions, setFilterOptions] = useState({
    states: [] as string[],
    districts: [] as string[],
    blocks: [] as string[],
  });

  // Raw rows for state → district → block filtering
  const [rawFilters, setRawFilters] = useState<any[]>([]);

  // Report config
  const [reportConfig, setReportConfig] = useState({
    state: "",
    district: "",
    block: "",
    reportType: "",
    includeCharts: true,
    includeTrends: true,
    includeComparisons: false,
    includeRecommendations: true,
  });

  // Load filters from backend
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const res = await getData("/available-filters");

        // Build raw filter rows (state, district, block)
        const cleanedRaw = (res.raw || []).map((r: any) => ({
          state: cleanName(r.state),
          district: cleanName(r.district),
          block: cleanName(r.block),
        }));

        setRawFilters(cleanedRaw);

        setFilterOptions({
          states: (res.states || []).map(cleanName),
          districts: [],
          blocks: [],
        });
      } catch (err) {
        console.error("Error loading filters", err);
        toast({
          title: "Error",
          description: "Could not load filters from backend.",
          variant: "destructive",
        });
      }
    };

    loadFilters();
  }, []);

  // When STATE changes → update districts
  useEffect(() => {
    if (!reportConfig.state) return;

    const districts = rawFilters
      .filter((r) => r.state === reportConfig.state)
      .map((r) => r.district);

    setFilterOptions((prev) => ({
      ...prev,
      districts: [...new Set(districts)],
      blocks: [],
    }));

    setReportConfig((prev) => ({ ...prev, district: "", block: "" }));
  }, [reportConfig.state]);

  // When DISTRICT changes → update blocks
  useEffect(() => {
    if (!reportConfig.district) return;

    const blocks = rawFilters
      .filter((r) => r.district === reportConfig.district)
      .map((r) => r.block);

    setFilterOptions((prev) => ({
      ...prev,
      blocks: [...new Set(blocks)],
    }));

    setReportConfig((prev) => ({ ...prev, block: "" }));
  }, [reportConfig.district]);

  // Handle REPORT generation
  const handleGenerateReport = async () => {
    if (!reportConfig.state || !reportConfig.district || !reportConfig.reportType) {
      toast({
        title: "Missing Information",
        description: "Please fill all required fields.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Generating Report",
      description: "Please wait...",
    });

    try {
      const result = await postData("/generate_report", reportConfig);

      toast({
        title: "Report Ready",
        description: result?.message || "Report generated successfully.",
      });

      // Download file
      if (result?.path) {
        const link = document.createElement("a");
        link.href = `http://127.0.0.1:8000/${result.path.replace("\\", "/")}`;
        link.download = result.path.split("/").pop() || "report.pdf";
        link.click();
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to generate report.",
        variant: "destructive",
      });
    }
  };

  const reportTypes = [
    { value: "annual", label: "Annual Analysis Report" },
    { value: "seasonal", label: "Seasonal Comparison Report" },
    { value: "trend", label: "Long-term Trend Analysis" },
    { value: "summary", label: "Executive Summary" },
  ];

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl lg:text-4xl font-bold mb-4 bg-gradient-ocean bg-clip-text text-transparent">
          Report Generator
        </h1>
        <p className="text-lg text-muted-foreground">
          Generate comprehensive groundwater analysis reports.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* LEFT SIDE CONFIG */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Report Configuration
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* LOCATION */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Location
                </h3>

                <div className="grid md:grid-cols-3 gap-4">
                  {/* STATE */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">State *</label>
                    <Select
                      value={reportConfig.state}
                      onValueChange={(v) => setReportConfig({ ...reportConfig, state: v })}
                    >
                      <SelectTrigger><SelectValue placeholder="Select State" /></SelectTrigger>
                      <SelectContent>
                        {filterOptions.states.map((s, i) => (
                          <SelectItem key={i} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* DISTRICT */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">District *</label>
                    <Select
                      value={reportConfig.district}
                      onValueChange={(v) => setReportConfig({ ...reportConfig, district: v })}
                      disabled={!reportConfig.state}
                    >
                      <SelectTrigger><SelectValue placeholder="Select District" /></SelectTrigger>
                      <SelectContent>
                        {filterOptions.districts.map((d, i) => (
                          <SelectItem key={i} value={d}>{d}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* BLOCK */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Block</label>
                    <Select
                      value={reportConfig.block}
                      onValueChange={(v) => setReportConfig({ ...reportConfig, block: v })}
                      disabled={!reportConfig.district}
                    >
                      <SelectTrigger><SelectValue placeholder="Select Block" /></SelectTrigger>
                      <SelectContent>
                        {filterOptions.blocks.map((b, i) => (
                          <SelectItem key={i} value={b}>{b}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* REPORT TYPE */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Report Type
                </h3>
                <Select
                  value={reportConfig.reportType}
                  onValueChange={(value) =>
                    setReportConfig({ ...reportConfig, reportType: value })
                  }
                >
                  <SelectTrigger><SelectValue placeholder="Select Report Type" /></SelectTrigger>
                  <SelectContent>
                    {reportTypes.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* CHECKBOXES */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Include in Report</h3>

                <div className="space-y-3">
                  {[
                    ["includeCharts", "Charts & Visualizations"],
                    ["includeTrends", "Trend Analysis"],
                    ["includeComparisons", "Regional Comparisons"],
                    ["includeRecommendations", "Recommendations"],
                  ].map(([key, label]) => (
                    <div key={key} className="flex items-center space-x-2">
                      <Checkbox
                        checked={reportConfig[key as ReportBooleanKeys]}
                        onCheckedChange={(checked) =>
                          setReportConfig({
                            ...reportConfig,
                            [key]: checked === true,
                          })
                        }
                      />
                      <label className="text-sm font-medium">{label}</label>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleGenerateReport}
                className="w-full bg-gradient-water shadow-water"
              >
                <Download className="h-4 w-4 mr-2" />
                Generate Report
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT PREVIEW */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Report Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">

                {/* TITLE */}
                <div className="p-4 border rounded-lg bg-muted/50">
                  <h4 className="font-semibold mb-2">Report Title</h4>
                  <p className="text-sm text-muted-foreground">
                    {reportConfig.reportType
                      ? reportTypes.find((t) => t.value === reportConfig.reportType)?.label
                      : "Select report type"}
                  </p>
                </div>

                {/* COVERAGE */}
                <div className="p-4 border rounded-lg bg-muted/50">
                  <h4 className="font-semibold mb-2">Coverage Area</h4>
                  <p className="text-sm text-muted-foreground">
                    {reportConfig.state && reportConfig.district
                      ? `${reportConfig.district}, ${reportConfig.state}${
                          reportConfig.block
                            ? ` (${reportConfig.block})`
                            : ""
                        }`
                      : "Select location"}
                  </p>
                </div>

                {/* SECTIONS */}
                <div className="p-4 border rounded-lg bg-muted/50">
                  <h4 className="font-semibold mb-2">Sections</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Executive Summary</li>
                    <li>• Water Level Data</li>
                    {reportConfig.includeCharts && <li>• Charts & Graphs</li>}
                    {reportConfig.includeTrends && <li>• Trend Analysis</li>}
                    {reportConfig.includeComparisons && <li>• Regional Comparisons</li>}
                    {reportConfig.includeRecommendations && <li>• Recommendations</li>}
                  </ul>
                </div>

              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
};

export default Report;
