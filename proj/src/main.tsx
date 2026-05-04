import React from "react";
import ReactDOM, { createRoot } from "react-dom/client";
import App from "./app/App";
import "./styles/index.css"; 
import { GoogleOAuthProvider } from '@react-oauth/google';


import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "https://3f298362c4dc244e731ab5d751a85447@o4511331609214976.ingest.de.sentry.io/4511331626451024s",
  // Setting this option to true will send default PII data to Sentry.
  // For example, automatic IP address collection on events
  sendDefaultPii: true
});

const container = document.getElementById("app");

// Заміни цей рядок на свій реальний ID, який ти отримаєш у Google Cloud Console
const GOOGLE_CLIENT_ID = "730646435364-81uhp2dosfbpq50lusmhjsnu3rikefpu.apps.googleusercontent.com";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>
);