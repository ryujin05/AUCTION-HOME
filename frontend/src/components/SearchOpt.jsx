import { useState, useEffect, useRef } from "react";
import {
  Box,
  VStack,
  Heading,
  Input,
  Button,
  Select,
  useColorModeValue,
  HStack,
  Icon,
  Spinner,
  Text,
} from "@chakra-ui/react";
import { useSearchParams } from "react-router-dom"; // Hook quan trọng
import { FiRotateCcw } from "react-icons/fi"; // Icon reset
import { usePropertyTypeStore } from "../store/propertyType.js";
import { VIETNAM_PROVINCES } from "../data/provinces.js";

const SearchOpt = () => {
  // 1. Hook để đọc và ghi URL
  const [searchParams, setSearchParams] = useSearchParams();

  // // 2. State quản lý các ô input
  // const [filters, setFilters] = useState({
  //   keyword: "",
  //   province: "",
  //   property_type: "",
  //   bedroom: "",
  //   garage: "",
  // });

  // 2. State input
  const [filters, setFilters] = useState({
    keyword: searchParams.get("keyword") || "",
    province: searchParams.get("province") || "",
    property_type: searchParams.get("property_type") || "",
    bedroom: searchParams.get("bedroom") || "",
    bathroom: searchParams.get("bathroom") || "",
    auctionStatus: searchParams.get("auctionStatus") || "",
  });

  const isFirstRender = useRef(true);

  // UI Colors
  const contentBg = useColorModeValue("gray.800", "white");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const bgColor = useColorModeValue("gray.50", "gray.700");
  //Load Property Types
  const {
    propertyTypes,
    loading: loadingTypes,
    error: errorTypes,
    fetchPropertyTypes,
  } = usePropertyTypeStore();

  useEffect(() => {
    fetchPropertyTypes();
  }, [fetchPropertyTypes]);

  // 3. Effect: Khi URL thay đổi (hoặc mới vào trang), điền giá trị từ URL vào ô input
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    // setFilters({
    //   keyword: searchParams.get("keyword") || "",
    //   province: searchParams.get("province") || "",
    //   property_type: searchParams.get("property_type") || "",
    //   bedroom: searchParams.get("bedroom") || "",
    //   garage: searchParams.get("garage") || "",
    // });

    const timer = setTimeout(() => {
      // 1. Lọc bỏ các giá trị rỗng
      const cleanParams = {};
      Object.keys(filters).forEach((key) => {
        if (filters[key]) {
          cleanParams[key] = filters[key];
        }
      });

      const newFilters = {};
      Object.keys(filters).forEach((key) => {
        if (filters[key]) {
          newFilters[key] = filters[key];
        }
      });

      const currentSort = searchParams.get("sort");
      const currentAuctionStatus = searchParams.get("auctionStatus");

      const finalParams = { ...newFilters };

      if (currentSort) {
        finalParams.sort = currentSort;
      }
      
      if (currentAuctionStatus) {
        finalParams.auctionStatus = currentAuctionStatus;
      }

      // 2. Đẩy lên URL -> AllListings.jsx sẽ tự bắt và fetch lại
      setSearchParams(finalParams);
    }, 500); // Chờ 500ms sau khi ngừng thao tác mới update URL

    // Dọn dẹp timer cũ nếu người dùng thao tác tiếp (tránh update liên tục)
    return () => clearTimeout(timer);
  }, [filters, setSearchParams, searchParams]);

  // 4. Hàm xử lý khi người dùng nhập liệu
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  // 5. Hàm xử lý nút "Tìm kiếm" -> Đẩy lên URL
  const handleSearch = () => {
    // Lọc bỏ các giá trị rỗng để URL gọn gàng
    const cleanParams = {};
    Object.keys(filters).forEach((key) => {
      if (filters[key]) {
        cleanParams[key] = filters[key];
      }
    });

    // Cập nhật URL -> AllListings.jsx sẽ tự bắt sự kiện này và fetch lại API
    setSearchParams(cleanParams);
  };

  // 6. Hàm Reset bộ lọc
  const handleReset = () => {
    setFilters({
      keyword: "",
      province: "",
      property_type: "",
      bedroom: "",
      bathroom: "",
      auctionStatus: "",
    });
    setSearchParams({}); // Xóa hết params trên URL
  };

  return (
    <Box
      bg={bgColor}
      p={6}
      borderRadius="lg"
      border="1px solid"
      borderColor={borderColor}
      shadow="md"
      w="full"
      maxW="400px"
    >
      <HStack justify="space-between" mb={6}>
        <Heading as="h3" size="md" color={contentBg}>
          Bộ lọc phiên đấu giá
        </Heading>
        {/* Nút Reset nhỏ */}
        <Button
          size="xs"
          variant="ghost"
          leftIcon={<Icon as={FiRotateCcw} />}
          onClick={handleReset}
          color="red.500"
        >
          Đặt lại
        </Button>
      </HStack>

      <VStack spacing={4} align="stretch">
        <Input
          name="keyword" // Quan trọng: name phải khớp với key trong state
          value={filters.keyword}
          onChange={handleChange}
          placeholder="Nhập từ khóa căn hộ..."
          size="md"
          bg={bgColor}
          autoFocus={false} // autofocus giúp trải nghiệm tốt hơn khi gõ
        />

        <Box>
          <Input
            name="province"
            value={filters.province}
            onChange={handleChange}
            placeholder="Nhập Tỉnh, Thành phố..."
            list="location-suggestions"
            bg={bgColor}
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

          {/* Render danh sách tự động từ Array */}
          <datalist id="location-suggestions">
            {VIETNAM_PROVINCES.map((prov) => (
              <option key={prov} value={prov} />
            ))}
          </datalist>
        </Box>

        {loadingTypes ? (
          <Spinner size="sm" />
        ) : errorTypes ? (
          <Text color="red.400" fontSize="sm">
            Lỗi tải loại BĐS
          </Text>
        ) : (
          <>
            <Select
              name="property_type"
              onChange={handleChange}
              value={filters.property_type}
              bg={bgColor}
            >
              <option value="">-- Chọn loại --</option>
              {propertyTypes.map((type) => (
                <option key={type._id} value={type._id}>
                  {type.name}
                </option>
              ))}
            </Select>

            <Select
              name="auctionStatus"
              value={filters.auctionStatus}
              onChange={handleChange}
              placeholder="Trạng thái phiên"
              bg={bgColor}
            >
              <option value="live">Đang đấu giá</option>
              <option value="scheduled">Đang diễn ra</option>
              <option value="ended">Kết thúc</option>
            </Select>
          </>
        )}

        <Select
          name="bedroom"
          value={filters.bedroom}
          onChange={handleChange}
          placeholder="Số phòng ngủ"
          bg={bgColor}
        >
          <option value="1">1+ phòng ngủ</option>
          <option value="2">2+ phòng ngủ</option>
          <option value="3">3+ phòng ngủ</option>
          <option value="4">4+ phòng ngủ</option>
        </Select>

        <Select
          name="bathroom"
          value={filters.bathroom}
          onChange={handleChange}
          placeholder="Số phòng tắm"
          bg={bgColor}
        >
          <option value="1">1+ phòng tắm</option>
          <option value="2">2+ phòng tắm</option>
          <option value="3">3+ phòng tắm</option>
          <option value="4">4+ phòng tắm</option>
        </Select>

        <Button
          colorScheme="red"
          size="md"
          w="full"
          onClick={handleSearch}
          _hover={{ bg: "red.600" }}
        >
          Áp dụng bộ lọc
        </Button>
      </VStack>
    </Box>
  );
};

export default SearchOpt;
