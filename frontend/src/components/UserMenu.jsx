import {
  Box,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Avatar,
  HStack,
  Text,
  useColorMode,
  MenuDivider,
  Button
} from "@chakra-ui/react";
import { Link } from "react-router-dom";
import { useState } from "react";

import { FiFileText, FiMessageCircle, FiSettings, FiLogOut, FiUser, FiTrendingUp } from "react-icons/fi";
import { FaRegUserCircle } from "react-icons/fa";
import { ImStarEmpty } from "react-icons/im";
import { MdOutlineLightMode, MdOutlineDarkMode } from "react-icons/md";

const getUserDisplayName = (user) => {
  if (!user) return "User";
  if (user.name) return user.name;
};

export default function UserMenu({ user, logoutUser }) {
  const [open, setOpen] = useState(false);
  const { colorMode, toggleColorMode } = useColorMode();

  return (
    <Menu isOpen={open} placement="bottom-end" isLazy>
      <Box
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        <MenuButton>
          <HStack cursor="pointer">
            <Avatar name={getUserDisplayName(user)} src={user?.avatar} size="sm" />
            <Text 
              fontWeight="medium" 
              display={{base: "none", lg: "flex"}}
              isTruncated
              maxW="150px"
            >{getUserDisplayName(user)}</Text>
          </HStack>
        </MenuButton>

        <MenuList>
          <MenuItem as={Link} to="/profile" icon={<FaRegUserCircle />}>
            Trang cá nhân
          </MenuItem>

          <MenuDivider/>

          <MenuItem as={Link} to="/my-posts" icon={<FiFileText />}>
            Bài đăng của tôi
          </MenuItem>

          <MenuItem as={Link} to="/my-bids" icon={<FiTrendingUp />}>
            Lịch sử đặt giá
          </MenuItem>

          <MenuItem as={Link} to="/setting" icon={<FiUser />}>
             Tài khoản
           </MenuItem>

          {/* <MenuItem as={Link} to="/saved-posts" icon={<ImStarEmpty />}>
            Bài đăng đã lưu
          </MenuItem> */}
          
          {/*
          <MenuItem as={Link} to="/chat" icon={<FiMessageCircle />}>
            Nhắn tin
          </MenuItem>

          <MenuItem 
            icon=
            {colorMode === "light" ? (
              <MdOutlineDarkMode/>
            ) : (
              <MdOutlineLightMode />
            )}
            onClick={toggleColorMode}
          >
            {colorMode === "light" ? "Chế độ tối" : "Chế độ sáng"}
          </MenuItem>
          */}

          {user?.role === "admin" && (
            <MenuItem as={Link} to="/admin" icon={<FiSettings />}>
              Trang quản trị
            </MenuItem>
          )}
          <MenuDivider />

          <MenuItem
            icon={<FiLogOut />}
            onClick={async () => {
              await logoutUser();
            }}
          >
            Đăng xuất
          </MenuItem>
        </MenuList>
      </Box>
    </Menu>
  );
}
