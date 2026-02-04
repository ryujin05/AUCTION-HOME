import { useEffect, useState, useCallback } from "react";
import { Box, useColorModeValue, IconButton, VStack, Badge, Heading, Text, HStack, Center } from "@chakra-ui/react";
import { ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons";

const SlideShow = ({ listings = [] }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  // Define theme-aware colors
  const contentBg = useColorModeValue("white", "gray.800");
  const cardShadow = useColorModeValue("lg", "dark-lg");
  const slideBg = useColorModeValue("gray.300", "gray.600");
  const emptyTitleColor = useColorModeValue("gray.800", "white");
  const emptyTextColor = useColorModeValue("gray.600", "gray.400");
  const headingColor = useColorModeValue("white", "white");
  const locationColor = useColorModeValue("white", "gray.300");

  // Get 4 most recent listings
  const recentListings = listings
    .sort((a, b) => new Date(b.createdAt || b.updatedAt) - new Date(a.createdAt || a.updatedAt))
    .slice(0, 4);

  // Slideshow navigation functions
  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % Math.max(1, recentListings.length));
  }, [recentListings.length]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + Math.max(1, recentListings.length)) % Math.max(1, recentListings.length));
  }, [recentListings.length]);

  // Auto-advance slideshow every 5 seconds
  useEffect(() => {
    if (recentListings.length > 1) {
      const interval = setInterval(nextSlide, 5000);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [recentListings.length, nextSlide]);

  // Reset slide to 0 when listings change
  useEffect(() => {
    setCurrentSlide(0);
  }, [listings]);

  const formatPrice = (price) => {
    return price ? `${Number(price).toLocaleString("vi-VN")} VNĐ` : "Liên hệ";
  };

  const formatLocation = (location) => {
    return location ? `${location.detail || ''}, ${location.ward || ''}, ${location.province || ''}`.replace(/^,\s*/, '') : '';
  };

  if (!recentListings.length) {
    return (
      <Box
        h={{ base: "340px", md: "420px" }}
        bgSize="cover"
        bgPos="center"
        position="relative"
        display="flex"
        alignItems="flex-end"
        justifyContent="center"
        mt={4}
      >
        <Box position="absolute" inset={0} bgGradient="linear(to-b, rgba(2,6,23,0.3), rgba(2,6,23,0.7))" />
        <Box
          w={{ base: "90%", md: "84%" }}
          bg={contentBg}
          p={6}
          borderRadius="32px"
          boxShadow={cardShadow}
          position="relative"
          mb={6}
          zIndex={2}
        >
          <Center>
            <VStack spacing={3}>
              <Heading color={emptyTitleColor} fontSize={{ base: "2xl", md: "4xl" }}>
                Tìm căn hộ đấu giá mơ ước của bạn
              </Heading>
              <Text color={emptyTextColor}>
                Không có phiên đấu giá nào để hiển thị
              </Text>
            </VStack>
          </Center>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      h={{ base: "440px", md: "520px" }}
      bgImage={recentListings[currentSlide]?.images?.[0]?.url || recentListings[currentSlide]?.images?.[0] || 'https://via.placeholder.com/1200x600?text=No+Image'}
      bgSize="cover"
      bgPos="center"
      position="relative"
      display="flex"
      alignItems="flex-end"
      justifyContent="center"
    >
      <Box position="absolute" inset={0} bgGradient="linear(to-b, rgba(2,6,23,0.3), rgba(2,6,23,0.7))" />
      
      {/* Navigation Arrows on sides of outer box */}
      {recentListings.length > 1 && (
        <>
          <IconButton
            aria-label="Previous slide"
            icon={<ChevronLeftIcon />}
            position="absolute"
            left={{ base: 2, md: 4 }}
            top="50%"
            transform="translateY(-50%)"
            size={{ base: "md", md: "lg" }}
            variant="solid"
            bg="rgba(255,255,255,0.9)"
            color="gray.800"
            onClick={prevSlide}
            _hover={{ bg: "white" }}
            zIndex={3}
          />
          <IconButton
            aria-label="Next slide"
            icon={<ChevronRightIcon />}
            position="absolute"
            right={{ base: 2, md: 4 }}
            top="50%"
            transform="translateY(-50%)"
            size={{ base: "md", md: "lg" }}
            variant="solid"
            bg="rgba(255,255,255,0.9)"
            color="gray.800"
            onClick={nextSlide}
            _hover={{ bg: "white" }}
            zIndex={3}
          />
        </>
      )}

      <Box
        w={{ base: "90%", md: "84%" }}
        maxW={"1140px"}
        p={6}
        borderRadius="32px"
        position="relative"
        mb={6}
        zIndex={2}
      >
        <VStack align="start" spacing={3}>
          <HStack>
            <Badge colorScheme="red" fontSize="xs">
              {recentListings[currentSlide]?.property_type?.name || "Căn hộ"}
            </Badge>
            <Badge colorScheme="red" bg="red.600" color="white" fontSize="xs">
              {recentListings[currentSlide]?.auctionStatus === "ended"
                ? "Kết thúc"
                : recentListings[currentSlide]?.auctionStatus === "scheduled"
                ? "Đang diễn ra"
                : "Đang đấu giá"}
            </Badge>
          </HStack>
          <Heading
            size={{ base: "m", md: "lg" }}
            color={headingColor}
            noOfLines={2}
          >
            {recentListings[currentSlide]?.title}
          </Heading>
          <Text
            color="red.500"
            fontWeight="bold"
            fontSize={{ base: "m", md: "lg" }}
          >
            {formatPrice(
              recentListings[currentSlide]?.currentPrice ??
                recentListings[currentSlide]?.startingPrice ??
                recentListings[currentSlide]?.price
            )}
          </Text>
          <Text
            color={locationColor}
            fontSize={{ base: "m", md: "lg" }}
            noOfLines={1}
          >
            {formatLocation(recentListings[currentSlide]?.location)}
          </Text>
          
          {/* Slide Indicators */}
          {recentListings.length > 1 && (
            <HStack spacing={2} pt={2}>
              {recentListings.map((_, index) => (
                <Box
                  key={index}
                  w={3}
                  h={3}
                  borderRadius="full"
                  bg={index === currentSlide ? "red.500" : slideBg}
                  cursor="pointer"
                  onClick={() => setCurrentSlide(index)}
                  transition="all 0.2s"
                  _hover={{ bg: "red.400" }}
                />
              ))}
            </HStack>
          )}
        </VStack>
      </Box>
    </Box>
  );
};

export default SlideShow;