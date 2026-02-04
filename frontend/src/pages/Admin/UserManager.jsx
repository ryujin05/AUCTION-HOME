import { useEffect, useState, useRef } from "react";
import {
  Box,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  Switch,
  HStack,
  Text,
  useToast,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  VStack,
  Alert,
  AlertIcon,
  useDisclosure,
  useColorModeValue,
  Badge,
  Flex,
  Divider,
} from "@chakra-ui/react";
import adminService from "../../services/adminService";
import ActionConfirmModal from "../../components/ActionConfirmModal.jsx";

export default function UserManager() {
  const [users, setUsers] = useState([]);
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [pending, setPending] = useState({ id: null, ban: false });
  const cancelRef = useRef();
  const rowBg = useColorModeValue("white", "gray.900");
  const hoverBg = useColorModeValue("gray.50", "gray.700");

  // State quản lý Modal
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: null, // 'BAN' | 'UNBAN'
    data: null, // user object
    title: "",
    message: "",
    isDanger: false,
    requireReason: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const res = await adminService.getUsers();
        setUsers(res.data.users || []);
      } catch (e) {
        console.error(e);
        toast({ status: "error", title: "Lỗi tải danh sách người dùng" });
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const cardBg = useColorModeValue("white", "gray.800");
  const textColor = useColorModeValue("gray.800", "white");

  // 1. Xử lý khi bấm vào Switch
  const handleToggleBan = (user, nextBanStatus) => {
    // nextBanStatus = true (Sắp Cấm) | false (Sắp Bỏ cấm)
    if (nextBanStatus) {
      // Trường hợp CẤM
      setModalConfig({
        isOpen: true,
        type: "BAN",
        data: user,
        title: "Khóa tài khoản người dùng",
        message: (
          <VStack align="start" spacing={3}>
            <Alert status="error" borderRadius="md">
              <AlertIcon />
              Bạn sắp khóa tài khoản người dùng.
            </Alert>

            <Text>
              Tài khoản{" "}
              <Text as="span" fontWeight="bold">
                “{user.username}”
              </Text>{" "}
              sẽ bị{" "}
              <Text as="span" fontWeight="bold">
                đăng xuất ngay lập tức
              </Text>
              .
            </Text>

            <Text color="red.500" fontWeight="semibold">
              Hành động này không thể hoàn tác.
            </Text>
          </VStack>
        ),
        isDanger: true,
        requireReason: true, // Bắt buộc nhập lý do khi cấm
      });
    } else {
      // Trường hợp BỎ CẤM
      setModalConfig({
        isOpen: true,
        type: "UNBAN",
        data: user,
        title: "Mở khóa tài khoản",
        message: (
          <VStack align="start" spacing={3}>
            <Alert status="success" borderRadius="md">
              <AlertIcon />
              Bạn sắp mở khóa tài khoản người dùng.
            </Alert>

            <Text>
              Khôi phục quyền truy cập cho tài khoản{" "}
              <Text as="span" fontWeight="bold">
                “{user.username}”
              </Text>
              .
            </Text>
          </VStack>
        ),
        isDanger: false,
        requireReason: false, // Không bắt buộc (tùy chọn)
      });
    }
  };

  // 2. Gọi API khi nhấn Xác nhận trên Modal
  const onConfirmAction = async (reason) => {
    setIsSubmitting(true);
    const { type, data } = modalConfig;
    const isBanning = type === "BAN"; // true nếu đang cấm, false nếu bỏ cấm

    try {
      // Gọi service toggleBanUser(id, ban, reason)
      await adminService.toggleBanUser(data._id, isBanning, reason);

      // Cập nhật State UI
      setUsers((prev) =>
        prev.map((u) =>
          u._id === data._id ? { ...u, isBanned: isBanning } : u
        )
      );

      toast({
        status: "success",
        title: isBanning ? "Đã khóa tài khoản" : "Đã mở khóa tài khoản",
      });
    } catch (e) {
      console.error(e);
      toast({ status: "error", title: "Thao tác thất bại" });
    } finally {
      setIsSubmitting(false);
      setModalConfig((prev) => ({ ...prev, isOpen: false }));
    }
  };

  const confirmToggle = (id, ban) => {
    setPending({ id, ban });
    onOpen();
  };

  const toggleBan = async () => {
    try {
      const { id, ban } = pending;
      await adminService.toggleBanUser(id, ban);
      setUsers((prev) =>
        prev.map((u) => (u._id === id ? { ...u, isBanned: ban } : u))
      );
      toast({ status: "success", title: "Cập nhật thành công" });
    } catch (e) {
      toast({ status: "error", title: "Thao tác thất bại" });
    } finally {
      onClose();
      setPending({ id: null, ban: false });
    }
  };

  const PropertyRow = ({ label, children, isLast }) => (
    <Box w="100%">
      <Flex justify="space-between" align="flex-start">
        <Text fontSize="sm" color="gray.500" minW="90px">
          {label}
        </Text>
        <Box textAlign="right" flex="1">
          {children}
        </Box>
      </Flex>

      {!isLast && <Divider mt={3} />}
    </Box>
  );

  return (
    <Box>
      <Heading size="md" mb={4}>
        Quản lý người dùng
      </Heading>

      <Box
        bg={cardBg}
        borderRadius="md"
        p={4}
        overflowX="hidden"
        display={{ base: "none", lg: "block" }}
        width={"100%"}
      >
        <Table variant="simple" color={textColor} tableLayout="fixed" w="100%">
          <Thead>
            <Tr>
              <Th w="28%">Email</Th>
              <Th w="14%">Phone</Th>
              <Th w="16%">Tên</Th>
              <Th w="12%">Vai trò</Th>
              <Th w="15%">Ngày tham gia</Th>
              <Th w="15%">Bị cấm</Th>
            </Tr>
          </Thead>

          <Tbody>
            {users.map((u) => (
              <Tr key={u._id} _hover={{ bg: hoverBg }}>
                <Td wordBreak="break-word"><Text noOfLines={2}>{u.email || "-"}</Text></Td>
                <Td>{u.phone || "-"}</Td>
                <Td wordBreak="break-word"><Text noOfLines={2}>{u.name}</Text></Td>
                <Td>{u.role === "guest" ? "User" : u.role}</Td>
                <Td>{new Date(u.createdAt).toLocaleDateString()}</Td>
                <Td>
                  <HStack>
                    <Switch
                      colorScheme="red"
                      isChecked={u.isBanned}
                      onChange={(e) => handleToggleBan(u, e.target.checked)}
                    />
                    <Text
                      fontSize="sm"
                      color={u.isBanned ? "red.500" : undefined}
                    >
                      {u.isBanned ? "Bị cấm" : "Hoạt động"}
                    </Text>
                  </HStack>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>

        {users.length === 0 && !isLoading && (
          <Text p={4} textAlign="center" color="gray.500">
            Không có người dùng nào.
          </Text>
        )}

        {/* <AlertDialog
          isOpen={isOpen}
          leastDestructiveRef={cancelRef}
          onClose={onClose}
        >
          <AlertDialogOverlay>
            <AlertDialogContent>
              <AlertDialogHeader fontSize="lg" fontWeight="bold">
                Xác nhận hành động
              </AlertDialogHeader>

              <AlertDialogBody>
                {pending.ban
                  ? "Bạn có chắc muốn cấm người dùng này?"
                  : "Bạn có chắc muốn bỏ cấm người dùng này?"}
              </AlertDialogBody>

              <AlertDialogFooter>
                <Button ref={cancelRef} onClick={onClose}>
                  Hủy
                </Button>
                <Button colorScheme="red" onClick={toggleBan} ml={3}>
                  {pending.ban ? "Cấm" : "Bỏ cấm"}
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog> */}
      </Box>
      {/* MODAL XÁC NHẬN + NHẬP LÝ DO */}
      <VStack
        spacing={4}
        display={{ base: "flex", lg: "none" }}
        align="stretch"
      >
        {users.map((u) => (
          <Box key={u._id} p={4} borderWidth="1px" borderRadius="lg" bg={rowBg} _hover={{ bg: hoverBg }}>
            <VStack align="stretch" spacing={3}>
              <PropertyRow label="Email">
                <Text fontSize="sm">{u.email || "-"}</Text>
              </PropertyRow>

              <PropertyRow label="Phone">
                <Text fontSize="sm">{u.phone || "-"}</Text>
              </PropertyRow>

              <PropertyRow label="Tên">
                <Text fontWeight={600}>{u.name}</Text>
              </PropertyRow>

              <PropertyRow label="Vai trò">
                <Badge>{u.role === "guest" ? "User" : u.role}</Badge>
              </PropertyRow>

              <PropertyRow label="Ngày tham gia">
                <Text fontSize="sm">
                  {new Date(u.createdAt).toLocaleDateString()}
                </Text>
              </PropertyRow>

              <PropertyRow label="Trạng thái" isLast>
                <HStack justify="flex-end">
                  <Switch
                    colorScheme="red"
                    isChecked={u.isBanned}
                    onChange={(e) => handleToggleBan(u, e.target.checked)}
                  />
                  <Text
                    fontSize="sm"
                    color={u.isBanned ? "red.500" : undefined}
                  >
                    {u.isBanned ? "Bị cấm" : "Hoạt động"}
                  </Text>
                </HStack>
              </PropertyRow>
            </VStack>
          </Box>
        ))}
      </VStack>
      <ActionConfirmModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={onConfirmAction}
        title={modalConfig.title}
        message={modalConfig.message}
        isDanger={modalConfig.isDanger}
        requireReason={modalConfig.requireReason}
        isLoading={isSubmitting}
      />
    </Box>
  );
}
