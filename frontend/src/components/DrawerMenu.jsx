import {
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerCloseButton,
  VStack,
  Text,
  Button,
  useColorModeValue,
} from "@chakra-ui/react";
import { Link } from "react-router-dom";

const DrawerMenu = ({
  isOpen,
  onClose,
  openAuth,
  user,
  logoutUser,
  openCreate,
}) => {
  const linkColor = useColorModeValue("gray.700", "gray.100");

  return (
    <Drawer isOpen={isOpen} placement="right" onClose={onClose}>
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton mt={"3"}/>
        <DrawerHeader>
          <Text
            fontSize="28px"
            fontWeight="bold"
            textTransform="uppercase"
            bgGradient="linear(to-r, red.400, red.600)"
            bgClip="text"
          >
            Auction Home
          </Text>
        </DrawerHeader>
        <DrawerBody>
          <VStack align="start" spacing={4}>
            <Link to="/listings" onClick={onClose}>
              <Text color={linkColor}>Tìm kiếm</Text>
            </Link>
            <Link to="/listings?auctionStatus=live" onClick={onClose}>
              <Text color={linkColor}>Đang đấu giá</Text>
            </Link>

            {!user ? (
              <>
                <Button
                  colorScheme="red"
                  w="full"
                  onClick={() => openAuth("login")}
                >
                  Đăng nhập
                </Button>
                <Button
                  variant="outline"
                  w="full"
                  onClick={() => openAuth("register")}
                >
                  Đăng ký
                </Button>
              </>
            ) : (
              <>
                <Button as={Link} to="/my-bids" w="full" variant="outline" onClick={onClose}>
                  Lịch sử đặt giá
                </Button>
                <Button colorScheme="red" w="full" onClick={openCreate}>
                  Tạo phiên đấu giá
                </Button>
                {user && user.role === "admin" && (
                  <Button as={Link} to="/admin" w="full" colorScheme="red" onClick={onClose}>
                    Trang quản trị
                  </Button>
                )}
                <Button w="full" onClick={logoutUser} variant={"outline"}>
                  Đăng xuất
                </Button>
              </>
            )}
          </VStack>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
};

export default DrawerMenu;
