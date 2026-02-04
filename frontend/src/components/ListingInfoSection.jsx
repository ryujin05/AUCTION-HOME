import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Button,
  Badge,
  Divider,
  SimpleGrid,
  Icon,
  useToast,
  useColorModeValue,
  Input,
} from "@chakra-ui/react";
import {
  FiMapPin,
  FiHeart,
  FiShare2,
  FiHome,
  FiMaximize,
} from "react-icons/fi";
import { IoWarningOutline } from "react-icons/io5";
import { FaHeart } from "react-icons/fa";
import { useState, useEffect } from "react";
import { useUserStore } from "../store/user.js";
import { useListStore } from "../store/list.js";
import ReportModal from "./ReportModal.jsx";
import { useChatStore } from "../store/chat.js";
import { useNavigate } from "react-router-dom";

const getUserDisplayName = (user) => {
  if (!user) return "Người dùng";
  if (user.name) return user.name;
};

const ListingInfoSection = ({ user, listing, onBidSuccess, serverTime }) => {
  const toggleSave = useUserStore((s) => s.toggleSaveListing);
  const savedListings = useUserStore((s) => s.savedListings);
  const fallbackToggle = useListStore((s) => s.toggleSaveListing);
  const placeBid = useListStore((s) => s.placeBid);
  const fetchListingBids = useListStore((s) => s.fetchListingBids);
  const toast = useToast();
  const navigate = useNavigate();
  const [isContacting, setIsContacting] = useState(false);

  const { createOrFindConversation } = useChatStore();

  const contentBg = useColorModeValue("white", "gray.800");
  const subTextColor = useColorModeValue("gray.600", "white");

  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [bidAmount, setBidAmount] = useState("");
  const [isBidding, setIsBidding] = useState(false);
  const [maxBidAmount, setMaxBidAmount] = useState("");
  const [bidHistory, setBidHistory] = useState([]);
  const [bidHistoryLoading, setBidHistoryLoading] = useState(false);

  const formatCurrency = (value) => {
    if (value === undefined || value === null) return "—";
    const num = Number(value);
    if (Number.isNaN(num)) return value;
    return num.toLocaleString("vi-VN") + " VNĐ";
  };

  const getTimeLeftText = () => {
    if (!listing.endTime) return "—";
    const now = serverTime ? new Date(serverTime) : new Date();
    const end = new Date(listing.endTime);
    const diff = end.getTime() - now.getTime();
    if (diff <= 0) return "Đã kết thúc";
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    const hours = Math.floor((diff / (60 * 60 * 1000)) % 24);
    const minutes = Math.floor((diff / (60 * 1000)) % 60);
    if (days > 0) return `${days} ngày ${hours} giờ`;
    if (hours > 0) return `${hours} giờ ${minutes} phút`;
    return `${minutes} phút`;
  };

  const handleContact = async () => {
    if (!listing.owner?._id) {
      return toast({
        title: "Lỗi",
        description: "Không tìm thấy thông tin người bán.",
        status: "error",
        duration: 3000,
      });
    }

    if (listing.owner._id === user.id) {
      toast({
        title: "Thông báo",
        description: "Bạn không thể nhắn tin với chính mình",
        status: "info",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsContacting(true);
    console.log(listing.owner?._id);
    try {

      const listingUrl = `${window.location.origin}/listings/${listing._id}`;

      const autoMessage = `Tôi muốn trao đổi thêm về bài đăng: [${listing.title}](${listingUrl})`;

      const result = await createOrFindConversation(listing.owner?._id, autoMessage);

      if (result.success) {
        useChatStore.getState().setSelectedConversation(result.conversation);
        
        navigate(`/chat?id=${result.conversation._id}`);
      } else {
        toast({
          title: "Thông báo",
          description: result.message,
          status: "info",
          duration: 3000,
        });
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Có lỗi xảy ra khi kết nối tin nhắn. Có vẻ bạn chưa đăng nhập",
        status: "error",
      });
    } finally {
      setIsContacting(false);
    }
  };

  const handlePlaceBid = async () => {
    if (!user) {
      return toast({
        title: "Đăng nhập",
        description: "Vui lòng đăng nhập để đặt giá",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
    }

    const amount = Number(bidAmount);
    if (!amount || Number.isNaN(amount)) {
      return toast({
        title: "Giá không hợp lệ",
        description: "Vui lòng nhập giá hợp lệ",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }

    const maxAmountNum = maxBidAmount ? Number(maxBidAmount) : undefined;
    if (maxBidAmount && Number.isNaN(maxAmountNum)) {
      return toast({
        title: "Giá tối đa không hợp lệ",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }

    setIsBidding(true);
    const res = await placeBid(listing._id, amount, maxAmountNum);
    if (res.success) {
      toast({
        title: "Đặt giá thành công",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
      setBidAmount("");
      setMaxBidAmount("");
      onBidSuccess?.();
    } else {
      toast({
        title: "Không thể đặt giá",
        description: res.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
    setIsBidding(false);
  };

  useEffect(() => {
    setIsSaved(savedListings.includes(listing._id));
  }, [savedListings, listing._id]);

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (!isAdmin) return;
    const loadBids = async () => {
      setBidHistoryLoading(true);
      const res = await fetchListingBids(listing._id);
      if (res.success) setBidHistory(res.data || []);
      setBidHistoryLoading(false);
    };
    loadBids();
  }, [isAdmin, listing._id, fetchListingBids]);

  return (
    <Box
      bg={contentBg}
      p={6}
      position="sticky"
      top="20px"
      borderRadius="lg"
      borderWidth="2px"
      shadow="sm"
    >
      <VStack spacing={4} align="stretch">
        {/* Title and Location */}
        <Box>
          <Heading size="lg" mb={2} lineHeight="short">
            {listing.title}
          </Heading>
          <HStack color={subTextColor} fontSize="sm">
            <Icon as={FiMapPin} />
            <Text>
              {listing.location?.detail}, {listing.location?.ward},{" "}
              {listing.location?.province}
            </Text>
          </HStack>
        </Box>

        {/* Auction Price */}
        <Box>
          <Text fontSize="sm" color={subTextColor}>
            Giá hiện tại
          </Text>
          <Text color="red.500" fontSize="2xl" fontWeight="700">
            {formatCurrency(listing.currentPrice ?? listing.price)}
          </Text>
          <HStack mt={2} spacing={3} fontSize="sm" color={subTextColor}>
            <Text>Giá khởi điểm: {formatCurrency(listing.startingPrice ?? listing.price)}</Text>
            <Text>Bước giá: {formatCurrency(listing.bidIncrement)}</Text>
          </HStack>
          <Text fontSize="sm" color={subTextColor} mt={2}>
            Kết thúc sau: {getTimeLeftText()}
          </Text>
          <Text fontSize="sm" color={subTextColor}>
            Thời gian kết thúc: {listing.endTime ? new Date(listing.endTime).toLocaleString("vi-VN") : "—"}
          </Text>
        </Box>

        <Divider />

        {/* Property Details */}
        <VStack spacing={3} align="stretch">
          <Text fontWeight="600">Thông tin chi tiết</Text>

          <SimpleGrid columns={2} spacing={3}>
            <HStack>
              <Icon as={FiHome} color={subTextColor} />
              <Text fontSize="sm">
                <Text as="span" color={subTextColor}>
                  Loại:
                </Text>{" "}
                <Badge colorScheme="red" ml={1}>
                  {listing.property_type?.name || listing.property_type}
                </Badge>
              </Text>
            </HStack>

            <HStack>
              <Icon as={FiMaximize} color={subTextColor} />
              <Text fontSize="sm">
                <Text as="span" color={subTextColor}>
                  Diện tích:
                </Text>{" "}
                {listing.area} m²
              </Text>
            </HStack>
          </SimpleGrid>

          <Box>
            <Text fontSize="sm" color={subTextColor} mb={1}>
              Trạng thái phiên:
            </Text>
            {(() => {
              const getStatusInfo = (status) => {
                if (!status || status === "live")
                  return { text: "Đang đấu giá", color: "green" };
                if (status === "scheduled")
                  return { text: "Đang diễn ra", color: "yellow" };
                if (status === "ended") return { text: "Kết thúc", color: "red" };
                return { text: status, color: "gray" };
              };
              const { text, color } = getStatusInfo(listing.auctionStatus);
              return (
                <Badge colorScheme={color} size="sm">
                  {text}
                </Badge>
              );
            })()}
          </Box>

          {listing.description && (
            <Box>
              <Text fontSize="sm" color={subTextColor} mb={1}>
                Mô tả:
              </Text>
              <Text fontSize="sm" lineHeight="tall">
                {listing.description}
              </Text>
            </Box>
          )}
        </VStack>

        <Divider />

        {/* Action Buttons */}
        <VStack spacing={3}>
          <VStack width="full" spacing={2} align="stretch">
            <Text fontSize="sm" color={subTextColor}>
              Nhập mức giá muốn đặt
            </Text>
            <Input
              type="number"
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
              placeholder="VD: 1.200.000.000"
              isDisabled={
                listing.auctionStatus &&
                !["live", "scheduled"].includes(listing.auctionStatus)
              }
            />
            <Input
              type="number"
              value={maxBidAmount}
              onChange={(e) => setMaxBidAmount(e.target.value)}
              placeholder="Giá tối đa (proxy bidding)"
              isDisabled={
                listing.auctionStatus &&
                !["live", "scheduled"].includes(listing.auctionStatus)
              }
            />
            <Button
              colorScheme="red"
              size="lg"
              width="full"
              onClick={handlePlaceBid}
              isLoading={isBidding}
              isDisabled={
                listing.auctionStatus &&
                !["live", "scheduled"].includes(listing.auctionStatus)
              }
            >
              Đặt giá
            </Button>
          </VStack>
          <Button
            colorScheme="red"
            size="lg"
            width="full"
            onClick={handleContact}
            isLoading={isContacting}
            isDisabled={listing.status !== "approved"}
          >
            Liên hệ người bán
          </Button>

          <HStack width="full">
            <Button
              leftIcon={isSaved ? <FaHeart /> : <FiHeart />}
              variant={isSaved ? "solid" : "outline"}
              colorScheme={isSaved ? "red" : "gray"}
              flex={1}
              isLoading={isLoading}
              _active={{
                transform: "translateY(0px)",
              }}
              onClick={async (e) => {
                e.stopPropagation();
                setIsLoading(true);
                try {
                  const res = toggleSave
                    ? await toggleSave(listing._id)
                    : await fallbackToggle(listing._id);
                  if (res.success) {
                    toast({
                      title: res.message,
                      status: "success",
                      isClosable: true,
                      duration: 2000,
                    });
                  } else {
                    toast({
                      title: res.message || "Lỗi",
                      status: "error",
                      isClosable: true,
                    });
                  }
                } catch (err) {
                  toast({
                    title: err.message || "Lỗi khi lưu",
                    status: "error",
                    isClosable: true,
                  });
                } finally {
                  setIsLoading(false);
                }
              }}
            >
              {isSaved ? "Đã lưu" : "Lưu"}
            </Button>
            <Button
              leftIcon={<FiShare2 />}
              variant="outline"
              flex={1}
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                toast({
                  title: "Đã sao chép",
                  description: "Đã sao chép liên kết vào clipboard",
                  status: "success",
                  duration: 2000,
                });
              }}
            >
              Chia sẻ
            </Button>
            <Button
              leftIcon={<IoWarningOutline />}
              variant="outline"
              flex={1}
              onClick={() => {
                setIsReportOpen(true);
              }}
            >
              Báo xấu
            </Button>
          </HStack>
        </VStack>

        {/* Safety Notice */}
        <Box
          bg="yellow.50"
          p={3}
          borderRadius="md"
          border="1px solid"
          borderColor="yellow.200"
        >
          <Text fontSize="xs" color="yellow.800">
            💡 <strong>Lưu ý an toàn:</strong> Hãy kiểm tra kỹ thông tin và gặp
            trực tiếp để xem nhà trước khi quyết định thuê/mua.
          </Text>
        </Box>

        {/* Report modal */}
        <ReportModal
          isOpen={isReportOpen}
          onClose={() => setIsReportOpen(false)}
          listingId={listing._id}
        />

        {isAdmin && (
          <Box
            mt={4}
            p={4}
            borderRadius="lg"
            borderWidth="1px"
            borderColor={useColorModeValue("red.200", "red.700")}
            bg={useColorModeValue("red.50", "gray.800")}
          >
            <Heading size="sm" mb={3}>
              Thống kê người đặt giá
            </Heading>
            {bidHistoryLoading ? (
              <Text fontSize="sm" color={subTextColor}>
                Đang tải lịch sử đặt giá...
              </Text>
            ) : bidHistory.length === 0 ? (
              <Text fontSize="sm" color={subTextColor}>
                Chưa có lượt đặt giá nào.
              </Text>
            ) : (
              <VStack align="stretch" spacing={2}>
                {bidHistory.map((b) => (
                  <HStack key={b._id} justify="space-between" fontSize="sm">
                    <Text>
                      {b.bidder?.name || "Người dùng"}
                    </Text>
                    <Text fontWeight="600" color="red.500">
                      {formatCurrency(b.amount)}
                    </Text>
                    <Text color={subTextColor}>
                      {new Date(b.createdAt).toLocaleString("vi-VN")}
                    </Text>
                  </HStack>
                ))}
              </VStack>
            )}
          </Box>
        )}
      </VStack>
    </Box>
  );
};

export default ListingInfoSection;
