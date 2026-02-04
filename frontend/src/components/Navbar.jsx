import {
  Button,
  Container,
  Flex,
  HStack,
  Text,
  IconButton,
  useDisclosure,
  useColorModeValue,
  Box,
  useColorMode,
  Image
} from "@chakra-ui/react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { HamburgerIcon } from "@chakra-ui/icons";
import DrawerMenu from "./DrawerMenu";
import AuthModal from "./AuthModal";
import CreateListingModal from "./CreateListingModal";
import { useUserStore } from "../store/user.js";
import UserMenu from "./UserMenu";
import { MdDarkMode, MdLightMode } from "react-icons/md";
import { IoSunny, IoMoon, IoChatbubble, IoNotifications, IoHeart } from "react-icons/io5";
import NotificationBell from "./NotificationBell.jsx";

const Navbar = () => {
  const linkColor = useColorModeValue("gray.700", "gray.100");
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { colorMode, toggleColorMode } = useColorMode();
  const [authMode, setAuthMode] = useState(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  
  const openAuth = (mode) => {
    setAuthMode(mode);
    setIsAuthOpen(true);
  };

  const { user, logoutUser, checkAuth } = useUserStore();

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <Box bg={useColorModeValue("white", "gray.800")} boxShadow="sm" position="sticky" top={0} zIndex={100}>
      <Container maxW="none" px={4}>
        <Flex h={16} align="center" justify="space-between">
          {/* Left: Logo */}
          <Link to="/">
            <HStack>
              <Image src="logo.png" alt="Logo" h="40px" />
              <Text
                fontSize="24px"
                fontWeight="bold"
                textTransform="uppercase"
                bgGradient="linear(to-r, red.400, red.600)"
                bgClip="text"
                display={{ base: "none", md: "flex" }}
              >
                Auction Home
              </Text>
            </HStack>
          </Link>

          {/* Middle: Nav Links */}
          <HStack spacing={8} display={{ base: "none", lg: "flex" }}>
            <Link to="/listings">
              <Text color={linkColor} _hover={{ color: "red.500" }} fontWeight="semibold">
                Tìm kiếm
              </Text>
            </Link>
            <Link to="/listings?auctionStatus=live">
              <Text color={linkColor} _hover={{ color: "red.500" }} fontWeight="semibold">
                Đang đấu giá
              </Text>
            </Link>
            {/* Admin shortcut visible only to admins */}
            {/* {user && user.role === "admin" && (
              <Link to="/admin">
                <Text color={linkColor} _hover={{ color: "red.500" }} fontWeight="semibold">
                  Admin
                </Text>
              </Link>
            )} */}
          </HStack>

          {/* Right: Buttons */}
          <HStack spacing={4}>
            <HStack>
              <IconButton
                icon=
                {colorMode === "light"
                  ? <IoMoon size={20} />
                  : <IoSunny size={20} />
                }
                onClick={toggleColorMode}
                variant={"ghost"}
                aria-label="Toggle theme"
              />
              {user ? (
                <HStack>
                  <IconButton
                    as={Link}
                    to="/chat"
                    icon={<IoChatbubble size={18} />}
                    variant={"ghost"}
                    aria-label="Go to chat"
                  />

                  <NotificationBell />

                  <IconButton
                    as={Link}
                    to="/saved-posts"
                    icon={<IoHeart size={20} />}
                    variant={"ghost"}
                    aria-label="Go to saved posts"
                  />

                  {/* <IconButton
                    icon={<IoNotifications size={20}/>}
                    variant={"ghost"}
                    aria-label="Open notifications"
                  /> */}
                </HStack>
              ): null}
            </HStack>  

            {!user ? (
              <HStack display={{ base: "none", lg: "flex" }}>
                <Button colorScheme="red" onClick={() => openAuth("login")}>
                  Đăng nhập
                </Button>
                <Button variant={"outline"} onClick={() => openAuth("register")}>
                  Đăng ký
                </Button>
              </HStack>
            ) : (
              <HStack spacing={4}>
                {/* User Menu Dropdown */}
                <UserMenu user={user} logoutUser={logoutUser} />
                {/* Nút Đăng tin mới */}
                <Button
                  colorScheme="red"
                  display={{base: "none", lg: "flex"}}
                  onClick={() => setIsCreateOpen(true)}
                >
                  Tạo phiên đấu giá
                </Button>
              </HStack>
            )}

            {/* Mobile Menu Button (Luôn hiện trên mobile) */}
            <IconButton
              display={{ base: "flex", lg: "none" }}
              icon={<HamburgerIcon />}
              onClick={onOpen}
              variant={"ghost"}
              aria-label="Open Menu"
            />
          </HStack>
        </Flex>
      </Container>

      {/* Drawer Mobile */}
      <DrawerMenu
        isOpen={isOpen}
        onClose={onClose}
        openAuth={openAuth}
        user={user}
        logoutUser={logoutUser}
        openCreate={() => setIsCreateOpen(true)}
      />

      {/* Modals */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        defaultMode={authMode}
      />
      
      <CreateListingModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />
    </Box>
  );
};

export default Navbar;