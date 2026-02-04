// import { useEffect, useState, useRef } from "react";
// import {
//   Box,
//   Flex,
//   Text,
//   Input,
//   Button,
//   Avatar,
//   Spinner,
//   useColorModeValue,
// } from "@chakra-ui/react";
// import { useSocketContext } from "../context/SocketContext";
// import { useAuthContext } from "../context/AuthContext";
// import api from "../lib/axios";
// import { useChatStore } from "../store/chat.js";

// // Hàm helper format thời gian (giữ nguyên của bạn)
// const formatRelativeTime = (dateStr) => {
//   if (!dateStr) return "";
//   const d = new Date(dateStr);
//   if (isNaN(d)) return "";
//   const diffMs = Date.now() - d.getTime();
//   const sec = Math.floor(diffMs / 1000);
//   if (sec < 60) return "Vừa xong";
//   const min = Math.floor(sec / 60);
//   if (min < 60) return `${min} phút trước`;
//   const hour = Math.floor(min / 60);
//   if (hour < 24) return `${hour} giờ trước`;
//   const day = Math.floor(hour / 24);
//   return `${day} ngày trước`;
// };

// const getUserDisplayName = (user) => {
//   if (!user) return "Người dùng";
//   return user.name || user.username || "Người dùng";
// };

// // SỬA LỖI 1: Thêm isWidget vào props
// const ChatContainer = ({ currentChat, isWidget }) => {
//   const { socket } = useSocketContext();
//   const { currentUser } = useAuthContext();
//   const { fetchChats } = useChatStore();

//   const [messages, setMessages] = useState([]);
//   const [newMessage, setNewMessage] = useState("");
//   const [loading, setLoading] = useState(false);
//   const scrollRef = useRef();

//   // --- HOOKS MÀU SẮC ---
//   const containerBg = useColorModeValue("white", "gray.800");
//   // const headerBg = useColorModeValue("gray.50", "gray.700"); // Biến này không dùng nữa nếu ẩn header
//   const borderColor = useColorModeValue("gray.200", "gray.600");
//   const otherMsgBg = useColorModeValue("gray.100", "gray.700"); // Chỉnh màu nhẹ hơn chút cho đẹp
//   const otherMsgColor = useColorModeValue("black", "white");

//   // Lấy thông tin người kia
//   const receiver = currentChat?.participants.find(
//     (p) => p._id !== currentUser._id
//   );

//   // Fetch messages
//   useEffect(() => {
//     const fetchMessages = async () => {
//       if (!currentChat?._id) return;
//       setLoading(true);
//       try {
//         const res = await api.get(`/chats/${currentChat._id}/messages`);
//         const msgs = res.data.messages || [];
//         setMessages(msgs.reverse()); // API của bạn có thể trả về thứ tự đúng rồi, nếu ngược thì .reverse()
//       } catch (err) {
//         console.error(err);
//         setMessages([]);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchMessages();
//   }, [currentChat]);

//   // Socket logic
//   useEffect(() => {
//     if (!socket || !currentChat?._id) return;

//     // Join room
//     socket.emit("join_chat", currentChat._id);

//     const handleNewMessage = (msg) => {
//       // Kiểm tra kỹ ID để tránh nhận nhầm tin nhắn từ room khác
//       const msgConversationId =
//         typeof msg.conversation === "object"
//           ? msg.conversation._id
//           : msg.conversation;
//       if (msgConversationId?.toString() === currentChat._id.toString()) {
//         setMessages((prev) => [...prev, msg]);
//       }
//     };

//     socket.on("new_message", handleNewMessage);
//     return () => {
//       socket.off("new_message", handleNewMessage);
//     };
//   }, [socket, currentChat]);

//   // Auto scroll
//   useEffect(() => {
//     // Timeout nhỏ giúp UI render xong mới scroll để chính xác hơn
//     setTimeout(() => {
//       scrollRef.current?.scrollIntoView({
//         behavior: "smooth",
//         block: "nearest",
//       });
//     }, 100);
//   }, [messages]);

//   const handleSend = async () => {
//     if (!newMessage.trim()) return;

//     // OPTIMISTIC UI (Tùy chọn): Hiển thị ngay lập tức để cảm giác nhanh hơn
//     // const tempMsg = { _id: Date.now(), content: newMessage, sender: currentUser._id, createdAt: new Date() };
//     // setMessages(prev => [...prev, tempMsg]);

//     try {
//       const res = await api.post(`/chats/${currentChat._id}/messages`, {
//         content: newMessage,
//       });
//       setNewMessage("");
//       fetchChats();
//     } catch (err) {
//       console.error("Lỗi gửi tin:", err);
//     }
//   };

//   const handleKeyPress = (e) => {
//     if (e.key === "Enter") handleSend();
//   };

//   if (loading)
//     return (
//       <Flex justify="center" align="center" h="100%">
//         <Spinner />
//       </Flex>
//     );

//   return (
//     <Flex
//       direction="column"
//       h="100%"
//       // Nếu là Widget thì padding nhỏ (2), trang to thì (4)
//       p={isWidget ? 2 : 4}
//       bg={containerBg}
//       // Nếu là Widget thì bỏ border/radius đi vì thằng cha (ChatWidget) đã lo rồi
//       borderRadius={isWidget ? "none" : "lg"}
//       boxShadow={isWidget ? "none" : "sm"}
//       borderWidth={isWidget ? "0px" : "2px"}
//       borderColor={borderColor}
//     >
//       {/* SỬA LỖI 2: Ẩn Header nếu đang là Widget */}
//       {!isWidget && (
//         <Flex
//           align="center"
//           gap={3}
//           p={4}
//           mb={2}
//           borderBottom="2px"
//           borderColor={borderColor}
//         >
//           <Avatar
//             src={receiver?.avatar || ""}
//             name={getUserDisplayName(receiver)}
//           />
//           <Box>
//             <Text fontWeight="bold" fontSize={"lg"}>
//               {getUserDisplayName(receiver)}
//             </Text>
//             <Text fontSize="sm" fontWeight={"semibold"} color={"gray.500"}>
//               Đang trực tuyến
//             </Text>
//           </Box>
//         </Flex>
//       )}

//       {/* MESSAGE LIST */}
//       <Flex direction="column" flex={1} p={2} gap={3} overflowY="auto">
//         {messages.map((msg) => {
//           const senderId =
//             typeof msg.sender === "object" ? msg.sender._id : msg.sender;
//           const isOwn = senderId?.toString() === currentUser?._id?.toString();

//           return (
//             <Flex key={msg._id} justify={isOwn ? "flex-end" : "flex-start"}>
//               <Box
//                 maxW="85%" // Tăng độ rộng tin nhắn lên chút cho dễ đọc
//                 bg={isOwn ? "blue.500" : otherMsgBg}
//                 color={isOwn ? "white" : otherMsgColor}
//                 px={3}
//                 py={2}
//                 borderRadius="lg"
//                 borderBottomRightRadius={isOwn ? "0" : "lg"}
//                 borderBottomLeftRadius={isOwn ? "lg" : "0"}
//               >
//                 <Text fontSize="md">{msg.content}</Text>
//                 <Text fontSize="10px" textAlign="right" mt={1} opacity={0.7}>
//                   {formatRelativeTime(msg.createdAt)}
//                 </Text>
//               </Box>
//             </Flex>
//           );
//         })}
//         <div ref={scrollRef} />
//       </Flex>

//       {/* INPUT AREA */}
//       <Flex
//         p={2}
//         gap={2}
//         borderTop={isWidget ? "1px solid" : "none"}
//         borderColor={borderColor}
//         pt={3}
//       >
//         <Input
//           placeholder="Nhập tin nhắn..."
//           value={newMessage}
//           onChange={(e) => setNewMessage(e.target.value)}
//           onKeyPress={handleKeyPress}
//           size="sm" // Nhỏ lại chút cho gọn
//           borderRadius="full"
//         />
//         <Button
//           size="sm"
//           colorScheme="blue"
//           borderRadius="full"
//           onClick={handleSend}
//           px={6}
//         >
//           Gửi
//         </Button>
//       </Flex>
//     </Flex>
//   );
// };

// export default ChatContainer;

import { useEffect, useRef, useState } from "react";
import {
  Box,
  Flex,
  Text,
  Input,
  Button,
  Avatar,
  Spinner,
  useColorModeValue,
  Link as ChakraLink,
} from "@chakra-ui/react";
import { useAuthContext } from "../context/AuthContext";
import { useSocketContext } from "../context/SocketContext";
import { useChatStore } from "../store/chat.js";
import { useUserStore } from "../store/user.js";

// Helper format time
const formatRelativeTime = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d)) return "";
  const diffMs = Date.now() - d.getTime();
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return "Vừa xong";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} phút trước`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour} giờ trước`;
  const day = Math.floor(hour / 24);
  return `${day} ngày trước`;
};

const getUserDisplayName = (user) => {
  if (!user) return "Người dùng";
  return user.name || user.username || "Người dùng";
};

const renderMessageContent = (text, isOwn) => {
  if (!text) return null;

  // Regex tìm pattern [Title](URL)
  const regex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // 1. Phần text thường trước link
    if (match.index > lastIndex) {
      parts.push(
        <Text as="span" key={`text-${lastIndex}`}>
          {text.substring(lastIndex, match.index)}
        </Text>
      );
    }

    // 2. Phần Link (match[1] là Title, match[2] là URL)
    parts.push(
      <ChakraLink
        key={`link-${match.index}`}
        href={match[2]}
        isExternal // Mở tab mới
        color={isOwn ? "white" : "blue.600"} // Chỉnh màu link cho dễ đọc
        textDecoration="underline"
        fontWeight="bold"
        _hover={{ opacity: 0.8 }}
      >
        {match[1]}
      </ChakraLink>
    );

    lastIndex = regex.lastIndex;
  }

  // 3. Phần text còn dư phía sau
  if (lastIndex < text.length) {
    parts.push(
      <Text as="span" key={`text-end`}>
        {text.substring(lastIndex)}
      </Text>
    );
  }

  // Nếu không có link nào, trả về text gốc
  return parts.length > 0 ? parts : <Text as="span">{text}</Text>;
};

const ChatContainer = ({ isWidget }) => {
  // Lấy dữ liệu user hiện tại
  const { user: currentUser } = useUserStore(); // Hoặc useAuthContext tùy project
  const { socket } = useSocketContext();

  // Lấy state và actions từ ChatStore
  const { selectedConversation, messages, isMessagesLoading, sendMessage } =
    useChatStore();

  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef();

  // --- MÀU SẮC ---
  const containerBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const otherMsgBg = useColorModeValue("gray.100", "gray.700");
  const otherMsgColor = useColorModeValue("black", "white");
  const placeholderBg = useColorModeValue("gray.50", "gray.700");

  // Tìm thông tin người nhận (để hiển thị Header nếu cần)
  const receiver = selectedConversation?.participants?.find(
    (p) => p._id !== currentUser?._id
  );

  // Auto Scroll xuống cuối khi có tin nhắn mới
  useEffect(() => {
    scrollRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "nearest",
    });
  }, [messages]);

  useEffect(() => {
    if (socket && selectedConversation?._id) {
      socket.emit("join_chat", selectedConversation._id);
    }
  }, [socket, selectedConversation]);

  // Xử lý gửi tin nhắn
  const handleSend = async () => {
    if (!newMessage.trim()) return;

    // Gọi action sendMessage trong store (đã bao gồm logic optimistic update)
    await sendMessage(newMessage);

    setNewMessage("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleSend();
  };

  // Nếu đang loading tin nhắn và chưa có tin nhắn nào hiển thị -> Show Spinner
  // (Nếu đã có tin nhắn cũ thì không cần show spinner để tránh giật lag)
  if (isMessagesLoading && messages.length === 0) {
    return (
      <Flex justify="center" align="center" h="100%">
        <Spinner size="xl" color="blue.500" />
      </Flex>
    );
  }

  // Nếu không có cuộc hội thoại nào được chọn (Guard clause)
  if (!selectedConversation) {
    return (
      <Flex justify="center" align="center" h="100%">
        <Text>Chọn một cuộc trò chuyện để bắt đầu.</Text>
      </Flex>
    );
  }

  return (
    <Flex
      direction="column"
      h="100%"
      p={isWidget ? 2 : 4}
      bg={containerBg}
      borderRadius={isWidget ? "none" : "lg"}
      boxShadow={isWidget ? "none" : "sm"}
      borderWidth={isWidget ? "0px" : "2px"}
      borderColor={borderColor}
    >
      {/* HEADER (Chỉ hiện khi không phải Widget) */}
      {!isWidget && (
        <Flex
          align="center"
          gap={3}
          p={4}
          mb={2}
          borderBottom="2px"
          borderColor={borderColor}
        >
          <Avatar
            src={receiver?.avatar || ""}
            name={getUserDisplayName(receiver)}
          />
          <Box>
            <Text fontWeight="bold" fontSize={"lg"}>
              {getUserDisplayName(receiver)}
            </Text>
            {/* Nếu có trạng thái online thực tế thì thay vào đây */}
            <Text
              fontSize="sm"
              fontWeight={"semibold"}
              color={"gray.500"}
            ></Text>
          </Box>
        </Flex>
      )}

      {/* MESSAGE LIST */}
      <Flex
        direction="column"
        flex={1}
        p={2}
        gap={3}
        overflowY="auto"
        css={{
          "&::-webkit-scrollbar": { width: "4px" },
          "&::-webkit-scrollbar-track": { width: "6px" },
          "&::-webkit-scrollbar-thumb": {
            background: "#cbd5e0",
            borderRadius: "24px",
          },
        }}
      >
        {messages.map((msg, index) => {
          const senderId =
            typeof msg.sender === "object" ? msg.sender?._id : msg.sender;
          const isOwn = senderId?.toString() === currentUser?._id?.toString();

          return (
            <Flex
              key={msg._id || index}
              justify={isOwn ? "flex-end" : "flex-start"}
            >
              {/* Avatar người khác (Tuỳ chọn: Nếu muốn hiện avatar bên cạnh tin nhắn) */}
              {/* {!isOwn && <Avatar size="xs" src={receiver?.avatar} mr={2} mt={1} />} */}

              <Box
                maxW="80%"
                bg={isOwn ? "blue.500" : otherMsgBg}
                color={isOwn ? "white" : otherMsgColor}
                px={4}
                py={2}
                borderRadius="2xl"
                borderBottomRightRadius={isOwn ? "sm" : "2xl"}
                borderBottomLeftRadius={isOwn ? "2xl" : "sm"}
                opacity={msg.pending ? 0.7 : 1} // Làm mờ nếu đang gửi (Optimistic)
              >
                <Box fontSize="md" style={{ whiteSpace: "pre-wrap" }}>
                   {renderMessageContent(msg.content, isOwn)}
                </Box>

                <Flex justify="flex-end" align="center" gap={1} mt={1}>
                  <Text fontSize="10px" opacity={0.8}>
                    {formatRelativeTime(msg.createdAt)}
                  </Text>
                  {/* Icon tick đã gửi (nếu muốn) */}
                  {/* {isOwn && !msg.pending && <CheckIcon w={2} h={2} />} */}
                </Flex>
              </Box>
            </Flex>
          );
        })}
        <div ref={scrollRef} />
      </Flex>

      {/* INPUT AREA */}
      <Flex
        p={2}
        gap={2}
        borderTop={isWidget ? "1px solid" : "none"}
        borderColor={borderColor}
        pt={3}
      >
        <Input
          placeholder="Nhập tin nhắn..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          borderRadius="full"
          bg={placeholderBg}
          border="none"
          _focus={{ ring: 2, ringColor: "blue.500" }}
        />
        <Button
          colorScheme="blue"
          borderRadius="full"
          onClick={handleSend}
          px={6}
          isDisabled={!newMessage.trim()}
        >
          Gửi
        </Button>
      </Flex>
    </Flex>
  );
};

export default ChatContainer;
