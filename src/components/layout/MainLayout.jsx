import { Box } from "@mui/material";

import Sidebar from "./Sidebar";
import Header from "./Header";

export default function MainLayout({ user, children }) {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "#F5F7FB",
      }}
    >
      {/* ===================================================== */}
      {/* SIDEBAR                                                */}
      {/* ===================================================== */}

      <Sidebar user={user} />

      {/* ===================================================== */}
      {/* ОСНОВНАЯ ОБЛАСТЬ                                      */}
      {/* ===================================================== */}

      <Box
        sx={{
          marginLeft: "220px",
          minHeight: "100vh",

          display: "flex",
          flexDirection: "column",

          width: "calc(100% - 220px)",
        }}
      >
        {/* =================================================== */}
        {/* HEADER                                              */}
        {/* =================================================== */}

        <Header user={user} />

        {/* =================================================== */}
        {/* CONTENT                                             */}
        {/* =================================================== */}

        <Box
          component="main"
          sx={{
            flex: 1,

            width: "100%",
            boxSizing: "border-box",

            px: {
              xs: 2,
              sm: 3,
              md: 4,
            },

            py: {
              xs: 2,
              sm: 3,
            },
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}