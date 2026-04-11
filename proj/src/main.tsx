import React from "react";
import ReactDOM from "react-dom/client";
import App from "./app/App";
import "./styles/index.css"; 
import { GoogleOAuthProvider } from '@react-oauth/google';

// Заміни цей рядок на свій реальний ID, який ти отримаєш у Google Cloud Console
const GOOGLE_CLIENT_ID = "730646435364-mk70hgrbpbfr4kgnd55n3rhr11pmcbtj.apps.googleusercontent.com";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>
);