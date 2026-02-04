import { useEffect, useState, useRef } from "react";
import {
  Box,
  Container,
  Heading,
  Text,
  Input,
  Button,
  HStack,
  VStack,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Icon,
  useColorModeValue,
  Image,
  Tab,
  Tabs,
  TabList,
  TabPanel,
  TabPanels,
  Alert,
  AlertIcon,
  Flex,
  Spinner,
  List,
  ListItem,
} from "@chakra-ui/react";
import { FiMapPin, FiStar, FiSearch, FiX } from "react-icons/fi";
import { useListStore } from "../store/list.js";
import { useNavigate, Link } from "react-router-dom";
import api from "../lib/axios.js";

const HomePanel = () => {
  const { listings, fetchListings } = useListStore();
  const navigate = useNavigate();

  // --- 1. CONSTANTS FOR THEME (Đã chuyển lên đầu như bạn muốn) ---
  const bgGradient = useColorModeValue(
    "linear(to-t, red.100 0%, white 100%)",
    "linear(to-t, red.900 0%, gray.800 100%)"
  );
  const tabActiveBg = useColorModeValue("white", "gray.900");
  const tabInactiveBg = useColorModeValue("red.100", "red.900");
  const tabPanelsBg = useColorModeValue("white", "gray.900");
  const inputBorderColor = useColorModeValue("red.100", "red.700");
  const inputPlaceholderColor = useColorModeValue("gray.400", "gray.600");
  const tabPanelsBorderColor = useColorModeValue("gray.100", "red.700");
  const headingColor = useColorModeValue(
    "rgba(1, 2, 24, 0.8)",
    "rgba(255, 255, 255, 0.8)"
  );
  const subTextColor = useColorModeValue(
    "rgba(1, 2, 24, 0.8)",
    "whiteAlpha.800"
  );
  const tabInactiveTextColor = useColorModeValue("red.600", "whiteAlpha.800");
  const ratingTextColor = useColorModeValue("gray.700", "gray.300");
  const ratingScoreColor = useColorModeValue("gray.800", "white");
  const tabHoverBg = useColorModeValue("red.50", "whiteAlpha.200");
  const tabHoverTextColor = useColorModeValue("red.800", "white");

  // Màu riêng cho Dropdown gợi ý
  const dropdownBg = useColorModeValue("white", "gray.800");
  const dropdownHoverBg = useColorModeValue("gray.50", "gray.700");
  const dropdownBorderColor = useColorModeValue("gray.200", "gray.600");
  const AllListBgColor = useColorModeValue("red.50", "red.900");
  const AllListHoverColor = useColorModeValue("red.100", "red.800");

  //Footer
  const footerBgColor = useColorModeValue("gray.50", "gray.900");
  const footerHoverColor = useColorModeValue("red.50", "red.900");

  // --- 2. STATE MANAGEMENT ---
  const [activeTab, setActiveTab] = useState(0); // 0: Live, 1: Scheduled
  const [keyword, setKeyword] = useState(""); // Từ khóa người dùng nhập
  const [suggestions, setSuggestions] = useState([]); // Danh sách gợi ý từ API (AJAX)
  const [isSearching, setIsSearching] = useState(false); // Trạng thái loading của AJAX
  const [showDropdown, setShowDropdown] = useState(false); // Kiểm soát hiển thị Dropdown
  const [error, setError] = useState("");

  const searchTimeoutRef = useRef(null); // Ref để debounce (tránh gọi API liên tục)

  useEffect(() => {
    if (import.meta.env.VITE_SKIP_API === "true") return;
    // fetchListings(); // Tùy chọn: Load danh sách gốc nếu cần thiết
  }, [fetchListings]);

  // --- 3. LOGIC AJAX LIVE SEARCH (ĐIỀU KIỆN 1) ---
  useEffect(() => {
    // Nếu xóa hết chữ -> Ẩn dropdown
    if (!keyword.trim()) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    // Debounce: Clear timeout cũ nếu user vẫn đang gõ
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    setIsSearching(true);

    // Tạo timeout mới: Chờ 400ms sau khi ngừng gõ mới gọi API
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const type = activeTab === 0 ? "live" : "scheduled";
        // Gọi API tìm kiếm với limit nhỏ (5 item) để gợi ý nhanh
        const res = await api.get(
          `/listings/search?keyword=${keyword}&auctionStatus=${type}&limit=5`
        );
        console.log("Check API Response:", res); // Xem nó trả về gì
        if (res.data && res.data.data) {
          setSuggestions(res.data.data);
          setShowDropdown(true); // Có dữ liệu mới hiện dropdown
        }
      } catch (err) {
        console.error("Live search error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(searchTimeoutRef.current);
  }, [keyword, activeTab]);

  // --- 4. LOGIC CHUYỂN TRANG TÌM KIẾM (ĐIỀU KIỆN 2) ---
  // Hàm này giữ nguyên logic điều hướng cũ của bạn
  const handleNavigationSearch = (isAdvanced = false) => {
    if (!isAdvanced && keyword.trim() === "") {
      setError("Vui lòng nhập từ khóa hoặc địa điểm");
      return;
    }
    setError("");

    const backendAuctionStatus = activeTab === 0 ? "live" : "scheduled";
    const params = new URLSearchParams();

    if (keyword.trim()) params.set("keyword", keyword);
    params.set("auctionStatus", backendAuctionStatus);

    // Ẩn dropdown ngay lập tức để tránh che màn hình khi chuyển trang
    setShowDropdown(false);

    // Điều hướng sang trang Listings như bình thường
    navigate(`/listings?${params.toString()}`);
  };

  // Xử lý khi nhấn phím Enter trong ô Input
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleNavigationSearch(false); // Gọi hàm tìm kiếm thường
    }
  };

  const renderSearchPanel = () => (
    <VStack spacing={6}>
      <Box position="relative" w="full" zIndex={10}>
        <InputGroup size="lg">
          <InputLeftElement pointerEvents="none">
            <Icon as={FiSearch} color="gray.400" />
          </InputLeftElement>

          <Input
            placeholder="Tìm kiếm dự án, đường, quận huyện..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={handleKeyDown} // Bắt sự kiện Enter ở đây
            onFocus={() => {
              if (suggestions.length > 0) setShowDropdown(true);
            }}
            // Delay ẩn dropdown để kịp nhận click vào item
            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
            borderRadius="lg"
            bg={dropdownBg}
            border="2px solid"
            borderColor={inputBorderColor}
            _placeholder={{ color: inputPlaceholderColor }}
          />

          {/* Spinner loading hoặc nút X xóa text */}
          <InputRightElement>
            {isSearching ? (
              <Spinner size="sm" color="red.500" />
            ) : keyword ? (
              <Icon
                as={FiX}
                cursor="pointer"
                onClick={() => setKeyword("")}
                color="gray.400"
              />
            ) : null}
          </InputRightElement>
        </InputGroup>

        {/* --- DROPDOWN GỢI Ý (AJAX RESULTS) --- */}
        {showDropdown && suggestions.length > 0 && (
          <Box
            position="absolute"
            top="100%"
            mt={2}
            left={0}
            right={0}
            bg={dropdownBg}
            borderRadius="md"
            boxShadow="2xl"
            border="1px solid"
            borderColor={dropdownBorderColor}
            zIndex={1000}
            overflow="hidden"
          >
            {/* 1. Vùng Danh Sách (Có thanh cuộn riêng) */}
            <Box maxH="270px" overflowY="auto">
              <List spacing={0}>
                {suggestions.map((item) => (
                  <ListItem key={item._id}>
                    <Link
                      to={`/listings/${item._id}`}
                      style={{ display: "block" }}
                    >
                      <HStack
                        p={3}
                        _hover={{ bg: dropdownHoverBg }}
                        transition="all 0.2s"
                        borderBottom="1px solid"
                        borderBottomColor={dropdownBorderColor}
                        align="start"
                      >
                        <Image
                          src={
                            item.images?.[0] ||
                            "https://placehold.co/100"
                          }
                          boxSize="48px"
                          objectFit="cover"
                          borderRadius="md"
                          fallbackSrc="https://placehold.co/100"
                        />
                        <VStack align="start" spacing={0} flex={1}>
                          <Text
                            fontWeight="bold"
                            fontSize="sm"
                            noOfLines={1}
                            color={headingColor}
                          >
                            {item.title}
                          </Text>
                          <Text fontSize="xs" color="gray.500" noOfLines={1}>
                            <Icon as={FiMapPin} mr={1} />
                            {item.location?.detail}, {item.location?.province}
                          </Text>
                          <Text fontSize="xs" fontWeight="bold" color="red.500">
                            {item.price?.toLocaleString()} VNĐ
                          </Text>
                        </VStack>
                      </HStack>
                    </Link>
                  </ListItem>
                ))}
              </List>
            </Box>

            {/* 2. Vùng Footer "Xem tất cả" (Luôn hiển thị ở đáy, không bị cuộn che mất) */}
            <Box
              p={3}
              textAlign="center"
              bg={footerBgColor} // Màu nền khác biệt chút để nổi bật
              cursor="pointer"
              borderTop="1px solid"
              borderColor={dropdownBorderColor}
              onClick={() => handleNavigationSearch(false)}
              _hover={{
                bg: footerHoverColor,
                color: "blue.500",
              }}
              transition="all 0.2s"
            >
              <Text fontSize="sm" fontWeight="bold" color="blue.500">
                Xem tất cả kết quả cho "{keyword}"
              </Text>
            </Box>
          </Box>
        )}
      </Box>

      {/* Buttons */}
      <HStack spacing={4} w="full">
        <Button
          flex={1}
          size="lg"
          colorScheme="blue"
          // Click nút này -> Chạy logic Điều kiện 2
          onClick={() => handleNavigationSearch(false)}
          transition="all 0.2s"
        >
          Tìm kiếm
        </Button>
        <Button
          flex={1}
          size="lg"
          variant="outline"
          colorScheme="blue"
          // Click nút này -> Chạy logic Điều kiện 2 (mode nâng cao)
          onClick={() => handleNavigationSearch(true)}
          transition="all 0.2s"
        >
          Tìm kiếm nâng cao
        </Button>
      </HStack>

      {error && (
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          {error}
        </Alert>
      )}
    </VStack>
  );

  return (
    <Box
      position="relative"
      minH={`calc(100vh - 64px)`}
      pt={"60px"}
      pb={"60px"}
      overflow="hidden"
      bgGradient={bgGradient}
    >
      {/* Background Image */}
      <Box
        position="absolute"
        bottom={0}
        left={600}
        w={{ base: "90%", md: "70%", lg: "65%" }}
        h={{ base: "90%", md: "85%", lg: "95%" }}
        zIndex={1}
      >
        <Image
          src="hero-image.png"
          alt="Real Estate Background"
          w="100%"
          h="100%"
          objectFit="contain"
          objectPosition="bottom right"
        />
      </Box>

      <Container maxW="1100px" position="absolute" zIndex={2}>
        <Flex
          direction={{ base: "column", lg: "row" }}
          align="start"
          minH="60vh"
        >
          {/* Content */}
          <VStack
            align={{ base: "center", lg: "start" }}
            spacing={8}
            flex={1}
            textAlign={{ base: "center", lg: "left" }}
            maxW={{ base: "100%", lg: "700px" }}
            mx="auto"
          >
            <VStack align="start" spacing={4}>
              <Heading
                fontSize={{ base: "3xl", md: "4xl", lg: "5xl" }}
                lineHeight={1.2}
                color={headingColor}
                fontWeight="bold"
                maxW="600px"
              >
                Khám phá phiên đấu giá căn hộ phù hợp nhất với bạn
              </Heading>
              <Text
                fontSize={{ base: "md", md: "lg" }}
                color={subTextColor}
                maxW="500px"
              >
                Tham gia đấu giá minh bạch, cập nhật giá theo thời gian thực và chốt căn hộ nhanh chóng.
              </Text>
            </VStack>

            {/* Search Form with Tabs */}
            <Box maxW="600px" w="full">
              <Tabs
                index={activeTab}
                onChange={setActiveTab}
                variant={"line"}
                colorScheme="red"
              >
                <TabList
                  mb={0}
                  borderRadius="lg"
                  p={1}
                  justifyContent="flex-start"
                >
                  <Tab
                    px={6}
                    py={3}
                    ml={-1}
                    borderTopRadius="xl"
                    fontSize="lg"
                    fontWeight="semibold"
                    _hover={{
                      bg: activeTab === 0 ? tabActiveBg : tabHoverBg,
                      color: activeTab === 0 ? "red.600" : tabHoverTextColor,
                    }}
                    bg={activeTab === 0 ? tabActiveBg : tabInactiveBg}
                    color={activeTab === 0 ? "red.600" : tabInactiveTextColor}
                    transition="all 0.2s"
                  >
                    Đang đấu giá
                  </Tab>
                  <Tab
                    px={6}
                    py={3}
                    fontSize="lg"
                    fontWeight="semibold"
                    borderTopRadius="xl"
                    bg={activeTab === 1 ? tabActiveBg : tabInactiveBg}
                    color={activeTab === 1 ? "red.600" : tabInactiveTextColor}
                    _hover={{
                      bg: activeTab === 1 ? tabActiveBg : tabHoverBg,
                      color: activeTab === 1 ? "red.600" : tabHoverTextColor,
                    }}
                    transition="all 0.2s"
                  >
                    Đang diễn ra
                  </Tab>
                </TabList>

                <TabPanels
                  bg={tabPanelsBg}
                  borderBottomRadius="xl"
                  borderTopRightRadius="xl"
                  mt={-1}
                  shadow="2xl"
                >
                  <TabPanel p={8}>{renderSearchPanel()}</TabPanel>
                  <TabPanel p={8}>{renderSearchPanel()}</TabPanel>
                </TabPanels>
              </Tabs>
            </Box>
          </VStack>
        </Flex>
      </Container>
    </Box>
  );
};

export default HomePanel;
