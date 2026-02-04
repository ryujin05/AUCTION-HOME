import React from "react";
import { Box, Heading, Text, Button, VStack } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const navigate = useNavigate();

  const goHome = () => {
    navigate("/");
  };

  return (
    <Box
      textAlign="center"
      py={10}
      px={6}
      minH="80vh" 
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <VStack spacing={4}>
        <Heading
          display="inline-block"
          as="h1"
          fontSize={{ base: "80px", md: "120px" }}
          bgGradient="linear(to-r, blue.600, blue.800)"
          backgroundClip="text"
        >
          404
        </Heading>
        <Text fontSize="30px" mt={3} mb={2} fontWeight="bold" color="gray.700">
          Trang không tồn tại
        </Text>
        <Text fontSize="25px" color={"gray.500"} mb={6}>
          Đường dẫn bạn truy cập có thể bị hỏng hoặc trang đã bị xóa.
        </Text>

        <Button
          colorScheme="blue"
          bgGradient="linear(to-r, blue.500, blue.600, blue.700)"
          color="white"
          variant="solid"
          onClick={goHome}
          h="60px"
          px="40px"
          fontSize="2xl"
          _hover={{
            bgGradient: "linear(to-r, blue.600, blue.700, blue.800)",
            boxShadow: "xl",
          }}
        >
          Quay về Trang chủ
        </Button>
      </VStack>
    </Box>
  );
};

export default NotFound;