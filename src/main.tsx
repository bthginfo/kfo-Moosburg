
  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import { initBooking } from "./config/booking";
  import "./styles/index.css";

  initBooking();

  createRoot(document.getElementById("root")!).render(<App />);
