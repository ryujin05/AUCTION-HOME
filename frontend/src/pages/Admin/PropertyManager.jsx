import { useEffect, useState } from "react";
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
  Select,
  HStack,
  Text,
  useToast,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure,
  useColorModeValue,
  Image,
  Badge,
  Tooltip,
  IconButton,
  VStack,
  Alert,
  AlertIcon,
  Divider, 
  Flex,
  Stack
} from "@chakra-ui/react";
import { useRef } from "react";
import { CheckIcon, CloseIcon, DeleteIcon } from "@chakra-ui/icons";
import adminService from "../../services/adminService";
import ActionConfirmModal from "../../components/ActionConfirmModal.jsx";

export default function PropertyManager() {
  const [listings, setListings] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef();
  const [pending, setPending] = useState({ id: null, action: null });
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: null, // 'REJECT' | 'DELETE'
    data: null, // listing object
    title: "",
    message: "",
    isDanger: false,
  });
  const [isLoadingAction, setIsLoadingAction] = useState(false); // Loading khi đang submit modal
  const rowBg = useColorModeValue("white", "gray.900");
  const hoverBg = useColorModeValue("gray.50", "gray.700");

  const fetchListings = async () => {
    setLoading(true);
    try {
      const res = await adminService.getListings({
        status: statusFilter,
        rental_type: typeFilter,
      });
      const items = res.data.listings || [];
      // console.log(
      //   "Admin listings statuses:",
      //   items.map((i) => ({ id: i._id, status: i.status }))
      // ); // debug
      setListings(items);
    } catch (e) {
      console.error("Failed to fetch admin listings", e);
    } finally {
      setLoading(false);
    }
  };
  Image,
    Badge,
    useEffect(() => {
      fetchListings();
    }, []);

  const confirmAction = (id, action) => {
    setPending({ id, action });
    onOpen();
  };

  // Mở Modal Từ chối (Reject)
  const openRejectModal = (listing) => {
    setModalConfig({
      isOpen: true,
      type: "REJECT",
      data: listing,
      title: "Từ chối bài đăng",
      message: (
        <VStack align="start" spacing={3}>
          <Alert status="warning" borderRadius="md">
            <AlertIcon />
            Bạn sắp từ chối bài đăng này.
          </Alert>

          <Text>
            Bài viết{" "}
            <Text as="span" fontWeight="bold">
              “{listing.title}”
            </Text>{" "}
            sẽ không được hiển thị trên hệ thống.
          </Text>

          <Text>
            Vui lòng nhập{" "}
            <Text as="span" fontWeight="bold">
              lý do từ chối
            </Text>{" "}
            để thông báo cho người đăng.
          </Text>
        </VStack>
      ),
      isDanger: false,
    });
  };

  // Duyệt bài (Approve) - Không cần lý do
  const handleApprove = async (listing) => {
    try {
      await adminService.updateListingStatus(listing._id, "approved");

      // Update UI Optimistically
      setListings((prev) =>
        prev.map((l) =>
          l._id === listing._id ? { ...l, status: "approved" } : l
        )
      );
      toast({ status: "success", title: "Đã duyệt bài đăng" });
    } catch (e) {
      console.error("Approve failed", e);
      toast({ status: "error", title: "Duyệt thất bại" });
    }
  };

  // Mở Modal Xóa (Delete)
  const openDeleteModal = (listing) => {
    setModalConfig({
      isOpen: true,
      type: "DELETE",
      data: listing,
      title: "Xóa bài đăng vĩnh viễn",
      message: (
        <VStack align="start" spacing={3}>
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            Bạn sắp xóa vĩnh viễn bài đăng này.
          </Alert>

          <Text>
            Bài viết{" "}
            <Text as="span" fontWeight="bold">
              “{listing.title}”
            </Text>{" "}
            sẽ bị xóa{" "}
            <Text as="span" fontWeight="bold">
              vĩnh viễn
            </Text>{" "}
            khỏi hệ thống.
          </Text>

          <Text color="red.500" fontWeight="semibold">
            Hành động này không thể khôi phục.
          </Text>
        </VStack>
      ),
      isDanger: true,
    });
  };

  //Xử lý xác nhận từ Modal (Gửi API kèm Reason)
  const onConfirmAction = async (reason) => {
    const { type, data } = modalConfig;
    setIsLoadingAction(true);

    try {
      if (type === "REJECT") {
        await adminService.updateListingStatus(data._id, "rejected", reason);

        setListings((prev) =>
          prev.map((l) =>
            l._id === data._id ? { ...l, status: "rejected" } : l
          )
        );
        toast({ status: "success", title: "Đã từ chối bài đăng" });
      }

      if (type === "DELETE") {
        await adminService.deleteListing(data._id, reason);

        setListings((prev) => prev.filter((l) => l._id !== data._id));
        toast({ status: "success", title: "Đã xóa bài đăng" });
      }
    } catch (e) {
      console.error("Action failed", e);
      toast({
        status: "error",
        title: "Thao tác thất bại",
        description: e.message,
      });
    } finally {
      setIsLoadingAction(false);
      setModalConfig((prev) => ({ ...prev, isOpen: false })); // Đóng modal
    }
  };

  const performAction = async () => {
    const { id, action } = pending;
    try {
      if (action === "approve" || action === "reject") {
        const status = action === "approve" ? "approved" : "rejected";
        await adminService.updateListingStatus(id, status);
        setListings((prev) =>
          prev.map((l) => (l._id === id ? { ...l, status } : l))
        );
      }

      if (action === "delete") {
        await adminService.deleteListing(id);
        setListings((prev) => prev.filter((l) => l._id !== id));
      }

      toast({ status: "success", title: "Thành công" });
    } catch (e) {
      console.error("Admin action failed", e);
      toast({ status: "error", title: "Thao tác thất bại" });
    } finally {
      setPending({ id: null, action: null });
      onClose();
    }
  };

  // Color-mode aware tokens
  const cardBg = useColorModeValue("white", "gray.800");
  const textColor = useColorModeValue("gray.800", "white");

  const normalize = (s) => (s || "").toString().toLowerCase().trim();

  const mapStatus = (s) => {
    const st = normalize(s);
    if (st === "approved" || st === "available" || st === "published")
      return "Đã duyệt";
    if (st === "pending" || st === "waiting") return "Chờ duyệt";
    if (st === "rejected" || st === "denied") return "Bị từ chối";
    return s;
  };

  const mapType = (t) => {
    if (!t) return "";
    const tt = t.toString().toLowerCase();
    if (tt === "rent") return "Cho thuê";
    if (tt === "sale" || tt === "sell") return "Bán";
    return t;
  };

  const formatPrice = (price) => {
    if (!price && price !== 0) return "Liên hệ";
    const amount = Number(price);
    if (isNaN(amount)) return price;
    if (amount >= 1000000000) {
      // show billions with comma as decimal separator
      return (
        (amount / 1000000000).toFixed(1).replace(/\.0$/, "").replace(".", ",") +
        " Tỷ"
      );
    }
    return new Intl.NumberFormat("vi-VN").format(amount) + " đ";
  };

  const getConfirmMessage = (action) => {
    if (action === "approve") return "Bạn có chắc muốn duyệt bài này?";
    if (action === "reject") return "Bạn có chắc muốn từ chối bài này?";
    if (action === "delete") return "Bạn có chắc muốn xóa bài này?";
    return "Bạn có chắc muốn thực hiện hành động này?";
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
        Quản lý tin đăng
      </Heading>

      <HStack spacing={3} mb={3} display={{ base: "none", lg: "flex" }}>
        <Select
          placeholder="Tất cả trạng thái"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          maxW="220px"
        >
          <option value="">Tất cả</option>
          <option value="pending">Chờ duyệt</option>
          <option value="approved">Đã duyệt</option>
          <option value="rejected">Bị từ chối</option>
        </Select>

        <Select
          placeholder="Tất cả loại"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          maxW="220px"
        >
          <option value="">Tất cả</option>
          <option value="rent">Cho thuê</option>
          <option value="sale">Bán</option>
        </Select>

        <Button onClick={fetchListings} colorScheme="blue">
          Áp dụng
        </Button>
        <Button
          onClick={() => {
            setStatusFilter("");
            setTypeFilter("");
            fetchListings();
          }}
        >
          Đặt lại
        </Button>
      </HStack>

      <VStack spacing={3} mb={3} display={{ base: "block", lg: "none" }}>
        <HStack spacing={3} mb={3}>
          <Select
            placeholder="Tất cả trạng thái"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            maxW="220px"
          >
            <option value="">Tất cả</option>
            <option value="pending">Chờ duyệt</option>
            <option value="approved">Đã duyệt</option>
            <option value="rejected">Bị từ chối</option>
          </Select>

          <Select
            placeholder="Tất cả loại"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            maxW="220px"
          >
            <option value="">Tất cả</option>
            <option value="rent">Cho thuê</option>
            <option value="sale">Bán</option>
          </Select>
        </HStack>

        <HStack spacing={3} mb={3}>
          <Button onClick={fetchListings} colorScheme="blue">
            Áp dụng
          </Button>
          <Button
            onClick={() => {
              setStatusFilter("");
              setTypeFilter("");
              fetchListings();
            }}
          >
            Đặt lại
          </Button>
        </HStack>
      </VStack>

      {loading ? (
        <Text>Đang tải...</Text>
      ) : (
        <>
          <Box
            bg={cardBg}
            borderRadius="md"
            p={4}
            overflowX="hidden"
            shadow="sm"
            display={{ base: "none", lg: "block" }}
          >
            <Table
              variant="simple"
              color={textColor}
              table-layout="fixed"
              w="100%"
            >
              <Thead>
                <Tr>
                  {/* CỘT CHÍNH */}
                  <Th w={{ base: "100%", lg: "30%" }}>Tiêu đề</Th>

                  {/* CỘT PHỤ – AUTO */}
                  <Th display={{ base: "none", lg: "table-cell" }}>Loại</Th>

                  <Th display={{ base: "none", lg: "table-cell" }}>
                    Trạng thái
                  </Th>

                  <Th display={{ base: "none", lg: "table-cell" }}>
                    Người đăng
                  </Th>

                  {/* ACTION – WIDTH CỨNG */}
                  <Th
                    w="160px"
                    textAlign="right"
                    display={{ base: "none", lg: "table-cell" }}
                  >
                    Hành động
                  </Th>
                </Tr>
              </Thead>
              <Tbody>
                {listings.map((l) => (
                  <Tr
                    key={l._id}
                    cursor="pointer"
                    onClick={() => window.open(`/listings/${l._id}`, "_blank")}
                    _hover={{ bg: hoverBg }}
                  >
                    {/* TIÊU ĐỀ */}
                    <Td>
                      <Text
                        fontWeight={600}
                        noOfLines={2}
                        wordBreak="break-word"
                      >
                        {l.title}
                      </Text>
                    </Td>

                    {/* LOẠI */}
                    <Td display={{ base: "none", lg: "table-cell" }}>
                      {mapType(l.rental_type)}
                    </Td>

                    {/* TRẠNG THÁI */}
                    <Td display={{ base: "none", lg: "table-cell" }}>
                      {normalize(l.status) === "approved" ? (
                        <Badge colorScheme="green">Đã duyệt</Badge>
                      ) : normalize(l.status) === "pending" ? (
                        <Badge colorScheme="orange">Chờ duyệt</Badge>
                      ) : normalize(l.status) === "rejected" ? (
                        <Badge colorScheme="red">Không duyệt</Badge>
                      ) : normalize(l.status) === "closed" ? (
                        <Badge colorScheme="gray">Đã đóng</Badge>
                      ) : (
                        <Badge>{mapStatus(l.status)}</Badge>
                      )}
                    </Td>

                    {/* NGƯỜI ĐĂNG */}
                    <Td
                      display={{ base: "none", lg: "table-cell" }}
                      wordBreak="break-word"
                    >
                      {l.owner?.email
                        ? `${l.owner?.name || l.owner?.username} (${
                            l.owner?.email
                          })`
                        : l.owner?.name || l.owner?.username}
                    </Td>

                    {/* ACTION */}
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
                       {normalize(l.status) === "pending" ? (
                          <>
                            <Button
                              size="sm"
                              colorScheme="green"
                              isDisabled={normalize(l.status) === "approved"}
                              onClick={() => handleApprove(l)}
                              aria-label="Approve"
                              // onClick={() => confirmAction(l._id, "approve")}
                            >
                              Duyệt
                            </Button>
                            <Button
                              size="sm"
                              colorScheme="red"
                              variant="outline"
                              // onClick={() => confirmAction(l._id, "reject")}
                              isDisabled={normalize(l.status) === "rejected"}
                              onClick={() => openRejectModal(l)}
                              aria-label="Reject"
                            >
                              Từ chối
                            </Button>
                          </>
                        ) : normalize(l.status) === "approved" ? (
                          <>
                            <Button
                              size="sm"
                              colorScheme="orange"
                              // onClick={() => confirmAction(l._id, "reject")}
                              isDisabled={normalize(l.status) === "rejected"}
                              onClick={() => openRejectModal(l)}
                              aria-label="Reject"
                            >
                              Hủy duyệt
                            </Button>
                            <Button
                              size="sm"
                              colorScheme="red"
                              variant="outline"
                              // onClick={() => confirmAction(l._id, "delete")}
                              onClick={() => openDeleteModal(l)}
                              aria-label="Delete"
                            >
                              Xóa
                            </Button>
                          </>
                        ) : normalize(l.status) === "rejected" ? (
                          <>
                            <Button
                              size="sm"
                              colorScheme="green"
                              // onClick={() => confirmAction(l._id, "approve")}
                              isDisabled={normalize(l.status) === "approved"}
                              onClick={() => handleApprove(l)}
                              aria-label="Approve"
                            >
                              Duyệt
                            </Button>

                            <Button
                              size="sm"
                              colorScheme="red"
                              variant="outline"
                              // onClick={() => confirmAction(l._id, "delete")}
                              onClick={() => openDeleteModal(l)}
                              aria-label="Delete"
                            >
                              Xóa
                            </Button>
                          </>
                        ) : null}
                      </Stack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>

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
                    {getConfirmMessage(pending.action)}
                  </AlertDialogBody>
                  <AlertDialogFooter>
                    <Button ref={cancelRef} onClick={onClose}>
                      Hủy
                    </Button>
                    <Button colorScheme="red" ml={3} onClick={performAction}>
                      {pending.action === "delete" ? "Xóa" : "Xác nhận"}
                    </Button>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialogOverlay>
            </AlertDialog> */}
          </Box>
          {/* MOBILE VIEW */}
          <VStack
            spacing={4}
            display={{ base: "flex", lg: "none" }}
            align="stretch"
          >
            {listings.map((l) => (
              <Box
                key={l._id}
                p={4}
                borderWidth="1px"
                borderRadius="lg"
                cursor="pointer"
                bg={rowBg}
                onClick={() => window.open(`/listings/${l._id}`, "_blank")}
                _hover={{ bg: hoverBg }}
              >
                <VStack align="stretch" spacing={3}>
                  {/* Tiêu đề */}
                  <PropertyRow label="Tiêu đề">
                    <Text fontWeight={600} noOfLines={2}>
                      {l.title}
                    </Text>
                  </PropertyRow>

                  {/* Loại */}
                  <PropertyRow label="Loại">
                    <Badge>{mapType(l.rental_type)}</Badge>
                  </PropertyRow>

                  {/* Trạng thái */}
                  <PropertyRow label="Trạng thái">
                    {normalize(l.status) === "approved" ? (
                      <Badge colorScheme="green">Đã duyệt</Badge>
                    ) : normalize(l.status) === "pending" ? (
                      <Badge colorScheme="orange">Chờ duyệt</Badge>
                    ) : normalize(l.status) === "rejected" ? (
                      <Badge colorScheme="red">Không được duyệt</Badge>
                    ) : normalize(l.status) === "closed" ? (
                      <Badge colorScheme="gray">Đã đóng</Badge>
                    ) : (
                      <Badge>{mapStatus(l.status)}</Badge>
                    )}
                  </PropertyRow>

                  {/* Người đăng */}
                  <PropertyRow label="Người đăng">
                    <Text fontSize="sm">
                      {l.owner?.email
                        ? `${l.owner?.name || l.owner?.username} (${
                            l.owner?.email
                          })`
                        : l.owner?.name || l.owner?.username}
                    </Text>
                  </PropertyRow>

                  {/* Hành động */}
                  <PropertyRow label="Hành động" isLast>
                    <HStack
                      spacing={2}
                      justify="flex-end"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {normalize(l.status) === "pending" && (
                        <>
                          <Button
                            size="sm"
                            colorScheme="green"
                            onClick={() => handleApprove(l)}
                          >
                            Duyệt
                          </Button>
                          <Button
                            size="sm"
                            colorScheme="red"
                            variant="outline"
                            onClick={() => openRejectModal(l)}
                          >
                            Từ chối
                          </Button>
                        </>
                      )}

                      {normalize(l.status) === "approved" && (
                        <>
                          <Button
                            size="sm"
                            colorScheme="orange"
                            onClick={() => openRejectModal(l)}
                          >
                            Hủy duyệt
                          </Button>
                          <Button
                            size="sm"
                            colorScheme="red"
                            variant="outline"
                            onClick={() => openDeleteModal(l)}
                          >
                            Xóa
                          </Button>
                        </>
                      )}

                      {normalize(l.status) === "rejected" && (
                        <>
                          <Button
                            size="sm"
                            colorScheme="green"
                            onClick={() => handleApprove(l)}
                          >
                            Duyệt
                          </Button>
                          <Button
                            size="sm"
                            colorScheme="red"
                            variant="outline"
                            onClick={() => openDeleteModal(l)}
                          >
                            Xóa
                          </Button>
                        </>
                      )}
                    </HStack>
                  </PropertyRow>
                </VStack>
              </Box>
            ))}
          </VStack>
        </>
      )}

      {/* COMPONENT MODAL NHẬP LÝ DO */}
      <ActionConfirmModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={onConfirmAction}
        title={modalConfig.title}
        message={modalConfig.message}
        isDanger={modalConfig.isDanger}
        isLoading={isLoadingAction}
        requireReason={true}
      />
    </Box>
  );
}
