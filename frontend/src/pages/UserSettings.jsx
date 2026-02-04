import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Container,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Heading,
  Text,
  VStack,
  FormControl,
  FormLabel,
  Input,
  Button,
  Avatar,
  IconButton,
  Divider,
  useColorModeValue,
  Flex,
  SimpleGrid,
  useToast,
  Spinner,
  Center,
  GridItem,
  Grid,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  PinInput,
  PinInputField,
  HStack,
  useDisclosure,
} from "@chakra-ui/react";
import { FiCamera, FiUser, FiLock, FiHome } from "react-icons/fi";
import { useUserStore } from "../store/user.js";
import PostsNavigationPanel from "../components/PostsNavigationPanel.jsx";
import api from "../lib/axios.js";

const UserSettings = () => {
  const bgCard = useColorModeValue("white", "gray.800");
  const mainBg = useColorModeValue("gray.50", "gray.900");
  const toast = useToast();

  // State lưu thông tin user
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Ref cho input upload ảnh
  const fileInputRef = useRef(null);

  // 1. Fetch dữ liệu user khi trang load
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await useUserStore.getState().getUserInfor();

        if (res.success) {
          setCurrentUser(res.data);
        } else {
          toast({
            title: res.message || "Lỗi tải dữ liệu",
            status: "error",
            duration: 3000,
            isClosable: true,
          });
        }
        setLoading(false);
      } catch (error) {
        console.error(error);
        toast({
          title: "Lỗi tải dữ liệu",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        setLoading(false);
      }
    };
    fetchUser();
  }, [toast]);

  //   // Logic upload avatar (Cơ bản)
  //   const handleAvatarChange = async (e) => {
  //     const file = e.target.files[0];
  //     if (!file) return;

  //     const formData = new FormData();
  //     formData.append("avatar", file);

  //     try {
  //       const token = localStorage.getItem("access_token");
  //       const res = await axios.post(`${API_URL}/user/upload-avatar`, formData, {
  //         headers: {
  //           Authorization: `Bearer ${token}`,
  //           "Content-Type": "multipart/form-data",
  //         },
  //       });

  //       // Cập nhật lại UI ngay lập tức
  //       setCurrentUser({ ...currentUser, avatar: res.data.avatarUrl });
  //       toast({ title: "Cập nhật ảnh đại diện thành công", status: "success" });
  //     } catch (error) {
  //       toast({ title: "Lỗi upload ảnh", status: "error" });
  //     }
  //   };

  if (loading) {
    return (
      <Center minH="100vh">
        <Spinner size="xl" color="blue.500" />
      </Center>
    );
  }

  return (
    <Flex minH="100vh">
      <PostsNavigationPanel />
      <Box flex={1} p={6} bg={mainBg}>
        <Container maxW="container.xl">
          <Heading as="h1" size="lg" textAlign={{ base: "center", md: "left" }}>
            Cài đặt tài khoản
          </Heading>

          <Flex direction={"column"} gap={10} align="start" mt={8}>
            {/* SIDEBAR USER INFO */}
            {/*<Box
              w={{ base: "full", md: "300px" }}
              bg={bgCard}
              p={6}
              rounded="xl"
              shadow="sm"
              textAlign="center"
              border="1px solid"
              borderColor="gray.100"
            >
               <Box position="relative" display="inline-block" mb={4}>
                <Avatar
                  size="2xl"
                  name={currentUser?.name || "User"}
                  src={currentUser?.avatar}
                  mb={2}
                  border="4px solid"
                  borderColor="blue.500"
                />
                {/* Input file ẩn */}
            {/* <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarChange}
                style={{ display: "none" }}
                accept="image/*"
              /> */}
            {/* <IconButton
                aria-label="Upload image"
                icon={<FiCamera />}
                size="sm"
                rounded="full"
                colorScheme="blue"
                position="absolute"
                bottom="5px"
                right="5px"
                shadow="md"
                onClick={() => fileInputRef.current.click()} // Kích hoạt input file
              /> 
              </Box>
              <Heading size="md">{currentUser?.name}</Heading>
              <Text color="gray.500" fontSize="sm">
                {currentUser?.email}
              </Text> 
            </Box>*/}

            {/* MAIN CONTENT */}
            <Box
              flex={1}
              w="full"
              bg={bgCard}
              rounded="xl"
              shadow="sm"
              p={{ base: 4, md: 8 }}
            >
              {/* THÔNG TIN CÁ NHÂN */}
              <ProfileSettings user={currentUser} />
            </Box>

            <Box
              flex={1}
              w="full"
              bg={bgCard}
              rounded="xl"
              shadow="sm"
              p={{ base: 4, md: 8 }}
            >
              <PasswordSettings />

              {/* <Divider />

                <Box>
                  <Heading size="md" mb={4}>
                    Tin đăng của tôi
                  </Heading>
                  <Text color="gray.500">
                    Danh sách tin đăng của bạn (tích hợp API sau).
                  </Text>
                </Box> */}
            </Box>
          </Flex>
        </Container>
      </Box>
    </Flex>
  );
};

// --- COMPONENT LOGIC: PROFILE SETTINGS ---
const ProfileSettings = () => {
  const bgPage = useColorModeValue("gray.50", "gray.900");
  const { user, changeAvatar, loading } = useUserStore();
  const [isUpdating, setIsUpdating] = useState(false);
  const toast = useToast();

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        phone: user.phone || "",
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async () => {
    setIsUpdating(true);
    try {
      await api.put("/users/update", formData); // Cần đảm bảo backend có route này

      // Update store bằng cách fetch lại info
      useUserStore.getState().getUserInfor();

      toast({
        title: "Cập nhật thành công",
        status: "success",
        duration: 3000,
      });
      setIsUpdating(false);
    } catch (error) {
      toast({
        title: "Cập nhật thất bại",
        description: error.response?.data?.message || "Lỗi server",
        status: "error",
      });
      setIsUpdating(false);
    }
  };
  const handleChangeAvatar = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      // validate size (ví dụ < 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "Ảnh quá lớn",
          description: "Vui lòng chọn ảnh nhỏ hơn 2MB",
          status: "error",
        });
        return;
      }

      const reader = new FileReader();

      reader.onloadend = async () => {
        try {
          await changeAvatar(reader.result); // base64
          toast({
            title: "Cập nhật avatar thành công",
            status: "success",
          });
        } catch (err) {
          toast({
            title: "Cập nhật avatar thất bại",
            description: err?.message || "Có lỗi xảy ra",
            status: "error",
          });
        }
      };

      reader.readAsDataURL(file);
    };

    input.click();
  };

  return (
    <VStack spacing={6} align="stretch">
      <Heading size="md">Thông tin hồ sơ</Heading>
      <Divider />

      <SimpleGrid
        columns={{ base: 1, lg: 2 }}
        spacing={8}
        w="full"
        alignItems="start"
      >
        {/* AVATAR */}
        <GridItem
          order={{ base: 1, lg: 2 }}
          display="flex"
          justifyContent="center"
          alignItems="center"
        >
          <VStack spacing={4}>
            <Box position="relative">
              <Avatar
                size="3xl"
                name={user?.name}
                src={
                  user?.avatar ? `${user.avatar}?t=${Date.now()}` : undefined
                }
              />

              {/* ICON ĐỔI AVATAR */}
              <IconButton
                aria-label="Đổi ảnh đại diện"
                icon={<FiCamera />}
                size="lg"
                colorScheme="blue"
                position="absolute"
                bottom="0"
                right="0"
                borderRadius="full"
                onClick={handleChangeAvatar}
                isLoading={loading}
              />
            </Box>

            <Text fontSize="sm" color="gray.500">
              Ảnh đại diện
            </Text>
          </VStack>
        </GridItem>

        {/* FORM */}
        <GridItem order={{ base: 2, lg: 1 }}>
          <VStack spacing={6} align="stretch">
            <FormControl>
              <FormLabel>Họ và tên</FormLabel>
              <Input
                id="name"
                value={formData.name}
                onChange={handleChange}
                focusBorderColor="blue.500"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Số điện thoại</FormLabel>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                focusBorderColor="blue.500"
                placeholder="Chưa cập nhật"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Email</FormLabel>
              <Input
                value={user?.email}
                isReadOnly
                bg={bgPage}
                color="gray.500"
                cursor="not-allowed"
              />
              <Text fontSize="xs" color="gray.500" mt={1}>
                Email dùng để đăng nhập, không thể thay đổi.
              </Text>
            </FormControl>

            <Button
              colorScheme="blue"
              mt={2}
              onClick={handleSubmit}
              isLoading={isUpdating}
              loadingText="Đang lưu..."
              alignSelf="flex-start"
            >
              Lưu thay đổi
            </Button>
          </VStack>
        </GridItem>
      </SimpleGrid>
    </VStack>
  );
};

// --- COMPONENT LOGIC: PASSWORD SETTINGS ---
const PasswordSettings = () => {
  const { requestChangePassword, confirmChangePassword } = useUserStore();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [passData, setPassData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setPassData({ ...passData, [e.target.id]: e.target.value });
  };

  const handleRequestStep = async () => {
    if (!passData.currentPassword || !passData.newPassword) {
      toast({ title: "Vui lòng nhập đủ thông tin", status: "warning" });
      return;
    }
    if (passData.newPassword !== passData.confirmPassword) {
      toast({ title: "Mật khẩu mới không khớp", status: "error" });
      return;
    }
    if (passData.newPassword.length < 6) {
      toast({ title: "Mật khẩu phải trên 6 ký tự", status: "warning" });
      return;
    }

    setLoading(true);
    const res = await requestChangePassword(passData.currentPassword);
    setLoading(false);

    if (res.success) {
      onOpen(); // Mở Modal nhập OTP
      toast({
        title: "Đã gửi mã xác nhận",
        description: "Vui lòng kiểm tra email của bạn",
        status: "info",
      });
    } else {
      toast({ title: "Lỗi", description: res.message, status: "error" });
    }
  };

  const handleConfirmStep = async () => {
    if (!code || code.length < 6) {
      toast({ title: "Vui lòng nhập mã xác thực", status: "warning" });
      return;
    }

    setLoading(true);
    // Gửi code và password mới (pass cũ đã check ở bước 1)
    const res = await confirmChangePassword(code, passData.newPassword);
    setLoading(false);

    if (res.success) {
      toast({ title: "Đổi mật khẩu thành công!", status: "success" });
      onClose(); // Đóng modal
      setPassData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }); // Reset form
      setCode("");
    } else {
      toast({ title: "Thất bại", description: res.message, status: "error" });
    }
  };

  // return (
  //   <VStack spacing={6} align="start">
  //     <Heading size="md">Đổi mật khẩu</Heading>
  //     <Divider />

  //     <FormControl>
  //       <FormLabel>Mật khẩu hiện tại</FormLabel>
  //       <Input
  //         id="currentPassword"
  //         type="password"
  //         value={passData.currentPassword}
  //         onChange={handleChange}
  //         focusBorderColor="blue.500"
  //       />
  //     </FormControl>

  //     <FormControl>
  //       <FormLabel>Mật khẩu mới</FormLabel>
  //       <Input
  //         id="newPassword"
  //         type="password"
  //         value={passData.newPassword}
  //         onChange={handleChange}
  //         focusBorderColor="blue.500"
  //       />
  //     </FormControl>

  //     <FormControl>
  //       <FormLabel>Xác nhận mật khẩu mới</FormLabel>
  //       <Input
  //         id="confirmPassword"
  //         type="password"
  //         value={passData.confirmPassword}
  //         onChange={handleChange}
  //         focusBorderColor="blue.500"
  //       />
  //     </FormControl>

  //     <Button
  //       colorScheme="blue"
  //       onClick={handleChangePassword}
  //       isLoading={loading}
  //     >
  //       Cập nhật mật khẩu
  //     </Button>
  //   </VStack>
  // );

  return (
    <VStack spacing={6} align="start">
      <Heading size="md">Đổi mật khẩu</Heading>
      <Divider />

      <FormControl>
        <FormLabel>Mật khẩu hiện tại</FormLabel>
        <Input
          id="currentPassword"
          type="password"
          value={passData.currentPassword}
          onChange={handleChange}
          focusBorderColor="blue.500"
        />
      </FormControl>

      <FormControl>
        <FormLabel>Mật khẩu mới</FormLabel>
        <Input
          id="newPassword"
          type="password"
          value={passData.newPassword}
          onChange={handleChange}
          focusBorderColor="blue.500"
        />
      </FormControl>

      <FormControl>
        <FormLabel>Xác nhận mật khẩu mới</FormLabel>
        <Input
          id="confirmPassword"
          type="password"
          value={passData.confirmPassword}
          onChange={handleChange}
          focusBorderColor="blue.500"
        />
      </FormControl>

      <Button
        colorScheme="blue"
        onClick={handleRequestStep}
        isLoading={loading}
      >
        Tiếp tục
      </Button>

      {/* --- MODAL NHẬP OTP --- */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered closeOnOverlayClick={false}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Xác thực bảo mật</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <Text textAlign="center">
                Chúng tôi đã gửi mã xác thực tới email của bạn. Vui lòng nhập mã đó để hoàn tất việc đổi mật khẩu.
              </Text>
              
              <HStack justify="center">
                <PinInput 
                  otp 
                  value={code} 
                  onChange={(value) => setCode(value)}
                  size="lg"
                  focusBorderColor="blue.500"
                >
                  <PinInputField />
                  <PinInputField />
                  <PinInputField />
                  <PinInputField />
                  <PinInputField />
                  <PinInputField />
                </PinInput>
              </HStack>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Hủy
            </Button>
            <Button colorScheme="blue" onClick={handleConfirmStep} isLoading={loading}>
              Xác nhận đổi
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
};

export default UserSettings;
