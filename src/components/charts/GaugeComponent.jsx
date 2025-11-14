import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="p-2 rounded-md shadow-md text-sm bg-card text-card-foreground border">
        <p className="font-semibold">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.stroke }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }

  return null;
}

function GaugeComponent({ data }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
        <PolarGrid stroke="hsl(var(--border))" />
        <PolarAngleAxis dataKey="subject" stroke="hsl(var(--foreground))" />
        <PolarRadiusAxis stroke="hsl(var(--border))" />
        <Radar
          name="Value"
          dataKey="value"
          stroke="hsl(var(--primary))"
          fill="hsl(var(--primary))"
          fillOpacity={0.4}
          dot={{ stroke: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, stroke: 'hsl(var(--foreground))', strokeWidth: 3, fill: 'hsl(var(--primary))' }}
        />
        <Radar
          name="Title"
          dataKey="title"
          stroke="hsl(var(--primary))"
          fill="hsl(var(--primary))"
          fillOpacity={0.4}
          dot={{ stroke: 'hsl(var(--secondary))', strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, stroke: 'hsl(var(--foreground))', strokeWidth: 3, fill: 'hsl(var(--secondary))' }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend iconSize={10} layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ color: 'hsl(var(--foreground))' }} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

export default GaugeComponent;
