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
  HStack,
  Text,
  Badge,
  VStack,
  Flex,
  Divider,
  Select,
  useColorModeValue,
  useToast,
  Alert,
  AlertIcon,
} from "@chakra-ui/react";
import PostsNavigationPanel from "../components/PostsNavigationPanel";
import { useListStore } from "../store/list.js";
import ActionConfirmModal from "../components/ActionConfirmModal.jsx";
import CreateListingModal from "../components/CreateListingModal.jsx";

const normalize = (s) => (s || "").toLowerCase().trim();

const mapStatusBadge = (status) => {
  switch (normalize(status)) {
    case "approved":
      return <Badge colorScheme="green">Đã duyệt</Badge>;
    case "pending":
      return <Badge colorScheme="orange">Chờ duyệt</Badge>;
    case "rejected":
      return <Badge colorScheme="red">Bị từ chối</Badge>;
    case "closed":
      return <Badge colorScheme="gray">Đã đóng</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
};

const mapType = (t) => {
  if (!t) return "";
  const tt = t.toString().toLowerCase();
  if (tt === "rent") return "Cho thuê";
  if (tt === "sale" || tt === "sell") return "Bán";
  return t;
};

const PropertyRow = ({ label, children, isLast }) => (
  <Box w="100%">
    <Flex justify="space-between">
      <Text fontSize="sm" color="gray.500" minW="90px">
        {label}
      </Text>
      <Box textAlign="right">{children}</Box>
    </Flex>
    {!isLast && <Divider mt={3} />}
  </Box>
);

export default function MyPostsPage() {
  const { fetchMyListingsByStatus, deleteListing, changeListingStatus } =
    useListStore();

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [statusFilterDraft, setStatusFilterDraft] = useState("");
  const [selected, setSelected] = useState(null);
  const [editOpen, setEditOpen] = useState(false);

  const toast = useToast();

  /** MODAL STATE (GIỐNG ADMIN) */
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: null, // DELETE | CLOSE | REOPEN
    data: null,
    title: "",
    message: "",
    isDanger: false,
  });
  const [isLoadingAction, setIsLoadingAction] = useState(false);

  const cardBg = useColorModeValue("white", "gray.800");
  const hoverBg = useColorModeValue("gray.50", "gray.700");

  const load = async () => {
    setLoading(true);
    const res = await fetchMyListingsByStatus({ status: statusFilter });
    if (res?.success) setListings(res.data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [statusFilter]);

  /* ===== OPEN MODAL ===== */
  const openDeleteModal = (listing) =>
    setModalConfig({
      isOpen: true,
      type: "DELETE",
      data: listing,
      title: "Xóa bài đăng",
      message: (
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          Bài đăng <b>{listing.title}</b> sẽ bị xóa vĩnh viễn.
        </Alert>
      ),
      isDanger: true,
    });

  const openCloseModal = (listing) =>
    setModalConfig({
      isOpen: true,
      type: "CLOSE",
      data: listing,
      title: "Đóng bài đăng",
      message: (
        <Alert status="warning" borderRadius="md">
          <AlertIcon />
          Bài đăng sẽ tạm thời không hiển thị với người dùng.
        </Alert>
      ),
      isDanger: false,
    });

  const openReopenModal = (listing) =>
    setModalConfig({
      isOpen: true,
      type: "REOPEN",
      data: listing,
      title: "Mở lại bài đăng",
      message: (
        <Alert status="info" borderRadius="md">
          <AlertIcon />
          Bài đăng sẽ được hiển thị lại trên hệ thống.
        </Alert>
      ),
      isDanger: false,
    });

  /* ===== CONFIRM MODAL ===== */
  const onConfirmAction = async () => {
    const { type, data } = modalConfig;
    setIsLoadingAction(true);

    try {
      if (type === "DELETE") await deleteListing(data._id);
      if (type === "CLOSE") await changeListingStatus(data._id, "closed");
      if (type === "REOPEN") await changeListingStatus(data._id, "approved");

      toast({ status: "success", title: "Thao tác thành công" });
      load();
    } catch (e) {
      toast({ status: "error", title: "Thao tác thất bại" });
    } finally {
      setIsLoadingAction(false);
      setModalConfig((p) => ({ ...p, isOpen: false }));
    }
  };

  const onEdit = (listing) => {
    setSelected(listing);
    setEditOpen(true);
  };

  return (
    <Flex minH="100vh" direction={{ base: "column", lg: "row" }}>
      <PostsNavigationPanel />

      <Box flex={1} p={6} bg={useColorModeValue("gray.50", "gray.900")}>
        <Heading size="lg" mb={4} textAlign="center">
          Bài đăng của tôi
        </Heading>

        {/* FILTER */}
        <HStack mb={4} spacing={3} flexWrap="wrap">
          <Select
            placeholder="Tất cả trạng thái"
            maxW="220px"
            value={statusFilterDraft}
            onChange={(e) => setStatusFilterDraft(e.target.value)}
          >
            <option value="pending">Chờ duyệt</option>
            <option value="approved">Đã duyệt</option>
            <option value="rejected">Bị từ chối</option>
            <option value="closed">Đã đóng</option>
          </Select>

          <Button
            colorScheme="blue"
            onClick={() => setStatusFilter(statusFilterDraft)}
          >
            Áp dụng
          </Button>

          <Button
            variant="ghost"
            onClick={() => {
              setStatusFilter("");
              setStatusFilterDraft("");
            }}
          >
            Đặt lại
          </Button>
        </HStack>

        {/* TABLE */}
        <Box
          bg={cardBg}
          p={4}
          borderRadius="md"
          shadow="sm"
          display={{ base: "none", lg: "block" }}
        >
          <Table>
            <Thead>
              <Tr>
                <Th w="50%">Tiêu đề</Th>
                <Th>Loại</Th>
                <Th>Trạng thái</Th>
                <Th textAlign="right">Hành động</Th>
              </Tr>
            </Thead>

            <Tbody>
              {listings.map((l) => (
                <Tr
                  key={l._id}
                  cursor="pointer"
                  _hover={{ bg: hoverBg }}
                  onClick={() => window.open(`/listings/${l._id}`, "_blank")}
                >
                  <Td>
                    <Text fontWeight={600} noOfLines={2}>
                      {l.title}
                    </Text>
                  </Td>
                  <Td>
                    <Text noOfLines={2}>{mapType(l.rental_type)}</Text>
                  </Td>

                  <Td>{mapStatusBadge(l.status)}</Td>

                  <Td textAlign="right" onClick={(e) => e.stopPropagation()}>
                    <HStack justify="flex-end">
                      {normalize(l.status) === "pending" && (
                        <Button
                          size="sm"
                          colorScheme="red"
                          variant="outline"
                          onClick={() => openDeleteModal(l)}
                        >
                          Xóa
                        </Button>
                      )}

                      {normalize(l.status) === "rejected" && (
                        <>
                          <Button
                            size="sm"
                            colorScheme="blue"
                            onClick={() => onEdit(l)}
                          >
                            Chỉnh sửa
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

                      {normalize(l.status) === "approved" && (
                        <>
                          <Button
                            size="sm"
                            colorScheme="blue"
                            onClick={() => onEdit(l)}
                          >
                            Chỉnh sửa
                          </Button>

                          <Button
                            size="sm"
                            colorScheme="orange"
                            onClick={() => openCloseModal(l)}
                          >
                            Đóng
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

                      {normalize(l.status) === "closed" && (
                        <>
                          <Button
                            size="sm"
                            colorScheme="green"
                            onClick={() => openReopenModal(l)}
                          >
                            Mở lại
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
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>

        <VStack
          spacing={4}
          display={{ base: "flex", lg: "none" }}
          align="stretch"
          w="100%"
        >
          {listings.map((l) => (
            <Box
              key={l._id}
              p={4}
              bg={cardBg}
              borderRadius="lg"
              borderWidth="1px"
              cursor="pointer"
              onClick={() => window.open(`/listings/${l._id}`, "_blank")}
              _hover={{ bg: hoverBg }}
            >
              <VStack align="stretch" spacing={3}>
                <PropertyRow label="Tiêu đề">
                  <Text fontWeight={600}>{l.title}</Text>
                </PropertyRow>

                <PropertyRow label="Trạng thái">
                  {mapStatusBadge(l.status)}
                </PropertyRow>

                <PropertyRow label="Hành động" isLast>
                  <HStack
                    spacing={2}
                    justify="flex-end"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {(normalize(l.status) === "pending" ||
                      normalize(l.status) === "rejected") && (
                      <Button
                        size="sm"
                        colorScheme="red"
                        variant="outline"
                        onClick={() => onDelete(l._id)}
                      >
                        Xóa
                      </Button>
                    )}

                    {normalize(l.status) === "approved" && (
                      <>
                        <Button
                          size="sm"
                          colorScheme="orange"
                          onClick={() => onClosePost(l._id)}
                        >
                          Đóng
                        </Button>
                        <Button
                          size="sm"
                          colorScheme="red"
                          variant="outline"
                          onClick={() => onDelete(l._id)}
                        >
                          Xóa
                        </Button>
                      </>
                    )}

                    {normalize(l.status) === "closed" && (
                      <>
                        <Button
                          size="sm"
                          colorScheme="green"
                          onClick={() => onReopenPost(l._id)}
                        >
                          Mở lại
                        </Button>
                        <Button
                          size="sm"
                          colorScheme="red"
                          variant="outline"
                          onClick={() => onDelete(l._id)}
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
      </Box>

      {/* CONFIRM MODAL */}
      <ActionConfirmModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig((p) => ({ ...p, isOpen: false }))}
        onConfirm={onConfirmAction}
        title={modalConfig.title}
        message={modalConfig.message}
        isDanger={modalConfig.isDanger}
        isLoading={isLoadingAction}
        requireReason={false}
      />

      <CreateListingModal
        isOpen={editOpen}
        onClose={() => {
          setEditOpen(false);
          setSelected(null);
          load();
        }}
        defaultValues={selected}
      />
    </Flex>
  );
}
