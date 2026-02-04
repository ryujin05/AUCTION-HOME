import React from "react";
import {
  Box,
  Image,
  Text,
  Flex,
  IconButton,
  Icon,
  Badge,
  HStack,
} from "@chakra-ui/react";
import { CloseIcon } from "@chakra-ui/icons";

// Icon đại diện cho Diện tích (Hình vuông/Thước)
const AreaIcon = (props) => (
  <Icon viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M4 4h16v16H4V4zm2 2v12h12V6H6z" />
  </Icon>
);

// Icon đại diện cho Vị trí (Pin)
const LocationIcon = (props) => (
  <Icon viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
  </Icon>
);

const formatPrice = (price) => {
  if (!price) return "Liên hệ";
  const amount = Number(price);
  if (isNaN(amount)) return price;
  if (amount >= 1000000000) {
    return (amount / 1000000000).toFixed(1).replace(/\.0$/, "") + " tỷ";
  } else if (amount >= 1000000) {
    return (amount / 1000000).toFixed(1).replace(/\.0$/, "") + " triệu";
  } else {
    return amount.toLocaleString("vi-VN") + " đ";
  }
};

const ListingPopup = ({ item, onClose, onNavigate }) => {
  // Fallback an toàn hơn nếu không có image
  const imageUrl =
    item.images?.[0]?.url || "https://via.placeholder.com/150?text=No+Image";
  const priceText = formatPrice(item.price);
  const areaText = item.area ? `${item.area} m²` : null;

  const loc = item.location || {};

  const locationText =
    [loc.detail, loc.ward, loc.province]
      .filter(Boolean) 
      .join(", ") || 
    "Đang cập nhật"; 

  return (
    <Flex
      w="300px" // Giảm width một chút cho gọn trên map
      bg="white"
      borderRadius="lg" // Bo góc chuẩn theme
      overflow="hidden"
      boxShadow="lg"
      border="1px solid"
      borderColor="gray.200"
      position="relative"
      fontFamily="body"
      onClick={() => onNavigate?.(item._id)}
      cursor="pointer"
      role="group"
      transition="all 0.2s ease-in-out"
      _hover={{ transform: "translateY(-2px)", boxShadow: "xl" }} // Hover nhẹ nhàng hơn
    >
      {/* Nút đóng Popup */}
      <IconButton
        aria-label="Close"
        icon={<CloseIcon boxSize={2.5} />} // Chỉnh size icon nhỏ lại
        size="xs" // Kích thước nút nhỏ nhất
        variant="solid"
        colorScheme="gray"
        position="absolute"
        top={2}
        right={2}
        zIndex={10}
        borderRadius="full"
        onClick={(e) => {
          e.stopPropagation(); // Chặn sự kiện click xuyên xuống card (gây navigate)
          onClose?.();
        }}
      />

      <Flex gap={3} align="start" p={3} w="100%">
        {/* Phần Ảnh */}
        <Box
          position="relative"
          w="80px"
          h="80px"
          flexShrink={0}
          borderRadius="md"
          overflow="hidden"
        >
          <Image
            src={imageUrl}
            alt="Listing"
            w="100%"
            h="100%"
            objectFit="cover"
          />

          {/* Badge VIP hiển thị gọn gàng */}
          {(item.isVip || (item.tags || []).includes("vip")) && (
            <Badge
              position="absolute"
              top={1}
              left={1}
              colorScheme="yellow"
              variant="solid"
              fontSize="10px"
              borderRadius="sm"
            >
              VIP
            </Badge>
          )}
        </Box>

        {/* Phần Thông tin */}
        <Box flex={1} minW={0}>
          <Text
            fontWeight="bold"
            fontSize="sm"
            color="gray.700"
            noOfLines={2}
            lineHeight="1.4"
          >
            {item.title || "Bất động sản"}
          </Text>

          <Text fontSize="sm" fontWeight="800" color="red.600" mt={1}>
            {priceText}
          </Text>

          <HStack mt={1} spacing={3} color="gray.500" fontSize="xs">
            {/* Hiển thị Diện tích với đúng Icon */}
            {areaText && (
              <HStack spacing={1}>
                <AreaIcon boxSize={3} />
                <Text>{areaText}</Text>
              </HStack>
            )}
          </HStack>

          {/* Hiển thị Địa chỉ với đúng Icon */}
          <HStack mt={1} spacing={1} color="gray.500" fontSize="xs">
            <LocationIcon boxSize={3} flexShrink={0} />
            <Text noOfLines={1}>{locationText}</Text>
          </HStack>
        </Box>
      </Flex>
    </Flex>
  );
};

export default ListingPopup;
