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
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useListStore } from "../store/list.js";
import { usePropertyTypeStore } from "../store/propertyType.js";

const EditListingModal = ({ isOpen, onClose, listing }) => {
  const toast = useToast();
  const updateListing = useListStore((s) => s.updateListing);
  // Property types
  const { propertyTypes, fetchPropertyTypes, loading: loadingTypes, error: errorTypes } = usePropertyTypeStore();
  const [form, setForm] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && listing) {
      // normalize property_type: could be id string or object
      let ptValue = "";
      if (listing.property_type) {
        if (typeof listing.property_type === "string") ptValue = listing.property_type;
        else if (listing.property_type._id) ptValue = listing.property_type._id;
        else if (listing.property_type.id) ptValue = listing.property_type.id;
      }

      setForm({
        title: listing.title || "",
        description: listing.description || "",
        area: listing.area || "",
        price: listing.price || "",
        status: listing.status || "available",
        property_type: ptValue,
        rental_type: listing.rental_type || "rent",
        images: listing.images ? listing.images.join(", ") : "",
        location: {
          province: listing.location?.province || "",
          ward: listing.location?.ward || "",
          detail: listing.location?.detail || "",
        },
      });
    }
  }, [isOpen, listing]);

  useEffect(() => {
    fetchPropertyTypes();
  }, [fetchPropertyTypes]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("location.")) {
      const key = name.split(".")[1];
      setForm((prev) => ({ ...prev, location: { ...prev.location, [key]: value } }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.price || !form.location?.province || !form.location?.detail) {
      toast({ title: "Thiếu thông tin", description: "Vui lòng điền tiêu đề, giá và địa chỉ.", status: "error", isClosable: true });
      return;
    }

    const payload = {
      title: form.title,
      description: form.description,
      area: form.area,
      price: form.price,
      // status intentionally NOT provided here: only admins can change approval status
      property_type: form.property_type,
      rental_type: form.rental_type,
      images: form.images ? form.images.split(",").map(s=>s.trim()).filter(Boolean) : [],
      location: {
        province: form.location.province,
        ward: form.location.ward,
        detail: form.location.detail,
      }
    };

    try {
      setSubmitting(true);
      const res = await updateListing(listing._id, payload);
      if(res.success) {
        toast({ title: "Thành công", description: "Cập nhật bài viết thành công.", status: "success", isClosable: true });
        onClose();
      } else {
        toast({ title: "Lỗi", description: res.message || "Cập nhật thất bại.", status: "error", isClosable: true });
      }
    } catch (err) {
      toast({ title: "Lỗi", description: err.message || "Cập nhật thất bại.", status: "error", isClosable: true });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="lg">
      <ModalOverlay />
      <ModalContent as="form" onSubmit={handleSubmit}>
        <ModalHeader>Chỉnh sửa bài đăng</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <FormControl isRequired>
              <FormLabel>Tiêu đề</FormLabel>
              <Input name="title" value={form.title || ""} onChange={handleChange} />
            </FormControl>

            <FormControl>
              <FormLabel>Mô tả</FormLabel>
              <Textarea name="description" value={form.description || ""} onChange={handleChange} />
            </FormControl>

            <HStack>
              <FormControl>
                <FormLabel>Diện tích (m²)</FormLabel>
                <Input name="area" value={form.area || ""} onChange={handleChange} />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Giá</FormLabel>
                <Input name="price" value={form.price || ""} onChange={handleChange} />
              </FormControl>
            </HStack>

            <HStack>
              <FormControl>
                <FormLabel>Loại tài sản</FormLabel>
                {loadingTypes ? (
                  <Input isReadOnly placeholder="Đang tải..." />
                ) : (
                  <Select name="property_type" value={form.property_type || ""} onChange={handleChange}>
                    <option value="">-- Chọn một loại --</option>
                    {propertyTypes.map((type) => (
                        <option key={type._id} value={type._id}>
                          {type.name}
                        </option>
                      ))
                    }
                  </Select>
                )}
              </FormControl>


              <FormControl>
                <FormLabel>Loại cho thuê</FormLabel>
                <Select name="rental_type" value={form.rental_type || "rent"} onChange={handleChange}>
                  <option value="rent">Cho thuê</option>
                  <option value="sale">Bán</option>
                </Select>
              </FormControl>
            </HStack>

            <FormControl>
              <FormLabel>Ảnh (URLs, cách nhau bằng dấu phẩy)</FormLabel>
              <Input placeholder="https://..., https://..." name="images" value={form.images || ""} onChange={handleChange} />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Thành phố</FormLabel>
              <Input name="location.province" value={form.location?.province || ""} onChange={handleChange} />
            </FormControl>

            <HStack>
              <FormControl>
                <FormLabel>Phường</FormLabel>
                <Input name="location.ward" value={form.location?.ward || ""} onChange={handleChange} />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Địa chỉ chi tiết</FormLabel>
                <Input name="location.detail" value={form.location?.detail || ""} onChange={handleChange} />
              </FormControl>
            </HStack>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button type="submit" colorScheme="blue" isLoading={submitting} mr={3}>
            Lưu
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Hủy
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default EditListingModal;
