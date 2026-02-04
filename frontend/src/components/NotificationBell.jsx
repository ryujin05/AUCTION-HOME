import { useEffect, useState, useRef } from "react";
import {
  Box,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  Text,
  Badge,
  Flex,
  VStack,
  useToast,
  Spinner,
} from "@chakra-ui/react";

import { BellIcon } from "@chakra-ui/icons";
import { useNavigate } from "react-router-dom";
import notificationService from "../services/notificationService.js";
import { useSocketContext } from "../context/SocketContext.jsx";

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  //   {const [loading, setLoading] = useState(false);}
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const navigate = useNavigate();
  const toast = useToast();

  const { socket } = useSocketContext();

  const listRef = useRef(null);

  const fetchNotifications = async () => {
    setLoading(true);

    try {
      const res = await notificationService.getMyNotifications();

      const list = res.data.notifications || [];

      //sort
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setNotifications(list);
      setUnreadCount(list.filter((n) => !n.isRead).length);
    } catch (error) {
      console.error("Lỗi tải thông báo", error);
    } finally {
      setLoading(false);
    }
  };

  // Hàm load data (Dùng chung cho cả init và load more)
  const loadNotifications = async (currentPage) => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const res = await notificationService.getMyNotifications(currentPage);
      const newItems = res.data.notifications || [];

      // Update badge từ server (chính xác hơn tính tay)
      // Nếu là trang 1 thì set luôn, trang sau thì giữ nguyên hoặc update nếu muốn
      if (currentPage === 1) {
        setUnreadCount(res.data.totalUnread || 0);
        setNotifications(newItems);
      } else {
        // Nối mảng cũ + mới (lọc trùng ID để an toàn)
        setNotifications((prev) => {
          const ids = new Set(prev.map((n) => n._id));
          const filteredNew = newItems.filter((n) => !ids.has(n._id));
          return [...prev, ...filteredNew];
        });
      }

      setHasMore(res.data.hasMore); // Backend trả về cờ này
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // fetchNotifications();
    loadNotifications(1);
  }, []);

  // 2. Load more khi page thay đổi (trừ page 1 đã load ở trên)
  useEffect(() => {
    if (page > 1) {
      loadNotifications(page);
    }
  }, [page]);

  // 3. Xử lý Scroll (Infinite Scroll)
  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;

    // Nếu cuộn xuống gần đáy (còn 5px) và còn dữ liệu + không đang load
    if (scrollTop + clientHeight >= scrollHeight - 5 && hasMore && !isLoading) {
      setPage((prev) => prev + 1);
    }
  };

  //Nghe socket -> real time
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (newNotif) => {
      setNotifications((prev) => [newNotif, ...prev]);
      setUnreadCount((prev) => prev + 1);

      //Toast
      toast({
        title: newNotif.title,
        description: newNotif.message,
        status: "info",
        duration: 4000,
        isClosable: true,
        position: "top-right",
      });
    };

    socket.on("new_notification", handleNewNotification);

    return () => {
      socket.off("new_notification", handleNewNotification);
    };
  }, [socket, toast]);

  //Click thong bao
  const handleRead = async (notif) => {
    if (!notif.isRead) {
      try {
        await notificationService.markAsRead(notif._id);
        setNotifications((prev) =>
          prev.map((n) => (n._id === notif._id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (error) {
        console.error(error);
      }
    }

    if (notif.type === "POST_DELETED") {
      toast({
        title: "Bài viết không tồn tại",
        description: "Bài viết này đã bị xóa khỏi hệ thống.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (notif.referenceModel === "Listing" && notif.referenceId) {
      navigate(`/listings/${notif.referenceId}`);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error(error);
    }
  };

  const formatTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Menu isLazy closeOnSelect={false}>
      <MenuButton
        as={IconButton}
        variant="ghost"
        aria-label="Notifications"
        icon={
          <Box position="relative">
            <BellIcon boxSize={6} color="black.600" />
            {unreadCount > 0 && (
              <Badge
                colorScheme="red"
                borderRadius="full"
                position="absolute"
                top="-2px"
                right="-2px"
                fontSize="0.6em"
                w="18px"
                h="18px"
                display="flex"
                alignItems="center"
                justifyContent="center"
                border="2px solid white"
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </Badge>
            )}
          </Box>
        }
      />

      <MenuList
        maxH="450px"
        overflowY="auto"
        w="360px"
        p={0}
        shadow="xl"
        zIndex={20}
        onScroll={handleScroll}
      >
        {/* Header của Menu */}
        <Box
          p={3}
          borderBottom="1px solid"
          borderColor="gray.100"
          bg="white"
          position="sticky"
          top={0}
          zIndex={1}
        >
          <Flex justify="space-between" align="center">
            <Text fontWeight="bold" fontSize="md">
              Thông báo
            </Text>
            {unreadCount > 0 && (
              <Text
                fontSize="xs"
                color="blue.500"
                cursor="pointer"
                fontWeight="semibold"
                _hover={{ textDecoration: "underline" }}
                onClick={handleMarkAllRead}
              >
                Đánh dấu đã đọc hết
              </Text>
            )}
          </Flex>
        </Box>

        {isLoading ? (
          <Flex justify="center" p={4}>
            <Spinner size="sm" color="blue.500" />
          </Flex>
        ) : notifications.length === 0 ? (
          <Box p={6} textAlign="center" color="gray.500">
            <Text fontSize="sm">Bạn chưa có thông báo nào.</Text>
          </Box>
        ) : (
          <VStack spacing={0} align="stretch">
            {notifications.map((notif) => (
              <MenuItem
                key={notif._id}
                onClick={() => handleRead(notif)}
                bg={notif.isRead ? "white" : "blue.50"} // Chưa đọc: nền xanh nhạt
                _hover={{ bg: "gray.100" }}
                borderBottom="1px solid"
                borderColor="gray.100"
                py={3}
                px={4}
                cursor="pointer"
              >
                <Flex direction="column" w="100%">
                  {/* Tiêu đề & Badge Mới */}
                  <Flex justify="space-between" align="start" mb={1}>
                    <Text
                      fontWeight="bold"
                      fontSize="sm"
                      color="gray.800"
                      noOfLines={1}
                      flex={1}
                    >
                      {notif.title}
                    </Text>
                    {!notif.isRead && (
                      <Badge
                        ml={2}
                        colorScheme="green"
                        fontSize="10px"
                        variant="solid"
                      >
                        MỚI
                      </Badge>
                    )}
                  </Flex>

                  {/* Nội dung chính */}
                  <Text
                    fontSize="sm"
                    color="gray.600"
                    noOfLines={2}
                    lineHeight="short"
                  >
                    {notif.message}
                  </Text>

                  {/* Hiển thị Lý do (Quan trọng) */}
                  {notif.reason && (
                    <Box
                      mt={2}
                      p={2}
                      bg="red.50"
                      borderRadius="md"
                      borderLeft="3px solid"
                      borderColor="red.400"
                    >
                      <Text fontSize="xs" color="red.700">
                        <Text as="span" fontWeight="bold">
                          Lý do:
                        </Text>{" "}
                        {notif.reason}
                      </Text>
                    </Box>
                  )}

                  {/* Thời gian */}
                  <Text fontSize="xs" color="gray.400" mt={2} textAlign="right">
                    {formatTime(notif.createdAt)}
                  </Text>
                </Flex>
              </MenuItem>
            ))}

            {/* Loading Indicator ở đáy */}
            {isLoading && (
              <Flex justify="center" p={2}>
                <Spinner size="sm" color="blue.500" />
              </Flex>
            )}

            {/* Hết dữ liệu */}
            {!hasMore && notifications.length > 0 && (
              <Text textAlign="center" fontSize="xs" color="gray.400" p={2}>
                Đã hiển thị hết thông báo
              </Text>
            )}

            {!isLoading && notifications.length === 0 && (
              <Box p={6} textAlign="center" color="gray.500">
                <Text fontSize="sm">Bạn chưa có thông báo nào.</Text>
              </Box>
            )}
          </VStack>
        )}
      </MenuList>
    </Menu>
  );
};

export default NotificationBell;
