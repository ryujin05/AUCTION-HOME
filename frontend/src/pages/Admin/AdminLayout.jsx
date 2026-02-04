import { Box, Flex, VStack, HStack, Text, IconButton, Button, Avatar, Divider, useColorModeValue, Image, Icon } from "@chakra-ui/react";
import { NavLink, Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import { useState } from 'react';
import { MdDashboard, MdHome, MdPeople, MdMessage, MdBarChart, MdHistory, MdLogout, MdWarning } from "react-icons/md";
import { useBreakpointValue } from "@chakra-ui/react";

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const sidebarBg = useColorModeValue('white', 'gray.800');
  const sidebarBorder = useColorModeValue('gray.100', 'gray.700');
  const mainBg = useColorModeValue('gray.50', 'gray.900');

  const normalizePath = (p) => (p || '').replace(/\/+$/, '') || '/';
  const isActive = (path) => normalizePath(path) === normalizePath(location.pathname);

  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const activeBgColor = useColorModeValue('gray.100', 'gray.700');

  const isCollapsed = useBreakpointValue({
    base: true,
    md: false,
  });

  const itemProps = (path) => ({
    variant: "ghost",
    justifyContent: "flex-start",
    _hover: { bg: hoverBg, color: "blue.600" },
    bg: isActive(path) ? activeBgColor : undefined,
    color: isActive(path) ? "blue.600" : undefined,
    fontWeight: isActive(path) ? 600 : undefined,
  });

  return (
    <Flex minH="100vh">
      <VStack
        w={isCollapsed ? "80px" : "250px"}
        p={4}
        spacing={4}
        bg={sidebarBg}
        borderRight="1px solid"
        borderColor={sidebarBorder}
        transition="width 0.2s ease"
      >
        <VStack spacing={2} align="stretch" w="full">
          <Button as={NavLink} to="/admin" {...itemProps("/admin")} w="full" justifyContent={isCollapsed ? "center" : "flex-start"}>
            <HStack spacing={2}>
              <Icon as={MdDashboard} boxSize={5}/>
              {!isCollapsed && <Text>Tổng quan</Text>}
            </HStack>
          </Button>

          <Button as={NavLink} to="/admin/properties" {...itemProps("/admin/properties")} w="full" justifyContent={isCollapsed ? "center" : "flex-start"}>
            <HStack spacing={2}>
              <Icon as={MdHome} boxSize={5} />
              {!isCollapsed && <Text>Quản lý tin đăng</Text>}
            </HStack>
          </Button>

          <Button as={NavLink} to="/admin/reports" {...itemProps("/admin/reports")} w="full" justifyContent={isCollapsed ? "center" : "flex-start"}>
            <HStack spacing={2}>
              <Icon as={MdWarning} boxSize={5} />
              {!isCollapsed && <Text>Xử lý báo xấu</Text>}
            </HStack>
          </Button>

          <Button as={NavLink} to="/admin/users" {...itemProps("/admin/users")} w="full" justifyContent={isCollapsed ? "center" : "flex-start"}>
            <HStack spacing={2}>
              <Icon as={MdPeople} boxSize={5} />
              {!isCollapsed && <Text>Quản lý người dùng</Text>}
            </HStack>
          </Button>

          {/* <Button as={NavLink} to="/admin/messages" {...itemProps("/admin/messages")} w="full" justifyContent={isCollapsed ? "center" : "flex-start"}>
            <HStack spacing={2}>
              <Icon as={MdMessage} boxSize={5} />
              {!isCollapsed && <Text>Trung tâm thông báo</Text>}
            </HStack>
          </Button> */}

          <Button as={NavLink} to="/admin/actions" {...itemProps("/admin/actions")} w="full" justifyContent={isCollapsed ? "center" : "flex-start"}>
            <HStack spacing={2}>
              <Icon as={MdHistory} boxSize={5} />
              {!isCollapsed && <Text>Lịch sử hoạt động</Text>}
            </HStack>
          </Button>

          <Button as={NavLink} to="/admin/system-settings" {...itemProps("/admin/system-settings")} w="full" justifyContent={isCollapsed ? "center" : "flex-start"}>
            <HStack spacing={2}>
              <Icon as={MdBarChart} boxSize={5} />
              {!isCollapsed && <Text>Cấu hình hệ thống</Text>}
            </HStack>
          </Button>
        </VStack>
      </VStack>

      <Box flex={1} p={6} bg={mainBg}>
        <Outlet />
      </Box>
    </Flex>
  );
}
