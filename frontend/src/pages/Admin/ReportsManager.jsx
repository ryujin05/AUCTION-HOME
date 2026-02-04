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
  Text,
  useToast,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure,
  HStack,
  VStack,
  Alert,
  AlertIcon,
  useColorModeValue,
  Divider,
  Flex,
  Badge,
  Stack,
} from "@chakra-ui/react";
import adminService from "../../services/adminService";

import ActionConfirmModal from "../../components/ActionConfirmModal.jsx";

export default function ReportsManager() {
  const [reports, setReports] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef();
  const [pending, setPending] = useState({ id: null, action: null });
  
  const hoverBg = useColorModeValue("gray.50", "gray.700");

  // State quản lý Modal
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: null, // 'RESOLVE' | 'DELETE_LISTING' | 'BAN_USER'
    data: null, // report object
    title: "",
    message: "",
    isDanger: false,
    requireReason: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const mapStatus = (s) => {
    if (!s) return "";
    const st = s.toString().toLowerCase();
    if (st === "pending") return "Chờ duyệt";
    if (st === "reviewed") return "Đã xem";
    if (st === "resolved") return "Đã giải quyết";
    return s;
  };

  const fetchReports = async (p = 1) => {
    setIsLoading(true);
    try {
      const res = await adminService.getReports(p);
      setReports(res.data.reports || []);
      setPage(res.data.page || p);
      setPages(res.data.pages || 1);
    } catch (e) {
      toast({ status: "error", title: "Không thể tải báo cáo" });
    } finally {
      setIsLoading(false);
    }
  };

  const cardBg = useColorModeValue("white", "gray.800");
  const textColor = useColorModeValue("gray.800", "white");
  const mutedColor = useColorModeValue("gray.500", "gray.400");

  useEffect(() => {
    fetchReports(page);
  }, []);

  const confirmAction = (id, action) => {
    setPending({ id, action });
    onOpen();
  };

  // 1. Giải quyết (Đánh dấu đã xem/Không vi phạm)
  const handleResolve = (report) => {
    setModalConfig({
      isOpen: true,
      type: "RESOLVE",
      data: report,
      title: "Đánh dấu đã giải quyết",
      message: (
        <VStack align="start" spacing={3}>
          <Alert status="info" borderRadius="md">
            <AlertIcon />
            Báo cáo này sẽ được đóng lại.
          </Alert>

          <Text>
            Không có hành động trừng phạt nào được áp dụng cho bài viết hoặc
            người dùng liên quan.
          </Text>
        </VStack>
      ),
      isDanger: false,
      requireReason: false, // Tùy chọn
    });
  };

  // 2. Xóa bài viết bị report
  const handleDeleteListing = (report) => {
    setModalConfig({
      isOpen: true,
      type: "DELETE_LISTING",
      data: report,
      title: "Xử lý vi phạm: Xóa bài viết",
      message: (
        <VStack align="start" spacing={3}>
          <Text>
            Bạn đang xóa bài viết{" "}
            <Text as="span" fontWeight="bold">
              “{report.listing?.title}”
            </Text>
            .
          </Text>

          <Alert status="warning" borderRadius="md">
            <AlertIcon />
            Hành động này sẽ gửi thông báo đến:
          </Alert>

          <VStack pl={5} spacing={1} align="start">
            <Text>• Chủ bài đăng</Text>
            <Text>• Người báo cáo</Text>
          </VStack>

          <Text color="red.500" fontWeight="semibold">
            Hành động này không thể hoàn tác.
          </Text>
        </VStack>
      ),

      isDanger: true,
      requireReason: true,
    });
  };

  // 3. Cấm người đăng bài bị report
  const handleBanUser = (report) => {
    setModalConfig({
      isOpen: true,
      type: "BAN_USER",
      data: report,
      title: "Xử lý vi phạm: Cấm người dùng",
      message: (
        <VStack align="start" spacing={3}>
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            Bạn sắp khóa tài khoản của chủ bài đăng.
          </Alert>

          <Text>
            Người dùng sẽ bị{" "}
            <Text as="span" fontWeight="bold">
              đăng xuất ngay lập tức
            </Text>{" "}
            và không thể tiếp tục sử dụng hệ thống.
          </Text>

          <Text color="red.500" fontWeight="semibold">
            Hành động này không thể hoàn tác.
          </Text>
        </VStack>
      ),
      isDanger: true,
      requireReason: true,
    });
  };

  const getConfirmMessage = (action, r) => {
    if (action === "resolve")
      return "Bạn có chắc muốn đánh dấu báo cáo này là đã giải quyết?";
    if (action === "delete")
      return r?.listing
        ? "Bạn có chắc muốn xóa tin này?"
        : "Bài viết gốc đã bị xóa. Bạn muốn đánh dấu báo cáo là đã giải quyết?";
    if (action === "ban")
      return r?.listing
        ? "Bạn có chắc muốn cấm người đăng này?"
        : "Bài viết gốc đã bị xóa. Bạn có chắc muốn cấm người này?";
    return "Bạn có chắc muốn thực hiện hành động này?";
  };

  const perform = async () => {
    try {
      const { id, action } = pending;
      let res;
      if (action === "resolve") {
        res = await adminService.resolveReport(id, "resolved");
      } else if (action === "delete") {
        res = await adminService.actionOnReport(id, "delete_listing");
      } else if (action === "ban") {
        res = await adminService.actionOnReport(id, "ban_user");
      }
      toast({ status: "success", title: res?.data?.message || "Thành công" });
      fetchReports(page);
    } catch (e) {
      toast({
        status: "error",
        title: e?.response?.data?.message || "Thất bại",
      });
    } finally {
      onClose();
      setPending({ id: null, action: null });
    }
  };

  // --- GỌI API ---
  const onConfirmAction = async (reason) => {
    setIsSubmitting(true);
    const { type, data } = modalConfig;

    try {
      if (type === "RESOLVE") {
        // Resolve đơn thuần (Không xóa bài)
        await adminService.resolveReport(data._id, "resolved");
        toast({ status: "success", title: "Đã giải quyết báo cáo" });
      } else if (type === "DELETE_LISTING") {
        // Xóa bài + Resolve
        await adminService.actionOnReport(data._id, "delete_listing", reason);
        toast({ status: "success", title: "Đã xóa bài viết và đóng báo cáo" });
      } else if (type === "BAN_USER") {
        // Ban user + Resolve
        await adminService.actionOnReport(data._id, "ban_user", reason);
        toast({
          status: "success",
          title: "Đã cấm người dùng và đóng báo cáo",
        });
      }

      // Reload data
      fetchReports(page);
    } catch (e) {
      toast({
        status: "error",
        title: e?.response?.data?.message || "Thao tác thất bại",
      });
    } finally {
      setIsSubmitting(false);
      setModalConfig((prev) => ({ ...prev, isOpen: false }));
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
        Xử lý báo xấu
      </Heading>
      <Box
        bg={cardBg}
        p={4}
        borderRadius="md"
        overflowX={"hidden"}
        display={{ base: "none", lg: "block" }}
      >
        <Table variant="simple" color={textColor} tableLayout="fixed" w="100%">
          <Thead>
            <Tr>
              {/* Cột chính – chiếm nhiều nhất */}
              <Th w={{ base: "100%", lg: "35%" }}>Tin</Th>

              {/* Các cột phụ – auto */}
              <Th display={{ base: "none", lg: "table-cell" }}>Người báo</Th>

              <Th display={{ base: "none", lg: "table-cell" }}>Lý do</Th>

              <Th display={{ base: "none", lg: "table-cell" }}>Ngày</Th>

              <Th display={{ base: "none", lg: "table-cell" }}>Trạng thái</Th>

              {/* Action – giới hạn cứng */}
              <Th
                w="180px"
                textAlign="right"
                display={{ base: "none", lg: "table-cell" }}
              >
                Hành động
              </Th>
            </Tr>
          </Thead>

          <Tbody>
            {reports.map((r) => (
              <Tr
                key={r._id}
                cursor="pointer"
                onClick={() =>
                  window.open(`/listings/${r.listing?._id}`, "_blank")
                }
                _hover={{bg: hoverBg}}
              >
                {/* Tin */}
                <Td>
                  {r.listing?.title ? (
                    <Text fontWeight={600} noOfLines={2} wordBreak="break-word">
                      {r.listing.title}
                    </Text>
                  ) : (
                    <Text fontStyle="italic" color={mutedColor}>
                      (Bài viết đã xóa)
                    </Text>
                  )}

                  {r.listing && (
                    <Text fontSize="xs" color="gray.500" noOfLines={1}>
                      Chủ bài: {r.listing.owner?.name || "Unknown"}
                    </Text>
                  )}
                </Td>

                {/* Người báo */}
                <Td display={{ base: "none", lg: "table-cell" }}>
                  {r.reporter?.name || r.reporter?.username || "—"}
                </Td>

                {/* Lý do */}
                <Td display={{ base: "none", lg: "table-cell" }}>
                  <Text noOfLines={2} wordBreak="break-word">
                    {r.reason}
                  </Text>
                </Td>

                {/* Ngày */}
                <Td display={{ base: "none", lg: "table-cell" }}>
                  {new Date(r.createdAt).toLocaleDateString("vi-VN")}
                </Td>

                {/* Trạng thái */}
                <Td display={{ base: "none", lg: "table-cell" }}>
                  {mapStatus(r.status)}
                </Td>

                {/* Hành động */}
                <Td
                  display={{ base: "none", lg: "table-cell" }}
                  textAlign="right"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Stack
                    direction="row"
                    spacing={2}
                    justify="flex-end"
                    flexWrap="wrap"
                  >
                    <Button
                      size="sm"
                      colorScheme="green"
                      onClick={() => handleResolve(r)}
                    >
                      Giải quyết
                    </Button>
                    <Button
                      size="sm"
                      colorScheme="red"
                      variant="outline"
                      onClick={() => handleDeleteListing(r)}
                      isDisabled={!r.listing}
                    >
                      Xóa
                    </Button>
                    <Button
                      size="sm"
                      colorScheme="orange"
                      onClick={() => handleBanUser(r)}
                      isDisabled={!r.listing}
                    >
                      Cấm
                    </Button>
                  </Stack>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>

        <Box
          mt={4}
          display="flex"
          justifyContent="space-between"
          alignItems="center"
        >
          <Text>
            Trang {page} / {pages} — Tổng {reports.length}
          </Text>
          <HStack>
            <Button
              size="sm"
              onClick={() => {
                if (page > 1) {
                  fetchReports(page - 1);
                }
              }}
              isDisabled={page <= 1}
            >
              Trang trước
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (page < pages) {
                  fetchReports(page + 1);
                }
              }}
              isDisabled={page >= pages}
            >
              Trang sau
            </Button>
          </HStack>
        </Box>

        {/* <AlertDialog
          isOpen={isOpen}
          leastDestructiveRef={cancelRef}
          onClose={onClose}
        >
          <AlertDialogOverlay>
            <AlertDialogContent>
              <AlertDialogHeader fontSize="lg" fontWeight="bold">
                Xác nhận
              </AlertDialogHeader>
              <AlertDialogBody>
                {getConfirmMessage(
                  pending.action,
                  reports.find((r) => r._id === pending.id)
                )}
              </AlertDialogBody>
              <AlertDialogFooter>
                <Button ref={cancelRef} onClick={onClose}>
                  Hủy
                </Button>
                <Button colorScheme="red" ml={3} onClick={perform}>
                  Xác nhận
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog> */}
      </Box>
      <VStack
        spacing={4}
        display={{ base: "flex", lg: "none" }}
        align="stretch"
      >
        {reports.map((r) => (
          <Box
            key={r._id}
            p={4}
            borderWidth="1px"
            borderRadius="lg"
            cursor="pointer"
            bg={cardBg}
            onClick={() =>
              r.listing && window.open(`/listings/${r.listing?._id}`, "_blank")
            }
            _hover={{ bg: hoverBg }}
          >
            <VStack align="stretch" spacing={3}>
              {/* Tin */}
              <PropertyRow label="Tin">
                {r.listing?.title ? (
                  <Text fontWeight={600} noOfLines={2}>
                    {r.listing.title}
                  </Text>
                ) : (
                  <Text fontStyle="italic" color="gray.500">
                    (Bài viết đã xóa)
                  </Text>
                )}
              </PropertyRow>

              {/* Người báo */}
              <PropertyRow label="Người báo">
                <Text fontSize="sm">
                  {r.reporter?.name || r.reporter?.username || "—"}
                </Text>
              </PropertyRow>

              {/* Lý do */}
              <PropertyRow label="Lý do">
                <VStack align="end" spacing={1}>
                  <Text fontSize="sm" noOfLines={2}>
                    {r.reason}
                  </Text>
                  {r.detail && (
                    <Text fontSize="xs" color="gray.600" noOfLines={1}>
                      — {r.detail}
                    </Text>
                  )}
                </VStack>
              </PropertyRow>

              {/* Ngày */}
              <PropertyRow label="Ngày">
                <Text fontSize="sm">
                  {new Date(r.createdAt).toLocaleString("vi-VN")}
                </Text>
              </PropertyRow>

              {/* Trạng thái */}
              <PropertyRow label="Trạng thái">
                <Badge>{mapStatus(r.status)}</Badge>
              </PropertyRow>

              {/* Hành động */}
              <PropertyRow label="Hành động" isLast>
                <VStack
                  spacing={2}
                  align="flex-end"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    size="sm"
                    colorScheme="green"
                    onClick={() => handleResolve(r)}
                  >
                    Giải quyết
                  </Button>

                  <Button
                    size="sm"
                    colorScheme="red"
                    variant="outline"
                    onClick={() => handleDeleteListing(r)}
                    isDisabled={!r.listing}
                  >
                    Xóa tin
                  </Button>

                  <Button
                    size="sm"
                    colorScheme="orange"
                    onClick={() => handleBanUser(r)}
                    isDisabled={!r.listing}
                  >
                    Cấm người đăng
                  </Button>
                </VStack>
              </PropertyRow>
            </VStack>
          </Box>
        ))}
      </VStack>
      {/* MOBILE PAGINATION */}
      <Box
        mt={4}
        display={{ base: "flex", lg: "none" }}
        justifyContent="space-between"
        alignItems="center"
      >
        <Text fontSize="sm">
          Trang {page} / {pages} — Tổng {reports.length}
        </Text>

        <HStack>
          <Button
            size="sm"
            onClick={() => {
              if (page > 1) {
                fetchReports(page - 1);
              }
            }}
            isDisabled={page <= 1}
          >
            Trước
          </Button>

          <Button
            size="sm"
            onClick={() => {
              if (page < pages) {
                fetchReports(page + 1);
              }
            }}
            isDisabled={page >= pages}
          >
            Sau
          </Button>
        </HStack>
      </Box>

      {/* MODAL XÁC NHẬN */}
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
