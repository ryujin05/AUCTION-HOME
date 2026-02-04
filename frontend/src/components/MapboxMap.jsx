import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
import { ChakraProvider } from "@chakra-ui/react";
import MapboxDirections from "@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions";
import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";
import "@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions.css";
import { useColorMode } from "@chakra-ui/react";

import { createRoot } from "react-dom/client";
import { useNavigate } from "react-router-dom";
import { Box } from "@chakra-ui/react";
import { Global, css } from "@emotion/react";

import ListingPopup from "./ListingPopup.jsx";

const MapboxMap = ({
  mode = "view",
  data = [],
  initialCoords = [105.854444, 21.028511],
  onLocationSelect,
  height = "400px",
}) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const geocoderRef = useRef(null);
  const markersArrayRef = useRef([]);
  const directionsRef = useRef(null);
  const geolocateRef = useRef(null);
  const mapClickFnRef = useRef(null);
  const { colorMode } = useColorMode();

  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = import.meta.env.VITE_MAPBOX_TOKEN;
    // console.log("ENV:", import.meta.env);
    if (!token) {
      console.error("❌ VITE_MAPBOX_TOKEN is missing");
      return;
    }
    mapboxgl.accessToken = token;
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    const timer = setTimeout(() => {
      mapRef.current.resize();
    }, 200);

    return () => clearTimeout(timer);
  }, [height, mode, isMapLoaded]);

  const GlobalStyles = css`
    .mapboxgl-ctrl-geocoder--input {
      padding-left: 36px !important; /* Đẩy chữ sang phải để tránh icon */
      padding-top: 6px !important; /* Căn chỉnh dọc cho đẹp */
      padding-bottom: 6px !important;
    }

    .mapboxgl-ctrl-geocoder--icon-search {
      top: 10px !important;
      left: 10px !important;
    }
    .mapboxgl-popup-content {
      padding: 0 !important;
      background: transparent !important;
      box-shadow: none !important;
    }
    .mapboxgl-popup-close-button {
      display: none !important;
    }
    .mapboxgl-marker {
      cursor: pointer;
    }
    .mapboxgl-marker:hover svg {
      transform: scale(1.3);
      transition: transform 0.2s ease;
    }
  `;

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    if (!mapboxgl.accessToken) return;

    const mapStyle =
      colorMode === "dark"
        ? "mapbox://styles/mapbox/dark-v11"
        : "mapbox://styles/mapbox/streets-v12";

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: mapStyle,
      center: initialCoords,
      zoom: mode === "explorer" ? 10 : 13,
    });

    mapRef.current.on("load", () => {
      setIsMapLoaded(true);
      mapRef.current.addControl(
        new mapboxgl.NavigationControl(),
        "bottom-right"
      );
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  const cleanUp = () => {
    markerRef.current?.remove();
    markerRef.current = null;

    markersArrayRef.current.forEach((m) => m.remove());
    markersArrayRef.current = [];

    if (geocoderRef.current) {
      mapRef.current.removeControl(geocoderRef.current);
      geocoderRef.current = null;
    }

    if (directionsRef.current) {
      mapRef.current.removeControl(directionsRef.current);
      directionsRef.current = null;
    }

    if (geolocateRef.current) {
      mapRef.current.removeControl(geolocateRef.current);
      geolocateRef.current = null;
    }

    if (mapClickFnRef.current) {
      mapRef.current.off("click", mapClickFnRef.current);
      mapClickFnRef.current = null;
    }
  };

  useEffect(() => {
    if (!isMapLoaded || !mapRef.current) return;
    cleanUp();

    if (mode === "picker") setupPickerMode();
    if (mode === "view") setupViewMode();
    if (mode === "explorer") setupExplorerMode();
    if (mode === "directions") setupDirectionsMode();
  }, [isMapLoaded, mode, JSON.stringify(data), JSON.stringify(initialCoords)]);

  const setupPickerMode = () => {
    const updateMarkerAndSelect = (lng, lat, addressName) => {
      if (markerRef.current) markerRef.current.remove();

      markerRef.current = new mapboxgl.Marker({
        color: "#E53935",
        draggable: true,
      })
        .setLngLat([lng, lat])
        .addTo(mapRef.current);

      markerRef.current.on("dragend", () => {
        const { lng, lat } = markerRef.current.getLngLat();
        onLocationSelect?.(lng, lat, "Vị trí đã ghim");
      });

      onLocationSelect?.(lng, lat, addressName || "Vị trí đã chọn");

      mapRef.current.flyTo({
        center: [lng, lat],
        zoom: 15,
        speed: 0.5,
        curve: 1.5,
      });
    };

    geocoderRef.current = new MapboxGeocoder({
      accessToken: mapboxgl.accessToken,
      mapboxgl,
      marker: false,
      countries: "vn",
    });

    mapRef.current.addControl(geocoderRef.current, "top-left");

    geocoderRef.current.on("result", (e) => {
      const [lng, lat] = e.result.center;
      updateMarkerAndSelect(lng, lat, e.result.place_name);
    });

    const onMapClick = (e) => {
      const { lng, lat } = e.lngLat;
      updateMarkerAndSelect(lng, lat, "Vị trí tùy chỉnh");
    };

    mapClickFnRef.current = onMapClick;
    mapRef.current.on("click", onMapClick);

    if (initialCoords) {
      updateMarkerAndSelect(
        initialCoords[0],
        initialCoords[1],
        "Vị trí hiện tại"
      );
    }
  };

  const setupViewMode = () => {
    markerRef.current = new mapboxgl.Marker({ color: "#E53935" })
      .setLngLat(initialCoords)
      .addTo(mapRef.current);
  };

  const setupExplorerMode = () => {
    data.forEach((item) => {
      if (!item.location?.coords?.coordinates) return;

      const marker = new mapboxgl.Marker({ color: "#E53935" })
        .setLngLat(item.location.coords.coordinates)
        .addTo(mapRef.current);

      marker.getElement().addEventListener("click", (e) => {
        e.stopPropagation();

        mapRef.current.flyTo({
          center: item.location.coords.coordinates,
          zoom: 17,
          speed: 1.2,
          curve: 1,
          essential: true,
        });

        const popupNode = document.createElement("div");
        const root = createRoot(popupNode);

        root.render(
          <ChakraProvider>
            <ListingPopup
              item={item}
              onNavigate={(id) => navigate(`/listings/${id}`)}
              onClose={() => popup.remove()}
            />
          </ChakraProvider>
        );

        const popup = new mapboxgl.Popup({
          closeButton: false,
          closeOnClick: true,
          offset: 25,
          maxWidth: "300px",
        })
          .setLngLat(item.location.coords.coordinates)
          .setDOMContent(popupNode)
          .addTo(mapRef.current);

        popup.on("close", () => {
          setTimeout(() => {
            if (root) {
              root.unmount();
            }
          }, 0);
        });
      });

      markersArrayRef.current.push(marker);
    });
  };

  const setupDirectionsMode = () => {
    directionsRef.current = new MapboxDirections({
      accessToken: mapboxgl.accessToken,
      unit: "metric",
      profile: "mapbox/driving",
      language: "vi",
    });

    mapRef.current.addControl(directionsRef.current, "top-left");
    directionsRef.current.setDestination(initialCoords);
  };

  useEffect(() => {
    if (!mapRef.current) return;
    const style =
      colorMode === "dark"
        ? "mapbox://styles/mapbox/navigation-night-v1"
        : "mapbox://styles/mapbox/outdoors-v12";
    mapRef.current.setStyle(style);
  }, [colorMode]);

  return (
    // <>
    //   <Global styles={GlobalStyles} />
    //   <Box
    //     ref={mapContainerRef}
    //     w="100%"
    //     h={height}
    //     borderRadius="md"
    //     overflow="hidden"
    //     border="1px solid"
    //     borderColor="gray.200"
    //   />
    // </>

    <>
      <Global styles={GlobalStyles} />
      <Box
        ref={mapContainerRef}
        w="100%"
        h={height}
        borderRadius="md"
        overflow="hidden"
        border="1px solid"
        borderColor="gray.200"
        position="relative"
        sx={{
          "& canvas": {
            outline: "none",
          },
          ".mapboxgl-ctrl-directions": {
            maxWidth: "300px",
            minWidth: "250px",
          },
        }}
      />
    </>
  );
};

export default MapboxMap;
