import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { Providers } from "./providers";

// Create root container
const rootElement = document.getElementById("root");
const root = createRoot(rootElement!);

// Render the application with all providers
root.render(
  <Providers>
    <App />
  </Providers>
);
