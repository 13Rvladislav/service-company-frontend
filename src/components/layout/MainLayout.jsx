import { Box } from "@mui/material";
import Header from "./Header";
import Sidebar from "./Sidebar";

function MainLayout({ user, children }) {
  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#F4F7FB" }}>
      {/* Левое меню */}
      <Sidebar user={user} />

      {/* Правая часть */}
      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
        <Header user={user} />

        <Box sx={{ flexGrow: 1, p: 4 }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}

export default MainLayout;