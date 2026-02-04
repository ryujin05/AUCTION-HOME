import { Box, useColorModeValue } from "@chakra-ui/react";
import { useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

const STATUS_COLOR_MAP = {
  approved: '#2B6CB0', // blue
  pending: '#DD6B20', // orange
  rejected: '#E53E3E', // red
  default: '#718096', // slate
};

export default function PieChartComponent({ data, height = 240 }){
  const boxBg = useColorModeValue('white','gray.800');
  const chartData = Array.isArray(data) ? data : [];

  useEffect(() => {
    // Debug: ensure we know what payload arrives at runtime
    // eslint-disable-next-line no-console
    console.debug('[PieChartComponent] data:', chartData);
    // eslint-disable-next-line no-console
    console.debug('[PieChartComponent] legend payload:', chartData.map(d => ({ value: d.name, color: colorFor(d.name) })));
  }, [chartData]);

  const colorFor = (name, fallbackIndex) => {
    if (!name) return STATUS_COLOR_MAP.default;
    const n = name.toString().toLowerCase();
    if (n.includes('approve')) return STATUS_COLOR_MAP.approved;
    if (n.includes('pending') || n.includes('wait')) return STATUS_COLOR_MAP.pending;
    if (n.includes('reject') || n.includes('denied')) return STATUS_COLOR_MAP.rejected;
    return STATUS_COLOR_MAP.default;
  };

  const translateStatusLabel = (name) => {
    if (!name) return name;
    const n = name.toString().toLowerCase();
    if (n.includes('approve')) return 'Đã duyệt';
    if (n.includes('pending') || n.includes('wait')) return 'Chờ duyệt';
    if (n.includes('reject') || n.includes('denied')) return 'Đã từ chối';
    return name;
  };

  return (
    <Box bg={boxBg} p={4} borderRadius="md">
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie dataKey="value" data={chartData} nameKey="name" cx="50%" cy="50%" outerRadius={80} label={{ fill: useColorModeValue('#1A202C', '#EDF2F7') }} isAnimationActive={false} startAngle={90} endAngle={-270}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colorFor(entry.name, index)} stroke={colorFor(entry.name, index)} strokeWidth={1} />
            ))}
          </Pie>
          <Tooltip formatter={(value, name) => [value, translateStatusLabel(name)]} />
          <Legend payload={chartData.map((d) => ({ value: translateStatusLabel(d.name), type: 'square', color: colorFor(d.name) }))} />
        </PieChart>
      </ResponsiveContainer>
    </Box>
  );
}
