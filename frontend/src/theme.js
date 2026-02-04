import { extendTheme } from "@chakra-ui/react";

const theme = extendTheme({
  styles: {
    global: {
      body: {
        bg: "gray.100",
        color: "gray.800",
      },
    },
  },
  components: {
    Button: {
      defaultProps: {
        colorScheme: "red",
      },
    },
    Badge: {
      defaultProps: {
        colorScheme: "red",
      },
    },
  },
});

export default theme;
