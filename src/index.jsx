import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { MsalProvider } from "@azure/msal-react";
import { msalConfig } from "./authConfig";
import { PublicClientApplication } from "@azure/msal-browser";
import "./index.css";

const msalInstance = new PublicClientApplication(msalConfig);
await msalInstance.initialize();
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <MsalProvider instance={msalInstance}>
      <App />
    </MsalProvider>
  </StrictMode>
);
