import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Text,
  Box,
  Textarea,
  FormControl,
  FormLabel,
  FormErrorMessage,
  useDisclosure,
} from "@chakra-ui/react";
import { useState, useEffect } from "react";

const ActionConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  isLoading = false,
  isDanger = false, // Nếu true thì nút xác nhận màu đỏ (Xóa/Ban)
  requireReason = true, // Có bắt buộc nhập lý do không
}) => {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  // Reset form mỗi khi mở modal
  useEffect(() => {
    if (isOpen) {
      setReason("");
      setError("");
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (requireReason && !reason.trim()) {
      setError("Vui lòng nhập lý do để người dùng biết nguyên nhân.");
      return;
    }
    onConfirm(reason);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{title}</ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <Box mb={4}>{message}</Box>
          
          {requireReason && (
            <FormControl isInvalid={!!error}>
              <FormLabel fontWeight="bold">Lý do thực hiện:</FormLabel>
              <Textarea
                placeholder="Nhập lý do chi tiết (VD: Vi phạm chính sách hình ảnh...)"
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  setError("");
                }}
                rows={4}
                resize="none"
              />
              <FormErrorMessage>{error}</FormErrorMessage>
            </FormControl>
          )}
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose} isDisabled={isLoading}>
            Hủy bỏ
          </Button>
          <Button
            colorScheme={isDanger ? "red" : "blue"}
            onClick={handleSubmit}
            isLoading={isLoading}
            loadingText="Đang xử lý"
          >
            Xác nhận
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ActionConfirmModal;