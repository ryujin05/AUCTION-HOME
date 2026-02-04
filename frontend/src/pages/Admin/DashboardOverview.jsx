import { useEffect, useState } from "react";
import {
  Box,
  Heading,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  Progress,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import adminService from "../../services/adminService";
import LineChartComponent from "../../components/AdminCharts/LineChartComponent.jsx";
import PieChartComponent from "../../components/AdminCharts/PieChartComponent.jsx";

export default function DashboardOverview() {
  const [stats, setStats] = useState(null);
  const [userSeries, setUserSeries] = useState([]);
  const [statusPie, setStatusPie] = useState([]);
  const [statusCounts, setStatusCounts] = useState({});
  const [listingSeries, setListingSeries] = useState([]);
  const cardBg = useColorModeValue("white", "gray.800");
  const statLabelColor = useColorModeValue("gray.600", "gray.300");
  const statNumberColor = useColorModeValue("gray.900", "white");

  useEffect(() => {
    adminService
      .getStats()
      .then((res) => {
        const body = res.data || {};
        setStats(body.totals || null);
        setStatusPie(body.propertyStatus || []);
        setStatusCounts(body.statusCounts || {});
      })
      .catch(() => {});

    adminService
      .getUserSignupsLast7Days()
      .then((res) => {
        setUserSeries(res.data.data || []);
      })
      .catch(() => {});

    adminService
      .getListingsLast7Days()
      .then((res) => {
        setListingSeries(res.data.data || []);
      })
      .catch(() => {});
  }, []);

  if (!stats) return <Text>Đang tải...</Text>;

  const { totalListings, totalUsers } = stats;
  const pendingCount = statusCounts.pending || statusCounts.waiting || 0;

  return (
    <Box>
      <Heading size="md" mb={4}>
        Tổng quan
      </Heading>

      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={4}>
        <Stat p={4} bg={cardBg} borderRadius="md">
          <StatLabel color={statLabelColor}>Tin chờ duyệt</StatLabel>
          <StatNumber color={statNumberColor}>{pendingCount}</StatNumber>
        </Stat>
        <Stat p={4} bg={cardBg} borderRadius="md">
          <StatLabel color={statLabelColor}>Tổng tin đăng</StatLabel>
          <StatNumber color={statNumberColor}>{totalListings}</StatNumber>
          <Progress mt={2} value={50} colorScheme="blue" />
        </Stat>

        <Stat p={4} bg={cardBg} borderRadius="md">
          <StatLabel color={statLabelColor}>Tổng người dùng</StatLabel>
          <StatNumber color={statNumberColor}>{totalUsers}</StatNumber>
          <Progress mt={2} value={50} colorScheme="blue" />
        </Stat>
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
        <Box>
          <Heading size="sm" mb={2}>
            Người dùng mới (7 ngày gần nhất)
          </Heading>
          <LineChartComponent data={userSeries} />
        </Box>
        <Box>
          <Heading size="sm" mb={2}>
            Tin mới (7 ngày gần nhất)
          </Heading>
          <LineChartComponent data={listingSeries} />
        </Box>

        <Box>
          <Heading size="sm" mb={2}>
            Phân bố trạng thái bài đăng
          </Heading>
          <PieChartComponent data={statusPie} />
        </Box>
      </SimpleGrid>
    </Box>
  );
}
