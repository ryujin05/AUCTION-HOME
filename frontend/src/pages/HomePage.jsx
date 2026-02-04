import {
  Container,
  SimpleGrid,
  Spinner,
  Center,
  Text,
  Heading,
  Box,
  Button,
  useColorModeValue,
} from "@chakra-ui/react";
import { FiUsers, FiGrid, FiCheckCircle } from "react-icons/fi";
import { useEffect, useState } from "react";
import ListingCard from "../components/ListingCard";
import HomePanel from "../components/HomePanel";
import { useListStore } from "../store/list.js";
import { useNavigate } from "react-router-dom";
import MapboxMap from "../components/MapboxMap";
import api from "../lib/axios.js";

const HomePage = () => {
  const { listings, loading, error, fetchListings } = useListStore();
  const navigate = useNavigate();
  const [mapListings, setMapListings] = useState([]);

  const approvedListings = listings || [];

  const contentBg = useColorModeValue("white", "gray.800");
  const subText = useColorModeValue("gray.600", "white");
  const cardShadow = useColorModeValue("lg", "dark-lg");
  const getSectionBg = (index) =>
    index % 2 === 0
      ? useColorModeValue("white", "gray.800")
      : useColorModeValue("gray.100", "gray.900");
  const aosDuration = 800;
  const aosDelay = 50;

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  useEffect(() => {
    const fetchMapData = async () => {
      try {
        const res = await api.get("/listings/getList?limit=1000");
        if (res.data && res.data.listings) {
          const approvedMapData = res.data.listings.filter(
            (item) => item.status === "approved"
          );
          setMapListings(approvedMapData);
        }
      } catch (error) {
        console.error("Lỗi set data lên bản đồ: ", error);
      }
    };
    fetchMapData();
  }, []);

  if (loading) {
    return (
      <Center minH="60vh">
        <Spinner size="xl" />
      </Center>
    );
  }

  if (error) {
    return (
      <Container maxW={"1140px"} py={12}>
        <Center>
          <Text>{error}</Text>
        </Center>
      </Container>
    );
  }

  return (
    <>
      <Box data-aos="fade-in" data-aos-duration="100">
        <HomePanel />
      </Box>

      {/* --- SECTION DANH SÁCH PHIÊN ĐẤU GIÁ --- */}
      <Box bg={getSectionBg(1)} py={10}>
        <Container
          maxW={"1140px"}
          textAlign="left"
          data-aos="fade-up"
          data-aos-duration={aosDuration}
          data-aos-delay={aosDelay}
        >
          <Heading as="h2" size="lg" mb={2}>
            Phiên đấu giá nổi bật
          </Heading>
          <Text color={subText}>
            Tổng hợp các căn hộ đấu giá đang thu hút nhiều người tham gia.
          </Text>
        </Container>

        <Container maxW={"1140px"} py={8}>
          {!approvedListings || approvedListings.length === 0 ? (
            <Center>
              <Text>Chưa có phiên đấu giá nào.</Text>
            </Center>
          ) : (
            (() => {
              const getTopThree = (items) => {
                if (!items || items.length === 0) return [];
                const rankFields = ["score", "rating", "views"];
                for (const f of rankFields) {
                  if (
                    items.some((it) => it[f] !== undefined && it[f] !== null)
                  ) {
                    return [...items]
                      .sort((a, b) => (b[f] || 0) - (a[f] || 0))
                      .slice(0, 6);
                  }
                }
                if (items.some((it) => it.createdAt)) {
                  return [...items]
                    .sort(
                      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
                    )
                    .slice(0, 6);
                }
                return items.slice(0, 6);
              };

              const top = getTopThree(approvedListings);

              return (
                <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={6}>
                  {top.map((l, index) => (
                    <Box
                      key={l._id || l.id}
                      data-aos="fade-up"
                      data-aos-duration={aosDuration}
                      data-aos-delay={aosDelay + index * 100}
                    >
                      <ListingCard listing={l} />
                    </Box>
                  ))}
                </SimpleGrid>
              );
            })()
          )}
        </Container>
        <Box
          textAlign="center"
          data-aos="fade-up"
          data-aos-duration={aosDuration / 2}
          data-aos-delay={aosDelay}
        >
          <Button
            size="lg"
            colorScheme="red"
            variant="outline"
            onClick={() => navigate("/listings")}
            data-aos="pulse"
            data-aos-duration={aosDuration / 2}
            data-aos-delay={aosDelay}
          >
            Xem tất cả phiên đấu giá
          </Button>
        </Box>
      </Box>

      {/* --- SECTION BẢN ĐỒ KHÁM PHÁ --- */}
      <Box bg={getSectionBg(2)} py={10}>
        <Container maxW={"1140px"}>
          <Box
            mb={6}
            data-aos="fade-up"
            data-aos-duration={aosDuration}
            data-aos-delay={aosDelay}
          >
            <Heading as="h3" size="lg" mb={2}>
              Bản đồ căn hộ đấu giá
            </Heading>
            <Text color={subText}>
              Xem tổng quan vị trí và mật độ phiên đấu giá trên toàn khu vực.
            </Text>
          </Box>

          <Box
            h="600px"
            w="100%"
            borderRadius="xl"
            overflow="hidden"
            boxShadow="xl"
            border="1px solid"
            borderColor="gray.200"
            position="relative"
            bg="gray.100"
            data-aos="zoom-in"
            data-aos-duration={aosDuration}
            data-aos-delay={aosDelay + 50}
          >
            <MapboxMap
              mode="explorer"
              data={mapListings.length > 0 ? mapListings : listings || []}
              height="100%"
            />
          </Box>
        </Container>
      </Box>

      {/* Features */}
      <Box bg={getSectionBg(3)} py={10}>
        <Container maxW={"1140px"} mt={6} mb={12}>
          <Box textAlign="center" mb={6}>
            <Heading as="h3" size="lg">
              Tại sao chọn Auction Home?
            </Heading>
            <Text color={subText} mt={2}>
              Đối tác tin cậy giúp bạn chọn phiên đấu giá phù hợp.
            </Text>
          </Box>

          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
            <Box bg={contentBg} borderRadius="md" p={6} boxShadow={cardShadow}>
              <Box
                mx="auto"
                mb={4}
                w="56px"
                h="56px"
                borderRadius="full"
                bg="red.50"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <FiGrid size={24} color="#C53030" />
              </Box>
              <Heading as="h4" size="md" mb={2} textAlign="center">
                Nguồn lựa chọn đa dạng
              </Heading>
              <Text color={subText} fontSize="sm" textAlign="center">
                Hàng nghìn phiên đấu giá đã được xác minh, dễ dàng tìm căn hộ phù
                hợp.
              </Text>
            </Box>

            <Box bg={contentBg} borderRadius="md" p={6} boxShadow={cardShadow}>
              <Box
                mx="auto"
                mb={4}
                w="56px"
                h="56px"
                borderRadius="full"
                bg="red.50"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <FiCheckCircle size={24} color="#C53030" />
              </Box>
              <Heading as="h4" size="md" mb={2} textAlign="center">
                Quy trình minh bạch
              </Heading>
              <Text color={subText} fontSize="sm" textAlign="center">
                Ứng dụng công nghệ giúp trải nghiệm đấu giá minh bạch và suôn
                sẻ.
              </Text>
            </Box>

            <Box bg={contentBg} borderRadius="md" p={6} boxShadow={cardShadow}>
              <Box
                mx="auto"
                mb={4}
                w="56px"
                h="56px"
                borderRadius="full"
                bg="red.50"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <FiUsers size={24} color="#C53030" />
              </Box>
              <Heading as="h4" size="md" mb={2} textAlign="center">
                Chuyên gia đấu giá
              </Heading>
              <Text color={subText} fontSize="sm" textAlign="center">
                Đội ngũ tư vấn chuyên nghiệp đồng hành cùng bạn trong mọi bước.
              </Text>
            </Box>
          </SimpleGrid>
        </Container>
      </Box>
    </>
  );
};

export default HomePage;
