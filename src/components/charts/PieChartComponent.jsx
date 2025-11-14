import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042"]; 

const renderCustomizedLabel = ({ percent }) => `${(percent * 100).toFixed(0)}%`;

const PieChartComponent = ({ data }) => (
  <ResponsiveContainer width="100%" height="100%">
    <PieChart>
      <Pie
        data={data}
        dataKey="value"
        nameKey="title"
        cx="50%"
        cy="50%"
        outerRadius={80}
        labelLine={false}
        label={renderCustomizedLabel}
      >
        {data.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
        ))}
      </Pie>
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
    </PieChart>
  </ResponsiveContainer>
);

export default PieChartComponent;
