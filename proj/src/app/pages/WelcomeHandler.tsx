import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export const WelcomeHandler = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem("seenTutorial");
    const token = localStorage.getItem("token");

    if (!hasSeenTutorial) {
      navigate("/tutorial"); 
    } else if (!token) {
      navigate("/login");
    } else {
      navigate("/dashboard");
    }
  }, [navigate]);

  return null; 
};