import { useEffect, useState } from "react";
import {
  Box,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  useColorModeValue,
  Button,
  Badge,
  Flex,
  Divider,
  VStack
} from "@chakra-ui/react";
import adminService from "../../services/adminService";

export default function AdminActions() {
  const [actions, setActions] = useState([]);
  const [page, setPage] = useState(1);
  const cardBg = useColorModeValue("white", "gray.800");
  const rowBg = useColorModeValue("white", "gray.900");
  const hoverBg = useColorModeValue("gray.50", "gray.700");

  const fetch = async (p = 1) => {
    try {
      const res = await adminService.getAdminActions(p, 50);
      setActions(res.data.actions || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetch();
  }, []);

  const PropertyRow = ({ label, children, isLast }) => (
    <Box w="100%">
      <Flex justify="space-between" align="flex-start">
        <Text fontSize="sm" color="gray.500" minW="90px">
          {label}
        </Text>
        <Box textAlign="right" flex="1">
          {children}
        </Box>
      </Flex>

      {!isLast && <Divider mt={3} />}
    </Box>
  );

  return (
    <Box>
      <Heading size="md" mb={4}>
        {" "}
        Lịch sử hoạt động
      </Heading>
      <Box
        bg={cardBg}
        borderRadius="md"
        p={4}
        overflowX="hidden"
        display={{ base: "none", lg: "block" }}
      >
        <Table variant="simple" w="100%" tableLayout="fixed">
          <Thead>
            <Tr>
              <Th w="22%">Thời gian</Th>
              <Th w="20%">Quản trị viên</Th>
              <Th w="18%">Hành động</Th>
              {/* <Th w="20%">Mục tiêu</Th> */}
              <Th w="36%">Chi tiết</Th>
            </Tr>
          </Thead>

          <Tbody>
            {actions.map((a) => (
              <Tr key={a._id}>
                <Td>{new Date(a.createdAt).toLocaleString()}</Td>

                <Td wordBreak="break-word">
                  {a.admin?.name || a.admin?.username || a.admin}
                </Td>

                <Td>{a.action}</Td>

                {/* <Td wordBreak="break-word" whiteSpace="normal">
                  {a.target
                    ? typeof a.target === "string"
                      ? a.target
                      : JSON.stringify(a.target)
                    : "-"}
                </Td> */}

                <Td>
                  <Text
                    fontSize="sm"
                    wordBreak="break-word"
                    whiteSpace="pre-wrap"
                    maxH="120px"
                    overflowY="auto"
                  >
                    {a.meta ? JSON.stringify(a.meta, null, 2) : ""}
                  </Text>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>

        <Button
          mt={3}
          onClick={() => {
            setPage((p) => p + 1);
            fetch(page + 1);
          }}
        >
          Tải thêm
        </Button>
      </Box>
      <VStack
        spacing={4}
        display={{ base: "flex", lg: "none" }}
        align="stretch"
      >
        {actions.map((a) => (
          <Box key={a._id} p={4} borderWidth="1px" borderRadius="lg" bg={rowBg}>
            <VStack align="stretch" spacing={3}>
              <PropertyRow label="Thời gian">
                <Text fontSize="sm">
                  {new Date(a.createdAt).toLocaleString()}
                </Text>
              </PropertyRow>

              <PropertyRow label="Quản trị viên">
                <Text fontSize="sm" wordBreak="break-word">
                  {a.admin?.name || a.admin?.username || a.admin}
                </Text>
              </PropertyRow>

              <PropertyRow label="Hành động">
                <Badge>{a.action}</Badge>
              </PropertyRow>

              {/* <PropertyRow label="Mục tiêu">
                <Text fontSize="sm" wordBreak="break-word">
                  {a.target
                    ? typeof a.target === "string"
                      ? a.target
                      : JSON.stringify(a.target)
                    : "-"}
                </Text>
              </PropertyRow> */}

              <PropertyRow label="Chi tiết" isLast>
                <Box
                  fontSize="sm"
                  whiteSpace="pre-wrap"
                  wordBreak="break-word"
                  maxH="160px"
                  overflowY="auto"
                  textAlign="left"
                >
                  {a.meta ? JSON.stringify(a.meta, null, 2) : "-"}
                </Box>
              </PropertyRow>
            </VStack>
          </Box>
        ))}
      </VStack>
    </Box>
  );
}
