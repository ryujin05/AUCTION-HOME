import {
  VStack,
  Button,
  useColorModeValue,
  HStack,
  Icon,
  Text,
  Avatar,
  Divider
} from "@chakra-ui/react";
import { NavLink, useLocation } from "react-router-dom";
import { FaBookmark, FaFileAlt, FaUserAlt } from "react-icons/fa";
import { useUserStore } from "../store/user.js";

const PostsNavigationPanel = () => {
  const location = useLocation();
  const sidebarBg = useColorModeValue("white", "gray.800");
  const sidebarBorder = useColorModeValue("gray.100", "gray.700");
  const hoverBg = useColorModeValue("gray.50", "gray.700");
  const activeBgColor = useColorModeValue("gray.100", "gray.700");

  const normalizePath = (p) => (p || "").replace(/\/+$/, "") || "/";
  const isActive = (path) =>
    normalizePath(path) === normalizePath(location.pathname);
  const { user } = useUserStore();

  const getUserDisplayName = (user) => {
    if (!user) return "User";
    if (user.name) return user.name;
  };

  const itemProps = (path) => ({
    variant: "ghost",
    justifyContent: "flex-start",
    _hover: { bg: hoverBg, color: "blue.600" },
    bg: isActive(path) ? activeBgColor : undefined,
    color: isActive(path) ? "blue.600" : undefined,
    fontWeight: isActive(path) ? 600 : undefined,
  });

  return (
    <VStack
      w="250px"
      p={4}
      spacing={4}
      bg={sidebarBg}
      borderRight="1px solid"
      borderColor={sidebarBorder}
      display={{ base: "none", lg: "block" }}
    >
      <VStack spacing={2} align="stretch" w="full">
        {/* <Button as={NavLink} to="/saved-posts" {...itemProps('/saved-posts')} w="full">
          <HStack spacing={2}>
            <Icon as={FaBookmark} boxSize={5} />
            <Text>Bài đã lưu</Text>
          </HStack>
        </Button> */}
        <HStack m={1}>
          <Avatar name={getUserDisplayName(user)} src={user?.avatar} size="md" />
          <VStack spacing={0} align={"left"}>
            <Text
              fontWeight={"thin"}
              display={{ base: "none", lg: "flex" }}
              isTruncated
              maxW="150px"
            >Xin chào,</Text>
            <Text
              fontWeight={"medium"}
              display={{ base: "none", lg: "flex" }}
              isTruncated
              maxW="150px"
            >
              {getUserDisplayName(user)}
            </Text>
          </VStack>
        </HStack>

        <Divider/>

        <Button
          as={NavLink}
          to="/my-posts"
          {...itemProps("/my-posts")}
          w="full"
        >
          <HStack spacing={2}>
            <Icon as={FaFileAlt} boxSize={5} />
            <Text>Bài đăng của tôi</Text>
          </HStack>
        </Button>
        <Button as={NavLink} to="/setting" {...itemProps("/setting")} w="full">
          <HStack spacing={2}>
            <Icon as={FaUserAlt} boxSize={5} />
            <Text>Cài đặt tài khoản</Text>
          </HStack>
        </Button>
      </VStack>
    </VStack>
  );
};

export default PostsNavigationPanel;
