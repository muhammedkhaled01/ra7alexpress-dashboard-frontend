import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";

const LineChartComponent = ({ data }) => (
  <ResponsiveContainer width="100%" height="100%">
    <AreaChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
      <defs>
        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="hsl(var(--chart-primary))" stopOpacity={0.4} />
          <stop offset="95%" stopColor="hsl(var(--chart-primary))" stopOpacity={0} />
        </linearGradient>
      </defs>

      <XAxis
        dataKey="title"
        stroke="hsl(var(--muted-foreground))"
        tick={{ fontSize: 12 }}
        axisLine={{ stroke: "hsl(var(--border))" }}
        tickLine={{ stroke: "hsl(var(--border))" }}
      />
      <YAxis
        stroke="hsl(var(--muted-foreground))"
        tick={{ fontSize: 12 }}
        axisLine={{ stroke: "hsl(var(--border))" }}
        tickLine={{ stroke: "hsl(var(--border))" }}
      />
      <Tooltip
        contentStyle={{
          backgroundColor: "hsl(var(--popover))",
          borderColor: "hsl(var(--border))",
          borderRadius: "0.75rem",
          boxShadow: "0 4px 14px rgba(0,0,0,0.1)",
        }}
        itemStyle={{
          color: "hsl(var(--foreground))",
          fontWeight: 500,
        }}
        cursor={{ stroke: 'hsl(var(--chart-primary))', strokeWidth: 2 }}
      />
      <Area
        type="monotone"
        dataKey="value"
        stroke="hsl(var(--chart-primary))"
        fillOpacity={1}
        fill="url(#colorValue)"
        strokeWidth={3}
        dot={{
          stroke: "hsl(var(--chart-primary))",
          strokeWidth: 2,
          fill: "hsl(var(--background))",
          r: 4,
        }}
        activeDot={{
          r: 6,
          fill: "hsl(var(--chart-primary))",
          stroke: "hsl(var(--chart-primary))",
          strokeWidth: 2,
        }}
      />
    </AreaChart>
  </ResponsiveContainer>
);

export default LineChartComponent;
