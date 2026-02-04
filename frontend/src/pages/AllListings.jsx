import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Container,
  Box,
  Grid,
  GridItem,
  SimpleGrid,
  VStack,
  Spinner,
  Center,
  Text,
  Progress 
} from "@chakra-ui/react";
import ListingCard from "../components/ListingCard";
import HorizontalListingCard from "../components/HorizontalListingCard";
import SearchOpt from "../components/SearchOpt";
import SortViewOpts from "../components/SortViewOpts";
import { useListStore } from "../store/list.js";
import SlideShow from "../components/SlideShow.jsx";

const AllListings = () => {
  const { listings, loading, error, fetchListings, sortLocal } = useListStore();
  const [searchParams, setSearchParams] = useSearchParams();

  // 1. Lấy giá trị ban đầu từ URL
  const initialSort = searchParams.get("sort") || "newest";
  const initialType = searchParams.get("auctionStatus") || "";

  const [sortBy, setSortBy] = useState(initialSort);
  const [auctionStatus, setAuctionStatus] = useState(initialType);
  const [viewType, setViewType] = useState("grid");

  // 2. Fetch dữ liệu khi URL thay đổi
  useEffect(() => {
    const params = Object.fromEntries([...searchParams]);
    
    // // Đồng bộ state Sort với URL
    // if (params.sort && params.sort !== sortBy) {
    //   setSortBy(params.sort);
    // }

    // // Đồng bộ state Rental Type với URL (MỚI)
    // // (Xử lý trường hợp user bấm nút Back/Forward trình duyệt)
    // const typeFromUrl = params.rental_type || "";
    // if (typeFromUrl !== rentalType) {
    //   setRentalType(typeFromUrl);
    // }

    // Logic Loading ngầm
    const isBackgroundLoad = listings.length > 0;
    fetchListings(params, isBackgroundLoad);
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // 3. Hàm xử lý Sort "Hybrid"
  const handleSortChange = (newSortValue) => {
    sortLocal(newSortValue); 
    setSortBy(newSortValue);

    const currentParams = Object.fromEntries([...searchParams]);
    setSearchParams({
      ...currentParams,
      sort: newSortValue,
    });
  };

  // 4. HÀM XỬ LÝ LOẠI TIN (MỚI)
  const handleTypeChange = (newType) => {
    setAuctionStatus(newType);
    
    const currentParams = Object.fromEntries([...searchParams]);
    
    // Logic cập nhật URL
    if (newType === "") {
      // Nếu chọn "Tất cả", xóa param rental_type để URL gọn
      delete currentParams.auctionStatus;
    } else {
      currentParams.auctionStatus = newType;
    }
    
    setSearchParams(currentParams); // URL đổi -> useEffect chạy -> Gọi API
  };

  if (error) {
    return (
      <Container maxW={"1140px"} py={12}>
        <Center>
          <Text color="red.500">Có lỗi xảy ra: {error}</Text>
        </Center>
      </Container>
    );
  }

  return (
    <>
      <SlideShow listings={listings.slice(0, 5)} />
      
      {loading && (
        <Progress
          size="xs"
          isIndeterminate
          colorScheme="red"
          position="fixed"
          top={0}
          left={0}
          w="full"
          zIndex={9999}
        />
      )}

      <Container maxW={"1200px"} py={8}>
        <Grid templateColumns={{ base: "1fr", lg: "350px 1fr" }} gap={8}>
          
          <GridItem>
            <SearchOpt />
          </GridItem>

          <GridItem>
            <SortViewOpts
              listings={listings}
              
              // Props Sort
              sortBy={sortBy}
              setSortBy={handleSortChange} 

              // Props Type (MỚI - Đừng quên truyền cái này)
              auctionStatus={auctionStatus}
              setAuctionStatus={handleTypeChange}

              viewType={viewType}
              setViewType={setViewType}
              countText="phiên đấu giá phù hợp"
            />

            <Box 
              minH="400px"
              opacity={loading ? 0.6 : 1} 
              transition="opacity 0.2s"
              pointerEvents={loading ? "none" : "auto"}
              position="relative"
            >
              {loading && listings.length === 0 ? (
                 <Center minH="400px">
                    <Spinner size="xl" thickness="4px" speed="0.65s" emptyColor="gray.200" color="red.500" />
                 </Center>
              ) : (!listings || listings.length === 0) ? (
                <Center minH="400px">
                  <Text fontSize="lg" color="gray.500">
                    Không tìm thấy phiên đấu giá nào phù hợp với bộ lọc.
                  </Text>
                </Center>
              ) : viewType === "list" ? (
                <VStack spacing={6} align="stretch">
                  {listings.map((l) => (
                    <Box key={l._id}>
                      <HorizontalListingCard listing={l} />
                    </Box>
                  ))}
                </VStack>
              ) : (
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                  {listings.map((l) => (
                    <Box key={l._id}>
                      <ListingCard listing={l} />
                    </Box>
                  ))}
                </SimpleGrid>
              )}
            </Box>
          </GridItem>
        </Grid>
      </Container>
    </>
  );
};

export default AllListings;