import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { handleAppError } from "@/lib/errorHandler";

window.addEventListener('unhandledrejection', (event) => {
  handleAppError(event.reason, { title: 'Unexpected Error', defaultMessage: 'An unexpected error occurred' });
});

window.addEventListener('error', (event) => {
  const err = (event as ErrorEvent).error ?? (event as ErrorEvent).message;
  handleAppError(err, { title: 'Unexpected Error', defaultMessage: 'An unexpected error occurred' });
});

createRoot(document.getElementById("root")!).render(<App />);
