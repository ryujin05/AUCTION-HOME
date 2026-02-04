import { 
  Box, 
  Image, 
  Text, 
  Badge, 
  IconButton, 
  useToast, 
  useColorModeValue,
  Flex,
  Icon,
  HStack,
  VStack,
  Heading
} from "@chakra-ui/react";
import { ImStarEmpty, ImStarFull } from "react-icons/im";
import { FaBed, FaBath } from "react-icons/fa";
import { BsGridFill } from "react-icons/bs";
import { FiHeart } from "react-icons/fi";

import { useUserStore } from "../store/user.js";
import { useListStore } from "../store/list.js";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePropertyTypeStore } from "../store/propertyType.js";

const HorizontalListingCard = ({ listing }) => {
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
      return (amount / 1000000).toFixed(0) + ' triệu';
    } else {
      return amount.toLocaleString('vi-VN') + ' đ';
    }
  };

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

  return (
    <Flex
      borderWidth="1px" 
      borderRadius="xl" 
      overflow="hidden" 
      bg={useColorModeValue("white", "gray.800")} 
      shadow="md"
      transition="all 0.3s"
      _hover={{
        transform: "translateY(-2px)",
        shadow: "xl",
        cursor: "pointer"
      }}
      onClick={() => navigate(`/listings/${listing._id}`)}
      direction="row"
      h="280px"
    >
      {/* Left Side - Image */}
      <Box position="relative" w="40%" minW="280px">
        {img ? (
          <Image src={img} alt={listing.title} objectFit="cover" w="100%" h="100%"/>
        ) : (
          <Box w="100%" h="100%" bg={useColorModeValue("gray.200", "gray.600")} display="flex" alignItems="center" justifyContent="center">
            <Text color="gray.500">No image</Text>
          </Box>
        )}

        {/* Auction Status Badge */}
        <Box position="absolute" top={4} left={4}>
          <Badge 
            colorScheme="red" 
            fontSize="sm" 
            px={3} 
            py={1.5} 
            borderRadius="md"
            bg="white"
            color="red.600"
            fontWeight="600"
            textTransform="capitalize"
          >
            {listing.auctionStatus === "ended"
              ? "Kết thúc"
              : listing.auctionStatus === "scheduled"
              ? "Đang diễn ra"
              : "Đang đấu giá"}
          </Badge>
        </Box>

        {/* Heart Icon */}
        <IconButton
          aria-label={isSaved ? 'Unsave' : 'Save'}
          icon={<FiHeart fill={isSaved ? "currentColor" : "none"} strokeWidth={2} />}
          position="absolute" 
          top={4} 
          right={4}
          size="md"
          variant="solid"
          color={isSaved ? 'red.500' : 'gray.700'}
          bg="white"
          borderRadius="lg"
          _hover={{ bg: "white", color: "red.500", transform: "scale(1.1)" }}
          onClick={async (e) => {
            e.stopPropagation();
            try {
              const res = toggleSave ? await toggleSave(listing._id) : await fallbackToggle(listing._id);
              toast({ title: res.success ? res.message : 'Error', status: res.success ? 'success' : 'error', isClosable: true, duration: 2000 });
            } catch (err) {
              toast({ title: 'Connection error', status: 'error', isClosable: true });
            }
          }}
        />
      </Box>

      {/* Right Side - Content */}
      <VStack align="stretch" flex={1} p={6} spacing={4} justify="space-between">
        {/* Top Section */}
        <VStack align="stretch" spacing={2}>
          <Heading size="md" noOfLines={1} color={useColorModeValue("gray.800", "white")}>
            {listing.title}
          </Heading>

          <Heading size="xl" color={useColorModeValue("gray.900", "white")} fontWeight="bold">
            {formatPrice(listing.currentPrice ?? listing.startingPrice ?? listing.price)}
          </Heading>

          <Badge 
            colorScheme="red" 
            fontSize="sm" 
            px={3} 
            py={1} 
            borderRadius="md"
            width="fit-content"
            bg="red.50"
            color="red.600"
          >
            {listing.location?.province || 'Unknown Location'}
          </Badge>
        </VStack>

        {/* Bottom Section - Property Details */}
        <HStack spacing={0} pt={2} divider={<Box w="1px" h="40px" bg={useColorModeValue("gray.200", "gray.600")} />}>
          <VStack spacing={1} align="center" flex={1}>
            <HStack spacing={2}>
              <Icon as={FaBed} color={useColorModeValue("gray.400", "gray.500")} boxSize={5} />
              <Text fontWeight="bold" fontSize="xl" color={useColorModeValue("gray.800", "white")}>
                {listing.bedroom || 0}
              </Text>
            </HStack>
            <Text fontSize="xs" color="gray.500" textTransform="uppercase">ngủ</Text>
          </VStack>

          <VStack spacing={1} align="center" flex={1}>
            <HStack spacing={2}>
              <Icon as={FaBath} color={useColorModeValue("gray.400", "gray.500")} boxSize={5} />
              <Text fontWeight="bold" fontSize="xl" color={useColorModeValue("gray.800", "white")}>
                {listing.bathroom || 0}
              </Text>
            </HStack>
            <Text fontSize="xs" color="gray.500" textTransform="uppercase">Tắm</Text>
          </VStack>

          <VStack spacing={1} align="center" flex={1}>
            <HStack spacing={2}>
              <Icon as={BsGridFill} color={useColorModeValue("gray.400", "gray.500")} boxSize={5} />
              <Text fontWeight="bold" fontSize="xl" color={useColorModeValue("gray.800", "white")}>
                {listing.area || 0}
              </Text>
            </HStack>
            <Text fontSize="xs" color="gray.500" textTransform="uppercase">m²</Text>
          </VStack>
        </HStack>
      </VStack>
    </Flex>
  );
};

export default HorizontalListingCard;
