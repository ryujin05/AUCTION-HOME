import {
  Button,
  FormControl,
  FormLabel,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  VStack,
  Textarea,
  Select,
  HStack,
  useToast,
  Spinner,
  Text,
  Box,
  Image,
  IconButton,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  useColorModeValue,
} from "@chakra-ui/react";
import { FiX } from "react-icons/fi";
import { useEffect, useState } from "react";
import { useListStore } from "../store/list.js";
import { usePropertyTypeStore } from "../store/propertyType.js";
import MapboxMap from "../components/MapboxMap.jsx";
import { VIETNAM_PROVINCES } from "../data/provinces.js";

const CreateListingModal = ({ isOpen, onClose, defaultValues = {} }) => {
  const toast = useToast();
  const createListing = useListStore((s) => s.createListing);
  const updateListing = useListStore((s) => s.updateListing);
  const isEdit = Boolean(defaultValues?._id);

  //Load Property Types
  const {
    propertyTypes,
    loading: loadingTypes,
    error: errorTypes,
    fetchPropertyTypes,
  } = usePropertyTypeStore();

  const toDateTimeLocal = (value) => {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    const tzOffset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
  };

  useEffect(() => {
    fetchPropertyTypes();
  }, [fetchPropertyTypes]);

  // --- CẬP NHẬT: Thêm bedroom, bathroom vào state ---
  const [form, setForm] = useState({
    title: "",
    description: "",
    area: "",
    price: "",
    startTime: "",
    endTime: "",
    status: "approved",
    property_type: "",
    rental_type: "rent",
    bedroom: 0, // Mới
    bathroom: 0, // Mới
    images: [],
    location: {
      province: "",
      ward: "",
      detail: "",
      longitude: "",
      latitude: "",
    },
  });

  const [submitting, setSubmitting] = useState(false);

  //Merge defaultValues an toàn
  useEffect(() => {
    if (isOpen) {
      const existingCoords = defaultValues.location?.coords?.coordinates;

      setForm((prev) => ({
        ...prev,
        ...defaultValues,
        startTime: toDateTimeLocal(defaultValues.startTime),
        endTime: toDateTimeLocal(defaultValues.endTime),
        property_type:
          typeof defaultValues.property_type === "object"
            ? defaultValues.property_type._id
            : defaultValues.property_type || "",
        // --- CẬP NHẬT: Load bedroom/bathroom từ defaultValues nếu có ---
        bedroom: defaultValues.bedroom || 0,
        bathroom: defaultValues.bathroom || 0,
        // ----------------------------------------------------------------
        images: defaultValues.images || [],
        location: {
          ...prev.location,
          ...(defaultValues.location || {}),
          longitude: existingCoords ? existingCoords[0] : "",
          latitude: existingCoords ? existingCoords[1] : "",
        },
      }));
    }
  }, [isOpen, JSON.stringify(defaultValues)]);

  // Handle input thường
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name.startsWith("location.")) {
      const key = name.split(".")[1];
      setForm((prev) => ({
        ...prev,
        location: { ...prev.location, [key]: value },
      }));
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Handle input số (cho number input của chakra)
  const handleNumberChange = (name, valueString) => {
    setForm((prev) => ({
      ...prev,
      [name]: Number(valueString),
    }));
  };

  const handleLocationSelect = (lng, lat, address) => {
    setForm((prev) => ({
      ...prev,
      location: {
        ...prev.location,
        longitude: lng,
        latitude: lat,
      },
    }));
  };

  const handleImagesChange = async (e) => {
    const files = Array.from(e.target.files);

    const toBase64 = (file) =>
      new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });

    const base64Images = await Promise.all(files.map((file) => toBase64(file)));

    setForm((prev) => ({
      ...prev,
      images: [...prev.images, ...base64Images],
    }));
  };

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !form.title ||
      !form.price ||
      !form.location.province ||
      !form.location.detail
    ) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng điền tiêu đề, giá và địa chỉ.",
        status: "error",
        isClosable: true,
      });
      return;
    }

    if (!form.location.longitude || !form.location.latitude) {
      toast({
        title: "Thiếu vị trí bản đồ",
        description: "Vui lòng chọn vị trí trên bản đồ",
        status: "warning",
        isClosable: true,
      });
      return;
    }

    if (!form.property_type) {
      toast({
        title: "Thiếu loại tài sản",
        description: "Bạn phải chọn loại tài sản.",
        status: "error",
      });
      return;
    }

    // --- CẬP NHẬT: Thêm bedroom, bathroom vào payload ---
    const payload = {
      title: form.title,
      description: form.description,
      area: form.area,
      price: form.price,
      startTime: form.startTime || undefined,
      endTime: form.endTime || undefined,
      status: form.status,
      property_type: form.property_type,
      rental_type: form.rental_type,
      bedroom: form.bedroom, // Mới
      bathroom: form.bathroom, // Mới
      images: form.images,
      location: {
        province: form.location.province,
        ward: form.location.ward,
        detail: form.location.detail,
        longitude: form.location.longitude,
        latitude: form.location.latitude,
      },
    };

    try {
      setSubmitting(true);
      let res;

      if (isEdit) {
        res = await updateListing(defaultValues._id, payload);
      } else {
        res = await createListing(payload);
      }

      if (res.success) {
        toast({
          title: isEdit ? "Cập nhật thành công" : "Tạo bài đăng thành công",
          description: isEdit ? "Thao tác thành công." : "Phiên đấu giá đã được mở ngay.",
          status: "success",
        });

        onClose();
        // Reset form
        setForm({
          title: "",
          description: "",
          area: "",
          price: "",
          startTime: "",
          endTime: "",
          status: "approved",
          property_type: "",
          rental_type: "rent",
          bedroom: 0,
          bathroom: 0,
          images: [],
          location: {
            province: "",
            ward: "",
            detail: "",
            longitude: "",
            latitude: "",
          },
        });
      } else {
        toast({
          title: "Lỗi",
          description: res.message || "Thao tác thất bại.",
          status: "error",
        });
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: error.message || "Thao tác thất bại.",
        status: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const removeImage = (index) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const getInitialCoords = () => {
    if (form.location.longitude && form.location.latitude) {
      return [
        parseFloat(form.location.longitude),
        parseFloat(form.location.latitude),
      ];
    }
    return [105.854444, 21.028511];
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="xl">
      <ModalOverlay />
      <ModalContent as="form" onSubmit={handleSubmit}>
        <ModalHeader>
          {isEdit ? "Cập nhật bài đăng" : "Tạo bài đăng mới"}
        </ModalHeader>
        <ModalCloseButton />

        <ModalBody>
          <VStack spacing={4} align="stretch" borderTop="2px solid" borderColor={useColorModeValue("gray.200", "gray.600")} pt={4}>
            {/* Tiêu đề */}
            <FormControl isRequired>
              <Text fontWeight="bold" mb={3} color={useColorModeValue("blue.500", "blue.100")}>
                Thông tin cơ bản
              </Text>
              <FormLabel>Tiêu đề</FormLabel>
              <Input
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="VD: Bán nhà mặt phố..."
              />
            </FormControl>

            {/* Mô tả */}
            <FormControl>
              <FormLabel>Mô tả chi tiết</FormLabel>
              <Textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Mô tả về tiện ích, hướng nhà..."
                rows={4}
              />
            </FormControl>

            {/* HÀNG 1: Giá & Diện tích */}
            <HStack>
              <FormControl isRequired width="50%">
                <FormLabel>Giá (VNĐ)</FormLabel>
                <Input
                  name="price"
                  type="number"
                  value={form.price}
                  onChange={handleChange}
                  placeholder="Nhập số tiền..."
                />
              </FormControl>

              <FormControl isRequired width="50%">
                <FormLabel>Diện tích (m²)</FormLabel>
                <Input
                  name="area"
                  type="number"
                  value={form.area}
                  onChange={handleChange}
                  placeholder="Nhập số..."
                />
              </FormControl>
            </HStack>

            <FormControl>
              <FormLabel>Thời gian bắt đầu đấu giá</FormLabel>
              <Input
                name="startTime"
                type="datetime-local"
                value={form.startTime}
                onChange={handleChange}
              />
              <Text fontSize="xs" color="gray.500" mt={1}>
                Để trống sẽ bắt đầu ngay.
              </Text>
            </FormControl>

            <FormControl>
              <FormLabel>Thời gian kết thúc đấu giá</FormLabel>
              <Input
                name="endTime"
                type="datetime-local"
                value={form.endTime}
                onChange={handleChange}
              />
              <Text fontSize="xs" color="gray.500" mt={1}>
                Để trống sẽ mặc định +7 ngày kể từ lúc tạo.
              </Text>
            </FormControl>

            {/* --- CẬP NHẬT: HÀNG 2: Phòng ngủ & Phòng tắm --- */}
            <HStack>
              <FormControl width="50%">
                <FormLabel>Phòng ngủ</FormLabel>
                <NumberInput
                  min={0}
                  value={form.bedroom}
                  onChange={(str) => handleNumberChange("bedroom", str)}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>

              <FormControl width="50%">
                <FormLabel>Phòng tắm</FormLabel>
                <NumberInput
                  min={0}
                  value={form.bathroom}
                  onChange={(str) => handleNumberChange("bathroom", str)}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>
            </HStack>
            {/* ------------------------------------------------ */}

            {/* Loại tài sản & rental type */}
            <HStack>
              <FormControl isRequired>
                <FormLabel>Loại tài sản</FormLabel>
                {loadingTypes ? (
                  <Spinner size="sm" />
                ) : errorTypes ? (
                  <Text color="red.400" fontSize="sm">
                    Lỗi tải loại BĐS
                  </Text>
                ) : (
                  <Select
                    name="property_type"
                    value={form.property_type}
                    onChange={handleChange}
                  >
                    <option value="">-- Chọn loại --</option>
                    {propertyTypes.map((type) => (
                      <option key={type._id} value={type._id}>
                        {type.name}
                      </option>
                    ))}
                  </Select>
                )}
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Hình thức</FormLabel>
                <Select
                  name="rental_type"
                  value={form.rental_type}
                  onChange={handleChange}
                >
                  <option value="rent">Cho thuê</option>
                  <option value="sell">Bán</option>
                </Select>
              </FormControl>
            </HStack>

            {/* Ảnh */}
            <FormControl isRequired>
              <HStack justify="space-between" mb={2}>
                <FormLabel m={0}>Hình ảnh</FormLabel>
                <Button
                  as="label"
                  htmlFor="images-upload"
                  colorScheme="teal"
                  size="xs"
                  cursor="pointer"
                  variant="outline"
                >
                  + Thêm ảnh
                </Button>
              </HStack>

              <Input
                id="images-upload"
                type="file"
                accept="image/*"
                multiple
                onChange={handleImagesChange}
                display={"none"}
              />

              {form.images.length > 0 ? (
                <Box mt={2} display="flex" gap={2} flexWrap="wrap">
                  {form.images.map((img, idx) => (
                    <Box
                      key={idx}
                      position="relative"
                      boxSize="70px"
                      borderRadius="md"
                      overflow="hidden"
                      border="1px solid"
                      borderColor="gray.200"
                    >
                      <Image
                        src={typeof img === "string" ? img : img.url}
                        alt={`image-${idx}`}
                        boxSize="100%"
                        objectFit="cover"
                      />
                      <IconButton
                        icon={<FiX />}
                        size="xs"
                        aria-label="remove"
                        position="absolute"
                        top="2px"
                        right="2px"
                        borderRadius="full"
                        colorScheme="red"
                        onClick={() => removeImage(idx)}
                      />
                    </Box>
                  ))}
                </Box>
              ) : (
                <Text fontSize="sm" color="gray.400" fontStyle="italic">
                  Chưa có ảnh nào được chọn
                </Text>
              )}
            </FormControl>

            {/* --- PHẦN ĐỊA CHỈ & BẢN ĐỒ --- */}
            <Box borderTop="2px solid" borderColor={useColorModeValue("gray.200", "gray.600")} pt={4}>
              <Text fontWeight="bold" mb={3} color={useColorModeValue("blue.500", "blue.100")}>
                Địa chỉ & Vị trí
              </Text>

              <HStack mb={3}>
                <FormControl isRequired>
                  <FormLabel>Tỉnh / Thành phố</FormLabel>
                  <Input
                    name="location.province"
                    value={form.location.province}
                    onChange={handleChange}
                    placeholder="Hà Nội"
                    list="location-suggestions"
                    sx={{
                      "&::-webkit-calendar-picker-indicator": {
                        cursor: "pointer",
                        opacity: 1,
                        position: "absolute", 
                        right: "-5px", 
                        top: "50%", 
                        transform: "translateY(-75%)", 
                        width: "20px", 
                        height: "20px",
                      },
                      position: "relative", // Đảm bảo input là mốc tọa độ
                    }}
                  />
                  <datalist id="location-suggestions">
                    {VIETNAM_PROVINCES.map((prov) => (
                      <option key={prov} value={prov} />
                    ))}
                  </datalist>
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Phường / Xã</FormLabel>
                  <Input
                    name="location.ward"
                    value={form.location.ward}
                    onChange={handleChange}
                    placeholder="Hai Bà Trưng"
                  />
                </FormControl>
              </HStack>

              <FormControl isRequired mb={3}>
                <FormLabel>
                  Địa chỉ chi tiết (Số nhà, đường)
                </FormLabel>
                <Input
                  name="location.detail"
                  value={form.location.detail}
                  onChange={handleChange}
                  placeholder="Số 10, ngõ 5..."
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Ghim vị trí trên bản đồ{""}</FormLabel>

                {isOpen && (
                  <MapboxMap
                    mode="picker"
                    initialCoords={getInitialCoords()}
                    onLocationSelect={handleLocationSelect}
                    height="300px"
                  />
                )}

                <Text
                  fontSize="xs"
                  mt={2}
                  color={form.location.latitude ? "green.600" : "red.500"}
                >
                  {form.location.latitude
                    ? `✓ Đã chọn: ${parseFloat(form.location.latitude).toFixed(
                        5
                      )}, ${parseFloat(form.location.longitude).toFixed(5)}`
                    : "• Vui lòng click vào bản đồ để chọn vị trí chính xác"}
                </Text>
              </FormControl>
            </Box>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Hủy
          </Button>
          <Button
            type="submit"
            colorScheme="blue"
            isLoading={submitting}
            loadingText={isEdit ? "Đang cập nhật..." : "Đang đăng..."}
          >
            {isEdit ? "Lưu thay đổi" : "Đăng tin ngay"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CreateListingModal;
