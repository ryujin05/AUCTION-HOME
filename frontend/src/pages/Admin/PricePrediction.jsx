import { useState } from "react";
import {
  Box, Button, FormControl, FormLabel, Input, VStack, Heading, Text, Card, CardBody,
  SimpleGrid, Stat, StatLabel, StatNumber, Alert, AlertIcon, useColorModeValue, Spinner
} from "@chakra-ui/react";
import axios from "../../lib/axios";

export default function PricePrediction() {
  const [area, setArea] = useState("");
  const [bedroom, setBedroom] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const cardBg = useColorModeValue("white", "gray.800");

  const handlePredict = async () => {
    if (!area || !bedroom) {
      setError("Vui lòng nhập đầy đủ thông tin");
      return;
    }
    setError(null);
    setResult(null);
    setLoading(true);

    try {
      const res = await axios.get("/admin/price-prediction", {
        params: { area, bedroom }
      });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  const formatVND = (n) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);

  return (
    <Box maxW="800px" mx="auto" p={6}>
      <VStack spacing={6} align="stretch">
        <Heading size="lg">Dự báo giá nhà đất</Heading>
        <Text color="gray.500">Sử dụng Linear Regression (scikit-learn) để dự đoán giá</Text>

        <Card bg={cardBg}>
          <CardBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Diện tích (m²)</FormLabel>
                <Input type="number" value={area} onChange={(e) => setArea(e.target.value)} placeholder="VD: 100" />
              </FormControl>
              <FormControl>
                <FormLabel>Số phòng ngủ</FormLabel>
                <Input type="number" value={bedroom} onChange={(e) => setBedroom(e.target.value)} placeholder="VD: 3" />
              </FormControl>
              <Button colorScheme="blue" w="full" onClick={handlePredict} isLoading={loading}>
                Dự báo giá
              </Button>
            </VStack>
          </CardBody>
        </Card>

        {error && (
          <Alert status="error"><AlertIcon />{error}</Alert>
        )}

        {result && (
          <Card bg={cardBg} borderColor="blue.500" borderWidth="2px">
            <CardBody>
              <VStack spacing={4}>
                <Box textAlign="center" p={4} bg="blue.50" borderRadius="md" w="full">
                  <Text fontSize="sm" color="gray.600">Giá dự đoán</Text>
                  <Text fontSize="3xl" fontWeight="bold" color="blue.600">{formatVND(result.price)}</Text>
                </Box>

                <SimpleGrid columns={2} spacing={4} w="full">
                  <Stat><StatLabel>R² Score</StatLabel><StatNumber>{(result.r2 * 100).toFixed(2)}%</StatNumber></Stat>
                  <Stat><StatLabel>Số mẫu</StatLabel><StatNumber>{result.data_points}</StatNumber></Stat>
                </SimpleGrid>

                <Box p={3} bg="gray.100" borderRadius="md" w="full">
                  <Text fontSize="sm" fontFamily="mono">
                    Giá = {result.intercept} + {result.coef_area} × Diện tích + {result.coef_bedroom} × Phòng ngủ
                  </Text>
                </Box>
              </VStack>
            </CardBody>
          </Card>
        )}
      </VStack>
    </Box>
  );
}
