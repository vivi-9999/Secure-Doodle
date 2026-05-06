import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { setBaseUrl } from "@workspace/api-client-react";

setBaseUrl(import.meta.env.BASE_URL?.replace(/\/$/, "") || "");

createRoot(document.getElementById("root")!).render(<App />);
