import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency } from "@anurag/utils";
import { useMediaQuery } from "@/lib/use-media-query";

const COLORS = ["#3b82f6", "#f97316", "#8b5cf6", "#22c55e", "#ec4899", "#6b7280"];

interface TrendPoint {
  label: string;
  total: string;
}

interface CategoryPoint {
  name: string;
  total: string;
  color: string | null;
}

interface AnalyticsChartsProps {
  currency: string;
  trends?: TrendPoint[];
  byCategory?: CategoryPoint[];
}

export function TrendsChart({ currency, trends }: { currency: string; trends?: TrendPoint[] }) {
  const isNarrow = useMediaQuery("(max-width: 639px)");
  const chartData =
    trends?.map((t) => ({
      name: t.label,
      total: Number.parseFloat(t.total) || 0,
    })) ?? [];

  if (!chartData.length) {
    return (
      <p className="flex h-full items-center justify-center px-2 text-center text-sm text-[var(--color-muted-foreground)]">
        No spending data yet
      </p>
    );
  }

  const manyLabels = chartData.length > 4;

  return (
    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={200}>
      <BarChart
        data={chartData}
        margin={{ top: 4, right: 4, left: isNarrow ? -16 : 0, bottom: 0 }}
      >
        <XAxis
          dataKey="name"
          tick={{ fontSize: isNarrow ? 10 : 12 }}
          interval={isNarrow ? "preserveStartEnd" : 0}
          angle={isNarrow && manyLabels ? -30 : 0}
          textAnchor={isNarrow && manyLabels ? "end" : "middle"}
          height={isNarrow && manyLabels ? 52 : 30}
        />
        <YAxis tick={{ fontSize: isNarrow ? 10 : 12 }} width={isNarrow ? 36 : 48} />
        <Tooltip formatter={(v: number) => formatCurrency(v, currency)} />
        <Bar dataKey="total" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function CategoryChart({
  currency,
  byCategory,
}: {
  currency: string;
  byCategory?: CategoryPoint[];
}) {
  const isNarrow = useMediaQuery("(max-width: 639px)");
  const pieData =
    byCategory?.map((c) => ({
      name: c.name,
      value: Number.parseFloat(c.total) || 0,
      color: c.color,
    })) ?? [];

  if (!pieData.length) {
    return (
      <p className="flex h-full items-center justify-center px-2 text-center text-sm text-[var(--color-muted-foreground)]">
        No category data this month
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={200}>
      <PieChart>
        <Pie
          data={pieData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={isNarrow ? 72 : 80}
        >
          {pieData.map((entry, i) => (
            <Cell key={entry.name} fill={entry.color ?? COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(v: number) => formatCurrency(v, currency)} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function AnalyticsCharts({ currency, trends, byCategory }: AnalyticsChartsProps) {
  return (
    <>
      <TrendsChart currency={currency} trends={trends} />
      <CategoryChart currency={currency} byCategory={byCategory} />
    </>
  );
}
