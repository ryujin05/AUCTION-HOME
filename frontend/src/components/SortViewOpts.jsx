import {
  useColorModeValue,
  IconButton,
  HStack,
  Select,
  Flex,
  Text,
} from "@chakra-ui/react";
import { FiGrid, FiList } from "react-icons/fi";

const SortViewOpts = ({
  listings = [],
  sortBy,
  setSortBy,
  auctionStatus,
  setAuctionStatus,
  viewType,
  setViewType,
  countText = "phiên đấu giá",
}) => {
  // Define theme-aware colors
  const contentBg = useColorModeValue("white", "gray.800");
  const textColor = useColorModeValue("gray.600", "gray.300");
  const borderColor = useColorModeValue("gray.300", "gray.600");

  return (
    <Flex
      justify="space-between"
      align="center"
      mb={8}
      flexDirection={{ base: "column", md: "row" }}
      gap={4}
      p={3}
      bg={contentBg}
      borderRadius="lg"
      shadow="sm"
    >
      {/* Properties count on the left */}
      <Text
        color={textColor}
        fontSize={{ base: "lg", md: "xl" }}
        fontWeight="bold"
        whiteSpace="nowrap"
      >
        {listings.length || 0} {countText}
      </Text>

      {/* Options on the right */}
      <HStack
        align="center"
        gap={{ base: 2, md: 4 }}
        flexWrap={{ base: "wrap", lg: "nowrap" }}
        justify={{ base: "flex-start", lg: "flex-end" }}
        w={{ base: "100%", lg: "auto" }}
      >
        {/* --- 1. OPTION NHU CẦU (MỚI) --- */}
        <HStack spacing={2}>
          <Text
            color={textColor}
            fontSize="md"
            fontWeight="medium"
            whiteSpace="nowrap"
          >
            Trạng thái
          </Text>
          <Select
            value={auctionStatus}
            onChange={(e) => setAuctionStatus(e.target.value)}
            size="md"
            w="110px"
            minW="130px"
            bg={contentBg}
            border="1px solid"
            borderColor={borderColor}
            borderRadius="md"
            fontSize="md"
            _focus={{ borderColor: "red.500" }}
            cursor={"pointer"}
          >
            <option value="">Tất cả</option>
            <option value="live">Đang đấu giá</option>
            <option value="scheduled">Đang diễn ra</option>
            <option value="ended">Kết thúc</option>
          </Select>
        </HStack>

        {/* --- 2. OPTION SẮP XẾP (ĐÃ SỬA VALUE CHUẨN) --- */}
        <HStack spacing={3}>
          <Text
            color={textColor}
            fontSize="md"
            fontWeight="medium"
            whiteSpace="nowrap"
          >
            Sắp xếp
          </Text>
          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            size="md"
            w="auto"
            minW="180px"
            bg={contentBg}
            border="1px solid"
            borderColor={borderColor}
            borderRadius="md"
            fontSize="md"
            cursor={"pointer"}
          >
            {/* Value dùng dấu gạch dưới (_) để khớp Backend */}
            <option value="">Không</option>
            <option value="newest">Mới nhất</option>
            <option value="oldest">Cũ nhất</option>
            <option value="price_asc">Giá thấp đến cao</option>
            <option value="price_desc">Giá cao đến thấp</option>
            <option value="area_asc">Diện tích nhỏ đến lớn</option>
            <option value="area_desc">Diện tích lớn đến nhỏ</option>
          </Select>
        </HStack>

        {/* --- 3. VIEW MODE --- */}
        <HStack spacing={2}>
          <IconButton
            icon={<FiList size={20} />}
            size="md"
            variant={viewType === "list" ? "solid" : "outline"}
            colorScheme={viewType === "list" ? "red" : "gray"}
            onClick={() => setViewType("list")}
            aria-label="List view"
          />
          <IconButton
            icon={<FiGrid size={20} />}
            size="md"
            variant={viewType === "grid" ? "solid" : "outline"}
            colorScheme={viewType === "grid" ? "red" : "gray"}
            onClick={() => setViewType("grid")}
            aria-label="Grid view"
          />
        </HStack>
      </HStack>
    </Flex>
  );
};

// Utility function to sort listings (Đã cập nhật case khớp với value ở trên)
export const sortListings = (listings, sortBy) => {
  if (!sortBy) return listings;
  return [...listings].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return (
          new Date(b.createdAt || b.updatedAt) -
          new Date(a.createdAt || a.updatedAt)
        );
      case "oldest":
        return (
          new Date(a.createdAt || a.updatedAt) -
          new Date(b.createdAt || b.updatedAt)
        );

      // Sửa case khớp với value select
      case "price_asc":
        return ((a.currentPrice ?? a.price) || 0) - ((b.currentPrice ?? b.price) || 0);
      case "price_desc":
        return ((b.currentPrice ?? b.price) || 0) - ((a.currentPrice ?? a.price) || 0);

      // Sửa case khớp với value select
      case "area_asc":
        return (a.area || 0) - (b.area || 0);
      case "area_desc":
        return (b.area || 0) - (a.area || 0);

      default:
        return 0;
    }
  });
};

// Utility function to filter listings
export const filterListings = (listings, searchQuery) => {
  if (!searchQuery.trim()) return listings;

  const query = searchQuery.toLowerCase().trim();
  return listings.filter((listing) => {
    const title = listing.title?.toLowerCase() || "";
    const location = listing.location
      ? `${listing.location.detail || ""} ${listing.location.ward || ""} ${
          listing.location.province || ""
        }`.toLowerCase()
      : "";

    return title.includes(query) || location.includes(query);
  });
};

export default SortViewOpts;
