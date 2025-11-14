import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

const BarChartComponent = ({ data }) => (
  <ResponsiveContainer width="100%" height="100%">
    <BarChart data={data}>
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
        }}
        itemStyle={{
          color: "hsl(var(--foreground))",
          fontWeight: 500,
        }}
      />
      <Bar
        dataKey="value"
        fill="hsl(var(--primary))"
        radius={[6, 6, 0, 0]}
      />
    </BarChart>
  </ResponsiveContainer>
);

export default BarChartComponent;
