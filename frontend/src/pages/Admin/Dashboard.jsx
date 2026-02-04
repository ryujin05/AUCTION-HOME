import { useEffect, useState } from "react";
import { Box, Heading, SimpleGrid, Stat, StatLabel, StatNumber, Progress, VStack, Text, useColorModeValue } from "@chakra-ui/react";
import adminService from "../../services/adminService";
import LineChartComponent from "../../components/AdminCharts/LineChartComponent.jsx";
import PieChartComponent from "../../components/AdminCharts/PieChartComponent.jsx";


export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [userSeries, setUserSeries] = useState([]);
  const [statusPie, setStatusPie] = useState([]);
  const cardBg = useColorModeValue('white','gray.800');
  const statLabelColor = useColorModeValue('gray.600','gray.300');
  const statNumberColor = useColorModeValue('gray.900','white');

  useEffect(() => {
    adminService.getStats().then((res) => setStats(res.data)).catch(() => {});
    
    // Mocked data for charts (easily replace with API call later)
    const mockUsers = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      mockUsers.push({ date: date.toLocaleDateString(), count: Math.floor(Math.random() * 10) + 1 });
    }

    const mockStatus = [
      { name: "Approved", value: 55 },
      { name: "Pending", value: 30 },
      { name: "Rejected", value: 15 },
    ];

    setUserSeries(mockUsers);
    setStatusPie(mockStatus);
  }, []);

  if (!stats) return <Text>Đang tải...</Text>;

  const { totalListings, totalUsers, pendingListings, approvedListings } = stats;

  return (
    <Box>
      <Heading size="md" mb={4}>Tổng quan</Heading>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={4}>
        <Stat p={4} bg={cardBg} borderRadius="md">
          <StatLabel color={statLabelColor}>Tổng tin đăng</StatLabel>
          <StatNumber color={statNumberColor}>{totalListings}</StatNumber>
          <Progress mt={2} value={Math.min(100, (approvedListings / Math.max(1, totalListings)) * 100)} colorScheme="blue" />
        </Stat>

        <Stat p={4} bg={cardBg} borderRadius="md">
          <StatLabel color={statLabelColor}>Tổng người dùng</StatLabel>
          <StatNumber color={statNumberColor}>{totalUsers}</StatNumber>
          <Progress mt={2} value={50} colorScheme="blue" />
        </Stat>
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
        <Box>
          <Heading size="sm" mb={2}>Người dùng mới (7 ngày)</Heading>
          <LineChartComponent data={userSeries} />
        </Box>

        <Box>
          <Heading size="sm" mb={2}>Phân bố trạng thái bài đăng</Heading>
          <PieChartComponent data={statusPie} />
        </Box>
      </SimpleGrid>
    </Box>
  );
}
