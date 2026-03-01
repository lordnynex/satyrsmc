import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { ThemeProvider } from "./theme/ThemeProvider";
import "./styles/tailwind.css";
import "./styles/components.css";
import "./styles/fonts.css";
import "./styles/global.css";

const elem = document.getElementById("root")!;
createRoot(elem).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>
);
