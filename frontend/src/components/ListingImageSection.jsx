import {
  Box,
  Image,
  VStack,
  HStack,
  Text,
  Heading,
  Button,
  Avatar,
  SimpleGrid,
  AspectRatio,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import { useState } from "react";
import { FiPhone, FiMail } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import api from "../lib/axios.js";
import { useChatStore } from "../store/chat.js";

const getUserDisplayName = (user) => {
  if (!user) return "Người dùng";
  if (user.name) return user.name;
};

const ListingImageSection = ({ user, listing }) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isContacting, setIsContacting] = useState(false);

  const navigate = useNavigate();
  const toast = useToast();

  const { createOrFindConversation } = useChatStore();

  const contentBg = useColorModeValue("white", "gray.800");
  const subTextColor = useColorModeValue("gray.600", "white");

  const handleContact = async () => {
    if (!listing.owner?._id) {
      return toast({
        title: "Lỗi",
        description: "Không tìm thấy thông tin người bán.",
        status: "error",
        duration: 3000,
      });
    }

    if (listing.owner._id === user.id) {
      toast({
        title: "Thông báo",
        description: "Bạn không thể nhắn tin với chính mình",
        status: "info",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsContacting(true);
    console.log(listing.owner?._id);
    try {
      const result = await createOrFindConversation(listing.owner?._id);

      console.log(listing.owner?._id);

      if (result.success) {
        // 4. Nếu thành công, chuyển hướng đến trang chat với ID nhận được
        navigate(`/chat`);
      } else {
        toast({
          title: "Thông báo",
          description: result.message,
          status: "info",
          duration: 3000,
        });
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Có lỗi xảy ra khi kết nối tin nhắn.",
        status: "error",
      });
    } finally {
      setIsContacting(false);
    }
  };

const handleCall = async () => {
  // 1. Kiểm tra owner
  if (!listing.owner?._id) {
    return toast({
      title: "Lỗi",
      description: "Không tìm thấy thông tin người bán.",
      status: "error",
      duration: 3000,
      isClosable: true,
    });
  }

  if (listing.owner?.phone) {
    toast({
      title: "Số điện thoại người bán",
      description: listing.owner.phone,
      status: "info",
      duration: 6000,
      isClosable: true,
      position: "top",
    });
  } else {
    toast({
      title: "Thông báo",
      description: "Người bán chưa cập nhật số điện thoại.",
      status: "warning",
      duration: 3000,
      isClosable: true,
    });
  }
};

  const images =
    listing.images && listing.images.length > 0
      ? listing.images.map((img) => (typeof img === "string" ? img : img.url))
      : ["https://placehold.co/600x400?text=No+Image"];

  const mainImage = images[selectedImageIndex];

  return (
    <VStack spacing={6} align="stretch">
      {/* Main Image */}
      <Box>
        <AspectRatio ratio={16 / 10}>
          <Image
            src={mainImage}
            alt={listing.title}
            borderRadius="lg"
            objectFit="cover"
            fallback={<Box bg="gray.100" borderRadius="lg" />}
          />
        </AspectRatio>

        {/* Thumbnail Images */}
        {images.length > 1 && (
          <SimpleGrid columns={5} spacing={2} mt={3}>
            {images.map((img, index) => (
              <AspectRatio key={index} ratio={1}>
                <Image
                  src={img}
                  alt={`${listing.title} ${index + 1}`}
                  borderRadius="md"
                  objectFit="cover"
                  cursor="pointer"
                  border={
                    selectedImageIndex === index ? "2px solid" : "1px solid"
                  }
                  borderColor={
                    selectedImageIndex === index ? "blue.500" : "gray.200"
                  }
                  _hover={{ borderColor: "blue.300" }}
                  onClick={() => setSelectedImageIndex(index)}
                  fallback={<Box bg="gray.100" borderRadius="md" />}
                />
              </AspectRatio>
            ))}
          </SimpleGrid>
        )}
      </Box>

      {/* Seller Information */}
      <Box bg={contentBg} p={6} borderRadius="lg" borderWidth="2px" shadow="sm">
        <Heading size="md" mb={4}>
          Thông tin người đăng
        </Heading>
        <HStack spacing={4}>
          <Avatar 
            size="lg" 
            name={getUserDisplayName(listing.owner)} 
            src={listing.owner?.avatar} 
            cursor={"pointer"} 
            onClick={() => navigate(`/profile/${listing.owner?._id}`)}
          />
          <VStack align="start" spacing={1} flex={1}>
            <Text 
              fontWeight="600" 
              fontSize="lg"
              cursor={"pointer"} 
              onClick={() => navigate(`/profile/${listing.owner?._id}`)}
            >
              {getUserDisplayName(listing.owner)}
            </Text>
            <Text color={subTextColor} fontSize="sm">
              Thành viên từ{" "}
              {new Date(
                listing.owner?.createdAt || listing.createdAt
              ).getFullYear()}
            </Text>
            <HStack spacing={4} mt={2}>
              <Button leftIcon={<FiPhone />} size="sm" variant="outline" onClick={handleCall}>
                Gọi điện
              </Button>
              <Button
                leftIcon={<FiMail />}
                size="sm"
                colorScheme="blue"
                onClick={handleContact}
                isLoading={isContacting}
                loadingText="Đang tạo..."
              >
                Nhắn tin
              </Button>
            </HStack>
          </VStack>
        </HStack>
      </Box>
    </VStack>
  );
};

export default ListingImageSection;
