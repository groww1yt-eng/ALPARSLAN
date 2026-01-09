import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { handleAppError } from "@/lib/errorHandler";

// Global Error Listeners
// Catch unhandled promise rejections (async errors)
window.addEventListener('unhandledrejection', (event) => {
  handleAppError(event.reason, { title: 'Unexpected Error', defaultMessage: 'An unexpected error occurred' });
});

// Catch standard runtime errors
window.addEventListener('error', (event) => {
  const err = (event as ErrorEvent).error ?? (event as ErrorEvent).message;
  handleAppError(err, { title: 'Unexpected Error', defaultMessage: 'An unexpected error occurred' });
});

// React entry point
// Mounts the App component to the DOM element with id 'root'
createRoot(document.getElementById("root")!).render(<App />);
