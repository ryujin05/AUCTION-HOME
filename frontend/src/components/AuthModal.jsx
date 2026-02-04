import {
  Button,
  FormControl,
  FormLabel,
  HStack,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  VStack,
  Text,
  Divider,
  useToast,
  InputGroup,
  InputRightElement,
  IconButton,
  Flex,
  PinInput,
  PinInputField,
  Center,
} from "@chakra-ui/react";
import { useEffect, useState, useRef } from "react";
import { useUserStore } from "../store/user.js";
import { useAuthContext } from "../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { FaEye, FaEyeSlash } from "react-icons/fa6";
import { ArrowBackIcon } from "@chakra-ui/icons";

const AuthModal = ({ isOpen, onClose, defaultMode = "login" }) => {
  const [mode, setMode] = useState(defaultMode);
  // Các steps: 'form' | 'verify' (đăng ký) | 'forgot' | 'reset-code' | 'reset-password'
  const [step, setStep] = useState("form");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // State form data
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    name: "",
    email: "",
    phone: "",
    code: "",
    role: "guest",
    type: "login",
  });

  const toast = useToast();
  const { registerUser, loginUser, loading, requestLoginGoogle } =
    useUserStore();
  const { updateUser } = useAuthContext();
  const navigate = useNavigate();

  // Reset form khi mở modal
  useEffect(() => {
    if (isOpen) {
      setMode(defaultMode || "login");
      setFormData({
        username: "",
        password: "",
        confirmPassword: "",
        name: "",
        email: "",
        phone: "",
        code: "",
        role: "guest",
        type: "login",
      });
      setStep("form");
    }
  }, [isOpen, defaultMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle PinInput Change (OTP)
  const handleCodeChange = (value) => {
    setFormData((prev) => ({ ...prev, code: value }));
  };

  // --- SUBMIT LOGIN / REGISTER ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    // Chỉ xử lý submit form chính ở đây
    if (step !== "form") return;

    if (mode === "login") {
      const { success, message, user } = await loginUser(formData);
      if (!success) {
        toast({
          title: "Đăng nhập thất bại",
          description: "Email hoặc Mật khẩu không đúng",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      } else {
        toast({
          title: "Chào mừng trở lại!",
          description: message,
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        if (user) updateUser(user);
        if (user?.role === "admin") navigate("/admin");
        onClose();
      }
    } else {
      // REGISTER
      if (formData.password !== formData.confirmPassword) {
        return toast({ title: "Mật khẩu không khớp", status: "error" });
      }
      if (formData.password.length < 6) {
        return toast({
          title: "Mật khẩu quá ngắn",
          description: "Tối thiểu 6 ký tự",
          status: "warning",
        });
      }
      if (!formData.email.includes("@")) {
        return toast({ title: "Email không hợp lệ", status: "warning" });
      }

      const { success, message, user, verificationRequired } =
        await registerUser(formData);

      if (!success) {
        toast({
          title: "Đăng ký thất bại",
          description: message,
          status: "error",
        });
      } else if (verificationRequired) {
        toast({
          title: "Kiểm tra email",
          description: message,
          status: "info",
          duration: 4000,
        });
        setStep("verify"); // Chuyển sang nhập OTP đăng ký
      } else {
        toast({ title: "Thành công", status: "success" });
        if (user) updateUser(user);
        onClose();
      }
    }
  };

  // --- VERIFY EMAIL (REGISTRATION) ---
  const handleVerify = async () => {
    const res = await useUserStore
      .getState()
      .verifyEmail(formData.email, formData.code);
    if (!res.success) {
      toast({
        title: "Xác thực thất bại",
        description: res.message,
        status: "error",
      });
      return;
    }
    toast({
      title: "Xác thực thành công",
      description: res.message,
      status: "success",
    });
    if (res.user) updateUser(res.user);
    onClose();
  };

  // --- FORGOT PASSWORD FLOW ---

  // 1. Gửi Email -> Chuyển sang nhập Code
  const handleSendReset = async () => {
    const res = await useUserStore.getState().sendResetCode(formData.email);
    if (!res.success)
      return toast({
        title: "Gửi thất bại",
        description: res.message,
        status: "error",
      });

    toast({
      title: "Đã gửi mã đặt lại",
      description: res.message,
      status: "success",
    });
    // Reset code cũ để người dùng nhập mới
    setFormData((prev) => ({ ...prev, code: "" }));
    setStep("reset-code");
  };

  // 2. Kiểm tra Code (UI Only) -> Chuyển sang nhập Password
  const handleValidateResetCode = () => {
    if (!formData.code || formData.code.length < 6) {
      return toast({
        title: "Vui lòng nhập đủ mã xác thực",
        status: "warning",
      });
    }
    // Chuyển bước
    setStep("reset-password");
  };

  // 3. Submit Đổi mật khẩu
  const handleResetPassword = async () => {
    if (formData.password !== formData.confirmPassword) {
      return toast({ title: "Mật khẩu không khớp", status: "error" });
    }
    const res = await useUserStore
      .getState()
      .resetPasswordWithCode(formData.email, formData.code, formData.password);

    if (!res.success) {
      // Nếu lỗi code sai, có thể quay lại bước nhập code
      if (res.message && res.message.toLowerCase().includes("mã")) {
        toast({ title: "Mã xác thực không đúng", status: "error" });
        setStep("reset-code");
        return;
      }
      return toast({
        title: "Thất bại",
        description: res.message,
        status: "error",
      });
    }

    toast({ title: "Thành công", description: res.message, status: "success" });
    onClose();
  };

  const handleResend = async () => {
    const res = await useUserStore
      .getState()
      .resendVerification(formData.email);
    toast({
      title: res.success ? "Đã gửi lại mã" : "Gửi thất bại",
      description: res.message,
      status: res.success ? "success" : "error",
    });
  };

  // Google Login Handler
  const handleSuccess = async (response) => {
    const { credential } = response;
    try {
      const { success, message, user } = await requestLoginGoogle(credential);
      if (!success) {
        toast({ title: "Đăng nhập thất bại", status: "error" });
      } else {
        toast({
          title: "Chào mừng trở lại!",
          description: message,
          status: "success",
        });
        if (user) updateUser(user);
        if (user?.role === "admin") navigate("/admin");
        onClose();
      }
    } catch (error) {
      console.error("Login Failed", error);
    }
  };

  const getTitle = () => {
    if (step === "verify") return "Xác thực đăng ký";
    if (step === "forgot") return "Quên mật khẩu";
    if (step === "reset-code") return "Nhập mã xác thực";
    if (step === "reset-password") return "Đặt lại mật khẩu";
    return mode === "login" ? "Đăng nhập" : "Tạo tài khoản mới";
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="md">
      <ModalOverlay />
      <ModalContent as="form" onSubmit={handleSubmit}>
        <ModalHeader textAlign="center">{getTitle()}</ModalHeader>
        <ModalCloseButton />

        <ModalBody pb={6}>
          <VStack spacing={4}>
            {/* === STEP 1: FORM LOGIN / REGISTER === */}
            {step === "form" && (
              <>
                <FormControl isRequired>
                  <FormLabel>Email</FormLabel>
                  <Input
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="example@gmail.com"
                  />
                </FormControl>

                <FormControl isRequired>
                  <Flex justify="space-between" align="center" mb={1}>
                    <FormLabel mb="0">Mật khẩu</FormLabel>
                    {mode === "login" && (
                      <Button
                        variant="link"
                        size="sm"
                        colorScheme="red"
                        onClick={() => setStep("forgot")}
                      >
                        Quên mật khẩu?
                      </Button>
                    )}
                  </Flex>
                  <InputGroup>
                    <Input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Nhập mật khẩu"
                    />
                    <InputRightElement width="4.5rem">
                      <IconButton
                        aria-label={
                          showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"
                        }
                        icon={showPassword ? <FaEyeSlash /> : <FaEye />}
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowPassword(!showPassword)}
                      />
                    </InputRightElement>
                  </InputGroup>
                </FormControl>

                {mode === "register" && (
                  <>
                    <FormControl isRequired>
                      <FormLabel>Xác nhận mật khẩu</FormLabel>
                      <InputGroup>
                        <Input
                          name="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          placeholder="Nhập lại mật khẩu"
                        />
                        <InputRightElement width="4.5rem">
                          <IconButton
                            aria-label={
                              showConfirmPassword
                                ? "Ẩn mật khẩu"
                                : "Hiện mật khẩu"
                            }
                            icon={
                              showConfirmPassword ? <FaEyeSlash /> : <FaEye />
                            }
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              setShowConfirmPassword(!showConfirmPassword)
                            }
                          />
                        </InputRightElement>
                      </InputGroup>
                    </FormControl>
                    <FormControl isRequired>
                      <FormLabel>Họ và tên</FormLabel>
                      <Input
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Nguyễn Văn A"
                      />
                    </FormControl>
                    <FormControl isRequired>
                      <FormLabel>Số điện thoại</FormLabel>
                      <Input
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="0912..."
                      />
                    </FormControl>
                  </>
                )}

                {/* Google & Switch Mode */}
                <VStack w="full" pt={2} spacing={3}>
                  {/* Nút Submit nằm ở ModalFooter nhưng ta cần ẩn ModalFooter ở các bước khác, 
                       Nên ta để Logic hiển thị Footer ở dưới cùng */}
                </VStack>
              </>
            )}

            {/* === STEP 2: VERIFY REGISTER (OTP) === */}
            {step === "verify" && (
              <VStack spacing={6} w="full" py={4}>
                <Text textAlign="center" color="gray.600">
                  Mã xác thực đăng ký đã gửi tới <b>{formData.email}</b>.
                </Text>
                <HStack justify="center">
                  <PinInput
                    otp
                    size="lg"
                    focusBorderColor="blue.500"
                    value={formData.code}
                    onChange={handleCodeChange}
                  >
                    <PinInputField />
                    <PinInputField />
                    <PinInputField />
                    <PinInputField />
                    <PinInputField />
                    <PinInputField />
                  </PinInput>
                </HStack>
                <VStack w="full" spacing={3}>
                  <Button
                    colorScheme="blue"
                    w="full"
                    onClick={handleVerify}
                    isLoading={loading}
                  >
                    Xác thực
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleResend}>
                    Gửi lại mã
                  </Button>
                </VStack>
              </VStack>
            )}

            {/* === STEP 3: FORGOT PASSWORD (EMAIL INPUT) === */}
            {step === "forgot" && (
              <VStack spacing={4} w="full" py={2}>
                <Text textAlign="center" color="gray.600" fontSize="m">
                  Nhập email để nhận mã đặt lại mật khẩu.
                </Text>
                <FormControl isRequired>
                  <FormLabel>Email</FormLabel>
                  <Input
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="example@gmail.com"
                  />
                </FormControl>
                <Button
                  colorScheme="blue"
                  w="full"
                  onClick={handleSendReset}
                  isLoading={loading}
                >
                  Gửi mã xác nhận
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<ArrowBackIcon />}
                  onClick={() => setStep("form")}
                >
                  Quay lại đăng nhập
                </Button>
              </VStack>
            )}

            {/* === STEP 4: RESET CODE (NHẬP OTP) === */}
            {step === "reset-code" && (
              <VStack spacing={6} w="full" py={4}>
                <Text textAlign="center" color="gray.600">
                  Mã xác thực đã được gửi tới <b>{formData.email}</b>
                </Text>
                <HStack justify="center">
                  <PinInput
                    otp
                    size="lg"
                    focusBorderColor="blue.500"
                    value={formData.code}
                    onChange={handleCodeChange}
                  >
                    <PinInputField />
                    <PinInputField />
                    <PinInputField />
                    <PinInputField />
                    <PinInputField />
                    <PinInputField />
                  </PinInput>
                </HStack>
                <VStack w="full" spacing={3}>
                  <Button
                    colorScheme="blue"
                    w="full"
                    onClick={handleValidateResetCode}
                  >
                    Tiếp tục
                  </Button>
                  <HStack w="full" justify="space-between">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setStep("forgot")}
                    >
                      Nhập lại Email
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleResend}>
                      Gửi lại mã
                    </Button>
                  </HStack>
                </VStack>
              </VStack>
            )}

            {/* === STEP 5: RESET PASSWORD (NEW PASS) === */}
            {step === "reset-password" && (
              <VStack spacing={5} w="full">
                <Text textAlign="center" color="gray.600" fontSize="sm">
                  Vui lòng thiết lập mật khẩu mới.
                </Text>
                <FormControl isRequired>
                  <FormLabel>Mật khẩu mới</FormLabel>
                  <InputGroup>
                    <Input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Mật khẩu mới"
                    />
                    <InputRightElement>
                      <IconButton
                        icon={showPassword ? <FaEyeSlash /> : <FaEye />}
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowPassword(!showPassword)}
                      />
                    </InputRightElement>
                  </InputGroup>
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Nhập lại mật khẩu</FormLabel>
                  <InputGroup>
                    <Input
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Xác nhận mật khẩu"
                    />
                    <InputRightElement>
                      <IconButton
                        icon={showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                      />
                    </InputRightElement>
                  </InputGroup>
                </FormControl>
                <Button
                  colorScheme="blue"
                  w="full"
                  onClick={handleResetPassword}
                  isLoading={loading}
                >
                  Đổi mật khẩu
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep("reset-code")}
                >
                  Quay lại nhập mã
                </Button>
              </VStack>
            )}

            {/* Các thành phần chung cho Form Login/Register */}
            {step === "form" && (
              <>
                <HStack w="full" py={2}>
                  <Divider />
                  <Text fontSize="sm" whiteSpace="nowrap" color="gray.500">
                    Hoặc tiếp tục với
                  </Text>
                  <Divider />
                </HStack>
                <GoogleOAuthProvider
                  clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}
                >
                  <GoogleLogin
                    onSuccess={handleSuccess}
                    onError={() => console.log("Login Failed")}
                  />
                </GoogleOAuthProvider>
                <HStack justify="center" pt={2} w="full">
                  <Text fontSize="sm" color="gray.500">
                    {mode === "login"
                      ? "Chưa có tài khoản?"
                      : "Đã có tài khoản?"}
                  </Text>
                  <Button
                    variant="link"
                    colorScheme="blue"
                    size="sm"
                    onClick={() =>
                      setMode(mode === "login" ? "register" : "login")
                    }
                  >
                    {mode === "login" ? "Đăng ký ngay" : "Đăng nhập"}
                  </Button>
                </HStack>
              </>
            )}
          </VStack>
        </ModalBody>

        {/* Chỉ hiện Footer khi ở màn hình Form chính để tránh double button */}
        {step === "form" && (
          <ModalFooter borderBottomRadius="md">
            <Button variant="ghost" mr={3} onClick={onClose}>
              Hủy
            </Button>
            <Button
              type="submit"
              colorScheme="blue"
              isLoading={loading}
              loadingText={
                mode === "login" ? "Đang đăng nhập..." : "Đang đăng ký..."
              }
            >
              {mode === "login" ? "Đăng nhập" : "Đăng ký"}
            </Button>
          </ModalFooter>
        )}
      </ModalContent>
    </Modal>
  );
};

export default AuthModal;
