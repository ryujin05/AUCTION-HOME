import { 
  Box, 
  Image, 
  Text, 
  Badge, 
  Stack, 
  IconButton, 
  useToast, 
  useColorModeValue,
  Flex,
  Icon,
  HStack,
  Divider,
  Tooltip
} from "@chakra-ui/react";
import { MdPhotoLibrary } from 'react-icons/md';
import { ImStarEmpty, ImStarFull } from "react-icons/im";
import { FaBed, FaBath, FaHeart } from "react-icons/fa";
import { BsGridFill, BsHeart } from "react-icons/bs";

import { useUserStore } from "../store/user.js";
import { useListStore } from "../store/list.js";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePropertyTypeStore } from "../store/propertyType.js";
import { FiHeart } from "react-icons/fi";

const ListingCard = ({ listing }) => {
  const navigate = useNavigate();
  const [propertyTypeName, setPropertyTypeName] = useState('');
  const getPropertyTypeById = usePropertyTypeStore((s) => s.getPropertyTypeById);
  
  const img = listing.images && listing.images.length
    ? typeof listing.images[0] === "string"
      ? listing.images[0]
      : listing.images[0].url
    : null;

  const location = listing.location 
    ? `${listing.location.detail || ''}, ${listing.location.ward || ''}, ${listing.location.province || ''}` 
    : '';
    
  const imgCount = listing.images ? listing.images.length : 0;
  const toast = useToast();

  const savedIds = useUserStore((s) => s.savedListings || []);
  const toggleSave = useUserStore((s) => s.toggleSaveListing);
  const fallbackToggle = useListStore((s) => s.toggleSaveListing);
  const isSaved = savedIds.includes(listing._id);

  const formatPrice = (price) => {
    if (!price) return "Liên hệ";
    const amount = Number(price);
    if (isNaN(amount)) return price;
    if (amount >= 1000000000) {
      return (amount / 1000000000).toFixed(1).replace(/\.0$/, '') + ' tỷ';
    } else if (amount >= 1000000) {
      return (amount / 1000000).toFixed(1).replace(/\.0$/, '') + ' triệu';
    } else {
      return amount.toLocaleString('vi-VN') + ' đ';
    }
  };

  const formatRelativeTime = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d)) return "";
    const diffMs = Date.now() - d.getTime();
    const sec = Math.floor(diffMs / 1000);
    if (sec < 60) return "Vài giây trước";
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min} phút trước`;
    const hour = Math.floor(min / 60);
    if (hour < 24) return "Trong hôm nay";
    const day = Math.floor(hour / 24);
    if (day === 1) return "1 ngày trước";
    if (day < 7) return `${day} ngày trước`;
    const week = Math.floor(day / 7);
    if (week < 5) return `${week} tuần trước`;
    const month = Math.floor(day / 30);
    if (month < 12) return `${month} tháng trước`;
    const year = Math.floor(day / 365);
    return `${year} năm trước`;
  };
  
  const lastUpdatedText = formatRelativeTime(listing.updatedAt || listing.createdAt);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!listing?.property_type) {
        if (mounted) setPropertyTypeName("unknown");
        return;
      }
      if (typeof listing.property_type === "object" && listing.property_type?.name) {
        if (mounted) setPropertyTypeName(listing.property_type.name);
        return;
      }
      const id = typeof listing.property_type === "object" ? (listing.property_type._id || listing.property_type) : listing.property_type;

      try {
        const res = await getPropertyTypeById(id);
        if (!mounted) return;
        if (res.success) {
          const data = res.data?.propertyType || res.data;
          setPropertyTypeName(data?.name || "unknown");
        } else {
          setPropertyTypeName("unknown");
        }
      } catch {
        if (mounted) setPropertyTypeName("unknown");
      }
    };
    load();
    return () => { mounted = false; };
  }, [listing.property_type, getPropertyTypeById]);

  const currentUser = useUserStore((s) => s.user);
  const ownerId = listing.owner?._id || listing.owner;

  const mapStatusLabel = (s) => {
    if (s === 'approved') return { text: 'Đã duyệt', color: 'green' };
    if (s === 'pending') return { text: 'Chờ duyệt', color: 'black' };
    if (s === 'rejected') return { text: 'Bị từ chối', color: 'red' };
    return { text: s, color: 'gray' };
  };

  return (
    <Box 
      borderWidth="1px" 
      borderRadius="lg" 
      overflow="hidden" 
      bg={useColorModeValue("white", "gray.800")} 
      shadow="sm"
      transition="all 0.3s"
      _hover={{
        transform: "translateY(-5px)",
        shadow: "lg",
        borderColor: "red.300",
        cursor: "pointer"
      }}
      onClick={() => navigate(`/listings/${listing._id}`)}
    >
      {/* --- ẢNH --- */}
      <Box position="relative">
        {img ? (
          <Image src={img} alt={listing.title} objectFit="cover" w="100%" h="200px"/>
        ) : (
          <Box w="100%" h="200px" bg={useColorModeValue("gray.200", "gray.600")} display="flex" alignItems="center" justifyContent="center">
            <Text color="gray.500">No image</Text>
          </Box>
        )}

        {lastUpdatedText && (
          <Box position="absolute" bottom={2} left={2} bg="rgba(0,0,0,0.6)" color="white" px={2} py={1} borderRadius="md" fontSize="xs">
            {lastUpdatedText}
          </Box>
        )}

        {/* Status badge visible only to owner
        {currentUser && ownerId && currentUser._id === ownerId.toString() && (
          <Box position="absolute" top={2} left={2} bg="rgba(255,255,255,0.9)" px={2} py={1} borderRadius="md" fontSize="xs">
            <Box as="span" color={mapStatusLabel(listing.status).color} fontWeight="bold">{mapStatusLabel(listing.status).text}</Box>
          </Box>
        )} */}

        {imgCount > 0 && (
          <Box position="absolute" bottom={2} right={2} bg="rgba(0,0,0,0.6)" color="white" px={2} py={1} borderRadius="md" fontSize="xs" display="flex" alignItems="center" gap={1}>
            <MdPhotoLibrary size="14px" />
            <Text>{imgCount}</Text>
          </Box>
        )}

        <IconButton
          aria-label={isSaved ? 'Bỏ lưu' : 'Lưu'}
          icon={isSaved ? <FaHeart /> : <FiHeart />}
          position="absolute" top={2} right={2}
          size="sm"
          variant="solid"
          color={isSaved ? 'red.400' : 'gray.600'}
          bg="white"
          _hover={{ bg: "gray.100", color: "red.500", transform: "scale(1.1)" }}
          onClick={async (e) => {
            e.stopPropagation();
            try {
              const res = toggleSave ? await toggleSave(listing._id) : await fallbackToggle(listing._id);
              toast({ title: res.success ? res.message : 'Lỗi', status: res.success ? 'success' : 'error', isClosable: true, duration: 2000 });
            } catch (err) {
              toast({ title: 'Lỗi kết nối', status: 'error', isClosable: true });
            }
          }}
        />
      </Box>

      {/* --- NỘI DUNG --- */}
      <Box p={4}>
        <Stack spacing={1} mb={3}>
          <Badge colorScheme="red" width="fit-content" fontSize="0.7em" borderRadius="sm">
            {propertyTypeName}
          </Badge>

          {/* TITLE TOOLTIP */}
          <Tooltip label={listing.title} hasArrow placement="top-start">
            <Text fontWeight="bold" fontSize="md" noOfLines={1} lineHeight="1.4">
              {listing.title}
            </Text>
          </Tooltip>

          <Text color="red.600" fontWeight="extrabold" fontSize="lg">
            {formatPrice(listing.currentPrice ?? listing.startingPrice ?? listing.price)}
          </Text>

          {/* ADDRESS TOOLTIP */}
          <Tooltip label={location} hasArrow placement="top">
            <Text color="gray.500" fontSize="sm" noOfLines={1} cursor="default">
              {location}
            </Text>
          </Tooltip>
        </Stack>

        <Divider my={3} borderColor="gray.200" />
        
        <Flex justifyContent="space-between" alignItems="center" textAlign="center">
          <Flex direction="column" align="center" width="33%">
            <HStack spacing={1}>
                <Icon as={FaBed} color="gray.400" />
                <Text fontWeight="bold" fontSize="md" color="gray.700">
                  {listing.bedroom || 0}
                </Text>
            </HStack>
            <Text fontSize="10px" color="gray.500" textTransform="uppercase" mt="-2px">Ngủ</Text>
          </Flex>

          <Box w="1px" h="24px" bg="gray.200" />

          <Flex direction="column" align="center" width="33%">
             <HStack spacing={1}>
                <Icon as={FaBath} color="gray.400" />
                <Text fontWeight="bold" fontSize="md" color="gray.700">
                  {listing.bathroom || 0}
                </Text>
            </HStack>
            <Text fontSize="10px" color="gray.500" textTransform="uppercase" mt="-2px">Tắm</Text>
          </Flex>

          <Box w="1px" h="24px" bg="gray.200" />

          <Flex direction="column" align="center" width="33%">
             <HStack spacing={1}>
                <Icon as={BsGridFill} color="gray.400" />
                <Text fontWeight="bold" fontSize="md" color="gray.700">
                  {listing.area || 0}
                </Text>
            </HStack>
            <Text fontSize="10px" color="gray.500" textTransform="uppercase" mt="-2px">m²</Text>
          </Flex>
        </Flex>
      </Box>
    </Box>
  );
};

export default ListingCard;