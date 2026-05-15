import { Box } from "./Box.js";
import MainNavbar from "./MainNavbar.js";

export const Layout = ({ children }) => (
  <Box
    css={{
      maxW: "100%"
    }}
  >
    <MainNavbar />
    {children}
  </Box>
);