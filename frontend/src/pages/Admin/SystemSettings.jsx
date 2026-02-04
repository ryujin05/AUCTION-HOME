import { useEffect, useState } from "react";
import {
  Box,
  Heading,
  FormControl,
  FormLabel,
  Input,
  Button,
  VStack,
  useToast,
  HStack,
  Text,
} from "@chakra-ui/react";
import adminService from "../../services/adminService.js";

export default function SystemSettings() {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    commissionRate: 2,
    defaultDepositAmount: 0,
    antiSnipingWindowSec: 120,
    antiSnipingExtensionSec: 300,
  });

  const loadConfig = async () => {
    try {
      setLoading(true);
      const res = await adminService.getSystemConfig();
      if (res.data?.config) {
        setForm({
          commissionRate: res.data.config.commissionRate ?? 2,
          defaultDepositAmount: res.data.config.defaultDepositAmount ?? 0,
          antiSnipingWindowSec: res.data.config.antiSnipingWindowSec ?? 120,
          antiSnipingExtensionSec: res.data.config.antiSnipingExtensionSec ?? 300,
        });
      }
    } catch (e) {
      toast({ status: "error", title: "Không tải được cấu hình" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await adminService.updateSystemConfig({
        commissionRate: Number(form.commissionRate),
        defaultDepositAmount: Number(form.defaultDepositAmount),
        antiSnipingWindowSec: Number(form.antiSnipingWindowSec),
        antiSnipingExtensionSec: Number(form.antiSnipingExtensionSec),
      });
      toast({ status: "success", title: "Đã lưu cấu hình" });
      await loadConfig();
    } catch (e) {
      toast({ status: "error", title: "Lưu thất bại" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Heading size="md" mb={4}>
        Cấu hình hệ thống
      </Heading>
      <Box bg="white" _dark={{ bg: "gray.800" }} p={4} borderRadius="md">
        <VStack spacing={4} align="stretch">
          <FormControl>
            <FormLabel>Phí hoa hồng (%)</FormLabel>
            <Input
              type="number"
              name="commissionRate"
              value={form.commissionRate}
              onChange={handleChange}
              min={0}
              step={0.1}
            />
          </FormControl>

          <FormControl>
            <FormLabel>Tiền cọc mặc định (VNĐ)</FormLabel>
            <Input
              type="number"
              name="defaultDepositAmount"
              value={form.defaultDepositAmount}
              onChange={handleChange}
              min={0}
            />
          </FormControl>

          <HStack spacing={4} align="start">
            <FormControl>
              <FormLabel>Anti-sniping window (giây)</FormLabel>
              <Input
                type="number"
                name="antiSnipingWindowSec"
                value={form.antiSnipingWindowSec}
                onChange={handleChange}
                min={0}
              />
            </FormControl>

            <FormControl>
              <FormLabel>Thời gian bù (giây)</FormLabel>
              <Input
                type="number"
                name="antiSnipingExtensionSec"
                value={form.antiSnipingExtensionSec}
                onChange={handleChange}
                min={0}
              />
            </FormControl>
          </HStack>

          <Text fontSize="sm" color="gray.500">
            Cấu hình áp dụng mặc định khi tạo phiên nếu không nhập thủ công.
          </Text>

          <Button colorScheme="red" onClick={handleSave} isLoading={saving}>
            Lưu cấu hình
          </Button>
        </VStack>
      </Box>
      {loading && (
        <Text mt={2} fontSize="sm" color="gray.500">
          Đang tải cấu hình...
        </Text>
      )}
    </Box>
  );
}
