// import { useEffect, useState } from "react";
// import {
//   Box,
//   Flex,
//   Text,
//   VStack,
//   HStack,
//   Avatar,
//   IconButton,
//   useColorModeValue,
//   SlideFade,
// } from "@chakra-ui/react";
// import {
//   ChatIcon,
//   ArrowBackIcon,
//   ChevronDownIcon,
// } from "@chakra-ui/icons";
// import ChatContainer from "./ChatContainer.jsx";
// import { useUserStore } from "../store/user.js";
// import { useChatStore } from "../store/chat.js";

// // Helper lấy tên hiển thị an toàn
// const getUserDisplayName = (user) => {
//   if (!user) return "Người dùng";
//   return user.name || user.username || "Người dùng";
// };

// const ChatWidget = () => {
//   const { user } = useUserStore();

//   // --- SỬA LỖI Ở ĐÂY: Dùng chats và fetchChats ---
//   const { chats, fetchChats } = useChatStore();

//   const [isOpen, setIsOpen] = useState(false);
//   const [currentChat, setCurrentChat] = useState(null);

//   // --- THEME COLORS ---
//   const bgBox = useColorModeValue("white", "gray.800");
//   const borderColor = useColorModeValue("gray.200", "gray.700");
//   const headerBg = useColorModeValue("blue.600", "blue.500");
//   const textColor = "white";
//   const hoverBg = useColorModeValue("gray.100", "gray.700");
//   const bodyBg = useColorModeValue("gray.50", "gray.900");
//   const msgColor = useColorModeValue("gray.600", "gray.400");

//   // Lấy danh sách tin nhắn khi user login
//   useEffect(() => {
//     if (user) {
//       fetchChats(); // --- SỬA LỖI: Gọi fetchChats
//     }
//   }, [user, fetchChats]);

//   const toggleWidget = () => setIsOpen(!isOpen);
//   const handleBackToList = () => setCurrentChat(null);

//   if (!user) return null;

//   const currentUserId = user.id || user._id;

//   return (
//     <>
//       {/* 1. Nút tròn mở chat */}
//       {!isOpen && (
//         <IconButton
//           icon={<ChatIcon w={6} h={6} />}
//           isRound={true}
//           size="lg"
//           colorScheme="blue"
//           position="fixed"
//           bottom="30px"
//           right="30px"
//           zIndex="9999"
//           boxShadow="lg"
//           onClick={toggleWidget}
//           aria-label="Open Chat"
//           animation="bounce 2s infinite"
//           sx={{
//             "@keyframes bounce": {
//               "0%, 20%, 50%, 80%, 100%": { transform: "translateY(0)" },
//               "40%": { transform: "translateY(-10px)" },
//               "60%": { transform: "translateY(-5px)" },
//             },
//           }}
//         />
//       )}

//       {/* 2. Khung chat window */}
//       <SlideFade in={isOpen} offsetY="20px" unmountOnExit={false}>
//         <Box
//           position="fixed"
//           bottom={isOpen ? "30px" : "-500px"}
//           right="30px"
//           w="350px"
//           h="500px"
//           bg={bgBox}
//           boxShadow="2xl"
//           borderRadius="xl"
//           zIndex="9999"
//           border="1px solid"
//           borderColor={borderColor}
//           overflow="hidden"
//           display={isOpen ? "flex" : "none"}
//           flexDirection="column"
//         >
//           {/* HEADER */}
//           <Flex
//             bg={headerBg}
//             p={3}
//             align="center"
//             justify="space-between"
//             color={textColor}
//             boxShadow="sm"
//           >
//             <HStack>
//               {currentChat && (
//                 <IconButton
//                   icon={<ArrowBackIcon />}
//                   variant="ghost"
//                   color="white"
//                   size="sm"
//                   _hover={{ bg: "whiteAlpha.300" }}
//                   onClick={handleBackToList}
//                   aria-label="Back"
//                 />
//               )}

//               <Text fontWeight="bold" fontSize="md" noOfLines={1}>
//                 {currentChat
//                   ? getUserDisplayName(
//                       currentChat.participants?.find((p) => (p._id || p.id) !== currentUserId)
//                     )
//                   : "Tin nhắn"}
//               </Text>
//             </HStack>

//             <IconButton
//               icon={<ChevronDownIcon w={6} h={6} />}
//               variant="ghost"
//               color="white"
//               size="sm"
//               onClick={toggleWidget}
//               _hover={{ bg: "whiteAlpha.300" }}
//               aria-label="Close"
//             />
//           </Flex>

//           {/* BODY */}
//           <Box flex={1} overflowY="auto" bg={bodyBg}>
//             {/* VIEW 1: DANH SÁCH CHAT */}
//             {!currentChat && (
//               <VStack align="stretch" spacing={0}>
//                 {/* SỬA LỖI: Dùng biến chats thay vì conversations */}
//                 {(!chats || chats.length === 0) && (
//                   <Text p={5} textAlign="center" color="gray.500" fontSize="sm">
//                     Chưa có cuộc hội thoại nào.
//                   </Text>
//                 )}

//                 {chats?.map((chat) => {
//                   const otherUser = chat.participants?.find(
//                     (p) => (p._id || p.id) !== currentUserId
//                   );

//                   return (
//                     <HStack
//                       key={chat._id}
//                       p={3}
//                       cursor="pointer"
//                       bg="transparent"
//                       _hover={{ bg: hoverBg }}
//                       onClick={() => setCurrentChat(chat)}
//                       borderBottom="1px solid"
//                       borderColor={borderColor}
//                       transition="background 0.2s"
//                     >
//                       <Avatar
//                         size="sm"
//                         src={otherUser?.avatar || ""}
//                         name={getUserDisplayName(otherUser)}
//                       />
//                       <Box flex={1} overflow="hidden">
//                         <HStack justify="space-between">
//                             <Text fontWeight="bold" fontSize="sm" noOfLines={1}>
//                             {getUserDisplayName(otherUser)}
//                             </Text>
//                         </HStack>

//                         <Text fontSize="xs" color={msgColor} noOfLines={1}>
//                           {chat.lastMessage?.sender === currentUserId ? "Bạn: " : ""}
//                           {chat.lastMessage?.content || "Bắt đầu trò chuyện..."}
//                         </Text>
//                       </Box>
//                     </HStack>
//                   );
//                 })}
//               </VStack>
//             )}

//             {/* VIEW 2: KHUNG CHAT CHI TIẾT */}
//             {currentChat && (
//               <Box h="100%">
//                 <ChatContainer
//                     currentChat={currentChat}
//                     isWidget={true}
//                     onClose={handleBackToList}
//                 />
//               </Box>
//             )}
//           </Box>
//         </Box>
//       </SlideFade>
//     </>
//   );
// };

// export default ChatWidget;

import { useEffect, useState } from "react";
import {
  Box,
  Flex,
  Text,
  VStack,
  HStack,
  Avatar,
  IconButton,
  useColorModeValue,
  SlideFade,
  Badge,
} from "@chakra-ui/react";
import {
  ChatIcon,
  ArrowBackIcon,
  ChevronDownIcon,
  CloseIcon,
} from "@chakra-ui/icons";
import ChatContainer from "./ChatContainer.jsx";
import { useUserStore } from "../store/user.js";
import { useChatStore } from "../store/chat.js";
import { useSocketContext } from "../context/SocketContext.jsx";

// Helper an toàn
const getUserDisplayName = (user) => {
  if (!user) return "Người dùng";
  return user.name || user.username || "Người dùng";
};

const ChatWidget = () => {
  const { user } = useUserStore();
  const { socket } = useSocketContext();

  // Sử dụng Store thay vì state cục bộ
  const {
    chats,
    fetchChats,
    addMessage,
    selectedConversation,
    setSelectedConversation,
  } = useChatStore();

  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0); // (Optional) Đếm tin chưa đọc

  // --- THEME COLORS ---
  const bgBox = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const headerBg = useColorModeValue("blue.600", "blue.500");
  const textColor = "white";
  const hoverBg = useColorModeValue("gray.100", "gray.700");
  const bodyBg = useColorModeValue("gray.50", "gray.900");
  const msgColor = useColorModeValue("gray.600", "gray.400");

  // Socket Listener để cập nhật list chat khi Widget đang đóng/mở
  useEffect(() => {
    if (!socket) return;
    const handleNewMessage = (msg) => {
      addMessage(msg);
      // Nếu widget đóng, có thể tăng biến đếm notification ở đây
      if (!isOpen) {
        setUnreadCount((prev) => prev + 1);
      }
    };
    socket.on("new_message", handleNewMessage);
    return () => socket.off("new_message", handleNewMessage);
  }, [socket, addMessage, isOpen]);

  // Fetch chats khi login
  useEffect(() => {
    if (user) {
      fetchChats();
    }
  }, [user, fetchChats]);

  const toggleWidget = () => {
    setIsOpen(!isOpen);
    if (!isOpen) setUnreadCount(0); // Reset unread khi mở
  };

  const handleBackToList = () => {
    // Set về null để quay lại list chat
    setSelectedConversation(null);
    // Trick: Set null thực ra hàm setSelectedConversation trong store sẽ set state,
    // nhưng store của mình đang viết là nhận object.
    // Nên ta cần sửa nhẹ store hoặc dùng cách sau:
    useChatStore.setState({ selectedConversation: null });
  };

  if (!user) return null;

  const currentUserId = user.id || user._id;

  // Tìm thông tin người đang chat cùng (để hiển thị trên Header)
  const otherUser = selectedConversation?.participants?.find(
    (p) => (p._id || p.id) !== currentUserId
  );

  return (
    <>
      {/* 1. Nút tròn mở chat */}
      <Box position="fixed" bottom="30px" right="30px" zIndex="9999">
        {unreadCount > 0 && !isOpen && (
          <Badge
            colorScheme="red"
            borderRadius="full"
            position="absolute"
            top="-5px"
            right="-5px"
            zIndex="2"
            boxShadow="sm"
          >
            {unreadCount}
          </Badge>
        )}

        {!isOpen && (
          <IconButton
            icon={<ChatIcon w={6} h={6} />}
            isRound={true}
            size="lg"
            colorScheme="blue"
            boxShadow="lg"
            onClick={toggleWidget}
            aria-label="Open Chat"
            animation="bounce 2s infinite"
            sx={{
              "@keyframes bounce": {
                "0%, 20%, 50%, 80%, 100%": { transform: "translateY(0)" },
                "40%": { transform: "translateY(-10px)" },
                "60%": { transform: "translateY(-5px)" },
              },
            }}
          />
        )}
      </Box>

      {/* 2. Khung chat window */}
      <SlideFade in={isOpen} offsetY="20px" unmountOnExit={false}>
        <Box
          position="fixed"
          bottom={isOpen ? "30px" : "-500px"} // CSS fallback
          right="30px"
          w="350px"
          h="500px"
          bg={bgBox}
          boxShadow="2xl"
          borderRadius="xl"
          zIndex="9999"
          border="1px solid"
          borderColor={borderColor}
          overflow="hidden"
          display={isOpen ? "flex" : "none"}
          flexDirection="column"
        >
          {/* HEADER */}
          <Flex
            bg={headerBg}
            p={3}
            align="center"
            justify="space-between"
            color={textColor}
            boxShadow="sm"
          >
            <HStack>
              {selectedConversation ? (
                <IconButton
                  icon={<ArrowBackIcon boxSize={5} />}
                  variant="ghost"
                  color="white"
                  size="sm"
                  _hover={{ bg: "whiteAlpha.300" }}
                  onClick={handleBackToList}
                  aria-label="Back"
                />
              ) : (
                <ChatIcon ml={2} />
              )}

              <Text fontWeight="bold" fontSize="md" noOfLines={1} ml={1}>
                {selectedConversation
                  ? getUserDisplayName(otherUser)
                  : "Tin nhắn"}
              </Text>
            </HStack>

            <IconButton
              icon={<ChevronDownIcon w={6} h={6} />} // Hoặc CloseIcon
              variant="ghost"
              color="white"
              size="sm"
              onClick={toggleWidget}
              _hover={{ bg: "whiteAlpha.300" }}
              aria-label="Close"
            />
          </Flex>

          {/* BODY */}
          <Box flex={1} overflowY="auto" bg={bodyBg} position="relative">
            {/* VIEW 1: DANH SÁCH CHAT (Chỉ hiện khi chưa chọn chat) */}
            {!selectedConversation && (
              <VStack align="stretch" spacing={0}>
                {(!chats || chats.length === 0) && (
                  <Text p={5} textAlign="center" color="gray.500" fontSize="sm">
                    Chưa có cuộc hội thoại nào.
                  </Text>
                )}

                {chats?.map((chat) => {
                  const partner = chat.participants?.find(
                    (p) => (p._id || p.id) !== currentUserId
                  );

                  return (
                    <HStack
                      key={chat._id}
                      p={3}
                      cursor="pointer"
                      bg="transparent"
                      _hover={{ bg: hoverBg }}
                      // SỬA LỖI: Gọi setSelectedConversation từ store
                      onClick={() => setSelectedConversation(chat)}
                      borderBottom="1px solid"
                      borderColor={borderColor}
                      transition="background 0.2s"
                    >
                      <Avatar
                        size="sm"
                        src={partner?.avatar || ""}
                        name={getUserDisplayName(partner)}
                      />
                      <Box flex={1} overflow="hidden">
                        <HStack justify="space-between">
                          <Text fontWeight="bold" fontSize="sm" noOfLines={1}>
                            {getUserDisplayName(partner)}
                          </Text>
                          {/* Time stamp logic here if needed */}
                        </HStack>

                        <Text fontSize="xs" color={msgColor} noOfLines={1}>
                          {chat.lastMessage?.sender?._id === currentUserId ||
                          chat.lastMessage?.sender === currentUserId
                            ? "Bạn: "
                            : ""}
                          {chat.lastMessage?.content || "Bắt đầu trò chuyện..."}
                        </Text>
                      </Box>
                    </HStack>
                  );
                })}
              </VStack>
            )}

            {/* VIEW 2: KHUNG CHAT CHI TIẾT */}
            {/* Chỉ render khi có selectedConversation để ChatContainer tự lấy dữ liệu */}
            {selectedConversation && (
              <Box h="100%" w="100%">
                <ChatContainer
                  isWidget={true}
                  // Không cần truyền currentChat nữa vì nó tự lấy từ Store
                />
              </Box>
            )}
          </Box>
        </Box>
      </SlideFade>
    </>
  );
};

export default ChatWidget;
