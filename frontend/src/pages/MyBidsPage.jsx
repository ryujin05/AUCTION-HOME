import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  Spinner,
  Center,
  useColorModeValue,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useListStore } from "../store/list.js";
import { Link } from "react-router-dom";

const MyBidsPage = () => {
  const fetchMyBids = useListStore((s) => s.fetchMyBids);
  const [loading, setLoading] = useState(true);
  const [bids, setBids] = useState([]);
  const [error, setError] = useState("");

  const cardBg = useColorModeValue("white", "gray.800");
  const subText = useColorModeValue("gray.600", "gray.300");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const res = await fetchMyBids();
      if (res.success) {
        setBids(res.data || []);
        setError("");
      } else {
        setError(res.message || "Không thể tải lịch sử đặt giá");
      }
      setLoading(false);
    };
    load();
  }, [fetchMyBids]);

  if (loading) {
    return (
      <Center minH="60vh">
        <Spinner size="xl" color="red.500" />
      </Center>
    );
  }

  return (
    <Container maxW="1000px" py={8}>
      <Heading size="lg" mb={4}>
        Lịch sử đặt giá
      </Heading>
      {error && (
        <Text color="red.500" mb={4}>
          {error}
        </Text>
      )}
      {bids.length === 0 ? (
        <Text color={subText}>Chưa có lượt đặt giá nào.</Text>
      ) : (
        <VStack spacing={4} align="stretch">
          {bids.map((b) => (
            <Box
              key={b._id}
              p={4}
              borderRadius="lg"
              bg={cardBg}
              borderWidth="1px"
              borderColor={borderColor}
            >
              <HStack justify="space-between" align="start" spacing={4}>
                <VStack align="start" spacing={1}>
                  <Text fontWeight="600">
                    {b.listing?.title || "Phiên đấu giá"}
                  </Text>
                  <Text fontSize="sm" color={subText}>
                    {b.listing?._id ? (
                      <Link to={`/listings/${b.listing._id}`}>Xem chi tiết</Link>
                    ) : (
                      ""
                    )}
                  </Text>
                  <Text fontSize="sm" color={subText}>
                    {new Date(b.createdAt).toLocaleString("vi-VN")}
                  </Text>
                  <Text fontSize="sm" color={subText}>
                    Kết thúc: {b.listing?.endTime ? new Date(b.listing.endTime).toLocaleString("vi-VN") : "—"}
                  </Text>
                </VStack>
                <VStack align="end" spacing={1}>
                  <Text fontWeight="700" color="red.500">
                    {Number(b.amount).toLocaleString("vi-VN")} VNĐ
                  </Text>
                  {b.listing?.auctionStatus && (
                    <Badge colorScheme={b.listing.auctionStatus === "ended" ? "red" : "green"}>
                      {b.listing.auctionStatus === "ended" ? "Kết thúc" : "Đang đấu giá"}
                    </Badge>
                  )}
                </VStack>
              </HStack>
            </Box>
          ))}
        </VStack>
      )}
    </Container>
  );
};

export default MyBidsPage;
