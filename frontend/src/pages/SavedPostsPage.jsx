import { Box, SimpleGrid, VStack, Heading, Button, Stack, useColorModeValue, Flex } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import { useListStore } from "../store/list.js";
import { useUserStore } from "../store/user.js";
import ListingCard from "../components/ListingCard";
import HorizontalListingCard from "../components/HorizontalListingCard";
import SortViewOpts, { sortListings, filterListings } from "../components/SortViewOpts";
import PostsNavigationPanel from "../components/PostsNavigationPanel";

const SavedPostsPage = () => {
  const { fetchSavedListings } = useListStore();
  const { toggleSaveListing } = useUserStore();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState("newest");
  const [viewType, setViewType] = useState("grid");
  const [searchQuery, setSearchQuery] = useState("");

  // Filter and sort listings
  const filteredListings = filterListings(listings, searchQuery);
  const sortedListings = sortListings(filteredListings, sortBy);

  const load = async () => {
    setLoading(true);
    const res = await fetchSavedListings();
    if (res.success) setListings(res.data || []);
    setLoading(false);
  };

  useEffect(() => { 
    AOS.init({ duration: 400});
    load(); 
  }, []);

  const onUnsave = async (id) => {
    const res = await toggleSaveListing(id);
    if (res.success) load();
  };

  const mainBg = useColorModeValue('gray.50', 'gray.900');

  return (
    <Flex minH="100vh" justify={"center"}>
      {/* Left Navigation Panel */}
      {/* <PostsNavigationPanel /> */}

      {/* Main Content */}
      <Box flex={1} p={6} maxW={"1140px"}>
        <Heading 
          size={{ base: "lg", md: "xl" }}
          textAlign="center"
          color={useColorModeValue("gray.900", "white")}
          mb={8}
        >
          Bài đăng đã lưu
        </Heading>
        {/* Sorting and View Options */}
        <SortViewOpts
          listings={filteredListings}
          sortBy={sortBy}
          setSortBy={setSortBy}
          viewType={viewType}
          setViewType={setViewType}
          countText="bài đã lưu"
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        {viewType === "list" ? (
          <VStack spacing={6} align="stretch">
            {sortedListings.map((l, index) => (
              <Box key={l._id} data-aos="fade-up" data-aos-delay={index * 50}>
                <HorizontalListingCard listing={l} />
                <Stack direction="row" spacing={2} mt={2}>
                  <Button size="sm" colorScheme="red" variant="ghost" onClick={() => onUnsave(l._id)}>Bỏ lưu</Button>
                </Stack>
              </Box>
            ))}
          </VStack>
        ) : (
          <SimpleGrid 
            columns={{ base: 1, md: 3 }} 
            spacing={6}
          >
            {sortedListings.map((l, index) => (
              <Box key={l._id} data-aos="fade-up" data-aos-delay={index * 100}>
                <ListingCard listing={l} />
                <Stack direction="row" spacing={2} mt={2}>
                  <Button size="sm" colorScheme="red" variant="ghost" onClick={() => onUnsave(l._id)}>Bỏ lưu</Button>
                </Stack>
              </Box>
            ))}
          </SimpleGrid>
        )}
      </Box>
    </Flex>
  );
};

export default SavedPostsPage;
