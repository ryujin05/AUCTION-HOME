import { 
  Box, 
  Flex, 
  VStack, 
  HStack,
  Avatar, 
  Text, 
  Heading, 
  useColorModeValue,
  SimpleGrid,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Icon,
  Divider,
  Badge,
  IconButton,
  Drawer,
  DrawerBody,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useDisclosure
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { FaUser, FaPhone, FaEnvelope, FaBars } from "react-icons/fa";
import { useAuthContext } from "../context/AuthContext";
import { useListStore } from "../store/list";
import ListingCard from "../components/ListingCard";
import AOS from "aos";
import "aos/dist/aos.css";
import { useParams } from "react-router-dom";
import api from "../lib/axios";

const ProfilePage = () => {
  const { userId } = useParams();
  const { currentUser } = useAuthContext();
  const { fetchUserListings } = useListStore();
  const [profileUser, setProfileUser] = useState(null);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const mainBg = useColorModeValue("gray.50", "gray.900");

  useEffect(() => {
    AOS.init({ duration: 800, once: true });
    loadUser();
  }, [userId]);

  const loadUser = async () => {
    if (userId) {
      try {
        const res = await api.get(`/users/${userId}`);
        if (res.data.user) {
          console.log(res.data.user);
          setProfileUser(res.data.user);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    } else {
      setProfileUser(currentUser);
    }
  };

  useEffect(() => {
    if (profileUser) {
      loadListings();
    }
  }, [profileUser]);

    useEffect(() => {
      if (profileUser && profileUser.name) {
        document.title = `${profileUser.name} | Real Estate`;
      }

      // Cleanup: Khi thoát trang chi tiết có thể reset về mặc định
      return () => {
        document.title = "Nền tảng Bất động sản uy tín";
      };
    }, [profileUser]);

  const loadListings = async () => {
    if (!profileUser?._id) return;
    setLoading(true);
    const res = await fetchUserListings(profileUser._id);
    if (res.success) {
      setListings(res.data || []);
    }
    setLoading(false);
  };

  // Filter listings by auction status
  const allListings = listings;
  const availableListings = listings.filter(
    (l) => l.auctionStatus !== "ended"
  );
  const endedListings = listings.filter((l) => l.auctionStatus === "ended");

  const getListingsByTab = (tabIndex) => {
    switch(tabIndex) {
      case 0: return allListings;
      case 1: return availableListings;
      case 2: return endedListings;
      default: return allListings;
    }
  };

  const currentListings = getListingsByTab(activeTab);

  // Sidebar Content Component (reusable for both desktop and mobile)
  const SidebarContent = () => (
    <Box
      position="relative"
      zIndex={1}
      p={6}
      h="full"
      overflowY="auto"
    >
      <VStack 
        spacing={4} 
        align="center"
        py={4}
      >
        <Avatar
          size="xl"
          name={profileUser?.name}
          src={profileUser?.avatar}
          color="white"
          fontSize="3xl"
          border="4px solid"
          borderColor="whiteAlpha.300"
        />
        
        <Heading size="md" color="white" textAlign="center">
          {profileUser?.name || "User"}
        </Heading>
        <Badge colorScheme="blue" fontSize="sm" px={3} py={1}>
          Thành viên
        </Badge>

        <Divider borderColor="whiteAlpha.400" />

        <VStack spacing={3} align="stretch" w="full">
          <HStack>
            <Icon as={FaUser} color="blue.300" boxSize={4} />
            <Text fontWeight="semibold" color="whiteAlpha.700" fontSize="xs">
              TÊN
            </Text>
          </HStack>
          <Text fontWeight="semibold" color="white" fontSize="sm">
            {profileUser?.name || "N/A"}
          </Text>

          <HStack mt={2}>
            <Icon as={FaPhone} color="green.300" boxSize={4} />
            <Text fontWeight="semibold" color="whiteAlpha.700" fontSize="xs">
              SỐ ĐIỆN THOẠI
            </Text>
          </HStack>
          <Text fontWeight="semibold" color="white" fontSize="sm">
            {profileUser?.phone || "N/A"}
          </Text>

          <HStack mt={2}>
            <Icon as={FaEnvelope} color="purple.300" boxSize={4} />
            <Text fontWeight="semibold" color="whiteAlpha.700" fontSize="xs">
              EMAIL
            </Text>
          </HStack>
          <Text 
            fontWeight="semibold" 
            color="white" 
            fontSize="sm"
            wordBreak="break-word"
          >
            {profileUser?.email || "N/A"}
          </Text>
        </VStack>

        <Divider borderColor="whiteAlpha.400" />

        <Box 
          bg="whiteAlpha.200" 
          p={3} 
          rounded="lg" 
          w="full" 
          textAlign="center"
          backdropFilter="blur(10px)"
        >
          <Text fontSize="xs" color="whiteAlpha.800" mb={1}>
            Tổng bài đăng
          </Text>
          <Text fontSize="2xl" fontWeight="bold" color="blue.300">
            {listings.length}
          </Text>
        </Box>
      </VStack>
    </Box>
  );

  // Desktop Sidebar Component
  const Sidebar = () => (
    <Box
      w={{ base: "0", md: "250px", lg: "320px" }}
      display={{ base: "none", md: "block" }}
      bg={bgColor}
      borderRight="1px"
      borderColor={borderColor}
      position="relative"
      overflow="hidden"
      backgroundImage="url('https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800')"
      backgroundSize="cover"
      backgroundPosition="center"
      _before={{
        content: '""',
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        bg: "blackAlpha.700",
        zIndex: 0
      }}
    >
      <SidebarContent />
    </Box>
  );

  // Mobile Sidebar Drawer
  const MobileSidebar = () => (
    <Drawer isOpen={isOpen} placement="left" onClose={onClose} size="xs">
      <DrawerOverlay />
      <DrawerContent
        backgroundImage="url('https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800')"
        backgroundSize="cover"
        backgroundPosition="center"
        position="relative"
        _before={{
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          bg: "blackAlpha.700",
          zIndex: 0
        }}
      >
        <DrawerCloseButton 
          color="white" 
          zIndex={2}
          _hover={{ bg: "whiteAlpha.200" }}
        />
        <DrawerBody p={0}>
          <SidebarContent />
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );

  // Listings View Component
  const ListingsView = () => (
    <Box flex={1} bg={mainBg} p={{ base: 4, md: 8 }} overflowY="auto" position="relative">
      {/* Mobile Menu Button */}
      <IconButton
        icon={<FaBars />}
        display={{ base: "flex", md: "none" }}
        position="fixed"
        top={20}
        left={4}
        zIndex={1000}
        colorScheme="blue"
        size="lg"
        rounded="full"
        shadow="xl"
        onClick={onOpen}
        aria-label="Open menu"
      />

      <Heading size={{ base: "lg", md: "xl" }} mb={6} textAlign="center" mt={{ base: 12, md: 0 }}>
        Bài đăng
      </Heading>

      <Tabs 
        isFitted 
        variant="soft-rounded" 
        colorScheme="blue"
        index={activeTab}
        onChange={setActiveTab}
      >
        <TabList mb={6} bg={bgColor} p={2} rounded="lg" shadow="sm" flexWrap="wrap">
          <Tab>Tất cả</Tab>
          <Tab>Đang đấu giá</Tab>
          <Tab>Đã kết thúc</Tab>
        </TabList>

        <TabPanels>
          <TabPanel p={{ base: 0, md: 4 }}>
            <ListingsGrid listings={currentListings} />
          </TabPanel>
          <TabPanel p={{ base: 0, md: 4 }}>
            <ListingsGrid listings={currentListings} />
          </TabPanel>
          <TabPanel p={{ base: 0, md: 4 }}>
            <ListingsGrid listings={currentListings} />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );

  const ListingsGrid = ({ listings }) => {
    if (listings.length === 0) {
      return (
        <Box textAlign="center" py={10}>
          <Text fontSize="lg" color="gray.500">
            Chưa có bài đăng nào
          </Text>
        </Box>
      );
    }

    return (
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
        {listings.map((listing) => (
          <Box key={listing._id}>
            <ListingCard listing={listing} />
          </Box>
        ))}
      </SimpleGrid>
    );
  };

  return (
    <Flex minH="100vh" bg={mainBg}>
      <Sidebar />
      <MobileSidebar />
      <ListingsView />
    </Flex>
  );
};

export default ProfilePage;
