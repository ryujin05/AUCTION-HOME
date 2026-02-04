import { Box, useColorModeValue } from "@chakra-ui/react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function LineChartComponent({ data, height = 240 }) {
  const bg = useColorModeValue("white", "gray.800");
  const gridColor = useColorModeValue("#E2E8F0", "#2D3748");
  const tickColor = useColorModeValue("#1A202C", "#EDF2F7");

  return (
    <Box bg={bg} p={4} borderRadius="md">
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data}>
          <CartesianGrid stroke={gridColor} strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fill: tickColor }} />
          <YAxis tick={{ fill: tickColor }} />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="count"
            stroke="#3182CE"
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
}
