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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getData } from "@/lib/api";

// Remove "_112" etc
const cleanName = (val: string) => val.split("_")[0];

const Explore = () => {
  const { toast } = useToast();

  const [filters, setFilters] = useState({
    state: "",
    district: "",
    block: "",
    year: "",
    season: "",
  });

  // Final dropdowns used by UI
  const [filterOptions, setFilterOptions] = useState({
    states: [] as string[],
    districts: [] as string[],
    blocks: [] as string[],
    years: [] as number[],
    seasons: [] as string[],
  });

  // Raw CSV rows (cleaned)
  const [rawFilters, setRawFilters] = useState<any[]>([]);

  const [rows, setRows] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);

  // Load backend filters ONCE
  useEffect(() => {
    const load = async () => {
      try {
        const res = await getData("/available-filters");

        const cleanedRaw = res.raw.map((r: any) => ({
          state: cleanName(r.state),
          district: cleanName(r.district),
          block: cleanName(r.block),
        }));

        setRawFilters(cleanedRaw);

        setFilterOptions({
         states: (res.states as string[]).map(cleanName),
          districts: [],
          blocks: [],
          years: res.years,
          seasons: res.seasons,
        });
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to load filter options.",
          variant: "destructive",
        });
      }
    };

    load();
  }, []);

  // When STATE changes → load only its districts
  useEffect(() => {
    if (!filters.state) return;

    const districts = rawFilters
      .filter((r) => r.state === filters.state)
      .map((r) => r.district);

    setFilterOptions((prev) => ({
      ...prev,
      districts: [...new Set(districts)],
      blocks: [],
    }));

    setFilters((prev) => ({ ...prev, district: "", block: "" }));
  }, [filters.state]);

  // When DISTRICT changes → load only its blocks
  useEffect(() => {
    if (!filters.district) return;

    const blocks = rawFilters
      .filter((r) => r.district === filters.district)
      .map((r) => r.block);

    setFilterOptions((prev) => ({
      ...prev,
      blocks: [...new Set(blocks)],
    }));

    setFilters((prev) => ({ ...prev, block: "" }));
  }, [filters.district]);

  // SEARCH FUNCTION
  const handleSearch = async () => {
    try {
      const qp = new URLSearchParams();

      Object.entries(filters).forEach(([k, v]) => {
        if (v) qp.append(k, v);
      });

      const res = await getData(`/water-level?${qp.toString()}`);

      setRows(res);

      setChartData(
        res.map((r: any) => ({
          year: r.year,
          level: r.water_level,
        }))
      );

      toast({
        title: "Loaded",
        description: `${res.length} records found.`,
      });
    } catch {
      toast({
        title: "No Data Found",
        description: "No results for selected filters.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl lg:text-4xl font-bold mb-4 bg-gradient-ocean bg-clip-text text-transparent">
          Water Level Explorer
        </h1>
        <p className="text-lg text-muted-foreground">
          Search and analyze groundwater levels across India.
        </p>
      </div>

      {/* FILTERS */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Search Filters
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4 mb-4">

            {/* STATE */}
            <Select
              value={filters.state}
              onValueChange={(v) => setFilters({ ...filters, state: v })}
            >
              <SelectTrigger><SelectValue placeholder="State" /></SelectTrigger>
              <SelectContent>
                {filterOptions.states.map((s, i) => (
                  <SelectItem key={i} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* DISTRICT */}
            <Select
              value={filters.district}
              onValueChange={(v) => setFilters({ ...filters, district: v })}
              disabled={!filters.state}
            >
              <SelectTrigger><SelectValue placeholder="District" /></SelectTrigger>
              <SelectContent>
                {filterOptions.districts.map((d, i) => (
                  <SelectItem key={i} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* BLOCK */}
            <Select
              value={filters.block}
              onValueChange={(v) => setFilters({ ...filters, block: v })}
              disabled={!filters.district}
            >
              <SelectTrigger><SelectValue placeholder="Block" /></SelectTrigger>
              <SelectContent>
                {filterOptions.blocks.map((b, i) => (
                  <SelectItem key={i} value={b}>{b}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* YEAR */}
            <Select
              value={filters.year}
              onValueChange={(v) => setFilters({ ...filters, year: v })}
            >
              <SelectTrigger><SelectValue placeholder="Year" /></SelectTrigger>
              <SelectContent>
                {filterOptions.years.map((y, i) => (
                  <SelectItem key={i} value={y.toString()}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* SEASON */}
            <Select
              value={filters.season}
              onValueChange={(v) => setFilters({ ...filters, season: v })}
            >
              <SelectTrigger><SelectValue placeholder="Season" /></SelectTrigger>
              <SelectContent>
                {filterOptions.seasons.map((s, i) => (
                  <SelectItem key={i} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button className="bg-gradient-water shadow-water" onClick={handleSearch}>
            Search Data
          </Button>
        </CardContent>
      </Card>

      {/* RESULTS + CHART */}
      <div className="grid lg:grid-cols-2 gap-8">

        {/* TABLE */}
        <Card>
          <CardHeader><CardTitle>Results</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Location</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Season</TableHead>
                  <TableHead>Water Level (m)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row, i) => (
                  <TableRow key={i}>
                    <TableCell>{row.district} - {row.block}</TableCell>
                    <TableCell>{row.year}</TableCell>
                    <TableCell>{row.season}</TableCell>
                    <TableCell>{row.water_level}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* CHART */}
        <Card>
          <CardHeader><CardTitle>Water Level Trend</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="level" stroke="hsl(var(--primary))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default Explore;
