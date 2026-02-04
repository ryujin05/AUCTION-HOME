import React from "react";
import {Box, Text, Badge, Flex, Heading, VStack } from "@chakra-ui/react";

const HistoryCard = ({ data }) => {
    const isAnnouncement = data.type_notif === 'ANNOUNCEMENT';

    const config = isAnnouncement 
        ? { color: 'orange', label: 'TIN TỨC'}
        : { color: 'blue', label: 'THÔNG BÁO'};

    return (
        <Box
            p={5}
            shadow="md"
            borderWidth="1px"
            borderRadius="md"
            bg="white"
            borderLeftWidth="4px"
            borderLeftColor={`${config.color}.400`}
            _hover={{ shadow: 'lg', transform: 'translateY(-2px)', transition: '0.2s' }}
        >
            <Flex justifyContent="space-between" alignItems="center" mb={2}>
                <Badge colorScheme={config.color} fontSize="0.8em">
                    {config.label}
                </Badge>
                <Text fontSize="sm" color="gray.500">
                    {new Date(data.createdAt).toLocaleDateString('vi-VN')}
                </Text>
            </Flex>

            <Heading size="md" mb={2} color="gray.700">
                {data.title || "Không có tiêu đề"}
            </Heading>

            <Text color="gray.600" noOfLines={3}>
                {data.message || data.description}
            </Text>
        </Box>
    );
};

export default HistoryCard;