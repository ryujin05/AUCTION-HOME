import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  FormControl,
  FormLabel,
  Select,
  Input,
  Textarea,
  VStack,
  useToast,
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { useReportStore } from "../store/report.js";

const reasons = [
  { value: "tin_sai_su_that", label: "Tin sai sự thật" },
  { value: "khong_lien_lac_duoc", label: "Không liên lạc được với người đăng" },
  { value: "gian_lan", label: "Gian lận / Lừa đảo" },
  { value: "noi_dung_xuc_pham", label: "Nội dung xúc phạm / không phù hợp" },
  { value: "da_ban", label: "Bất động sản đã bán" },
  { value: "khac", label: "Khác" },
];

const ReportModal = ({ isOpen, onClose, listingId }) => {
  const toast = useToast();
  const createReport = useReportStore((s) => s.createReport);
  const loading = useReportStore((s) => s.loading);

  const [reason, setReason] = useState("");
  const [otherReason, setOtherReason] = useState("");
  const [detail, setDetail] = useState("");

  useEffect(() => {
    if (isOpen) {
      setReason("");
      setOtherReason("");
      setDetail("");
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const finalReason = reason === "Khác" ? otherReason.trim() : reason;
    if (!finalReason) {
      toast({ title: "Vui lòng chọn hoặc nhập lý do", status: "error", isClosable: true });
      return;
    }

    if (!listingId) {
      toast({ title: "Listing ID không hợp lệ", status: "error", isClosable: true });
      return;
    }

    const res = await createReport(listingId, finalReason, detail.trim());

    if (res.success) {
      toast({ title: "Báo cáo đã gửi", description: res.message || "Cảm ơn bạn đã báo cáo", status: "success", isClosable: true });
      onClose();
    } else {
      toast({ title: "Lỗi", description: res.message || "Không thể gửi báo cáo", status: "error", isClosable: true });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent as="form" onSubmit={handleSubmit}>
        <ModalHeader>Báo cáo bài đăng</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <FormControl isRequired>
              <FormLabel>Lý do</FormLabel>
              <Select
                placeholder="Chọn lý do"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              >
                {reasons.map((r) => (
                  <option key={r.label} value={r.label}>
                    {r.label}
                  </option>
                ))}
              </Select>
            </FormControl>

            {reason === "Khác" && (
              <FormControl isRequired>
                <FormLabel>Nhập lý do (khác)</FormLabel>
                <Input
                  value={otherReason}
                  onChange={(e) => setOtherReason(e.target.value)}
                  placeholder="Mô tả ngắn lý do..."
                />
              </FormControl>
            )}

            <FormControl>
              <FormLabel>Chi tiết báo cáo (mô tả thêm)</FormLabel>
              <Textarea
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                placeholder="Chi tiết, bằng chứng, số điện thoại, link, ..."
                rows={5}
              />
            </FormControl>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Hủy
          </Button>
          <Button colorScheme="blue" type="submit" isLoading={loading}>
            Gửi báo cáo
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ReportModal;