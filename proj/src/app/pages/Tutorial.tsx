import { useNavigate } from "react-router-dom";
import { useState } from "react";

const tutorialSteps = [
  {
    title: "Welcome to DormLife!",
    description: "Your reliable assistant for living in the dormitory. Everything in one place.",
    emoji: "🏠"
  },
  {
    title: "Marketplace",
    description: "Buy, sell, and trade items with your neighbors in a matter of minutes.",
    emoji: "🛒"
  },
  {
    title: "Laundry Control",
    description: "Forget about queues! Track your laundry machines in real-time.",
    emoji: "🧺"
  }
];

export const Tutorial = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  const handleNext = () => {
    if (step < tutorialSteps.length - 1) {
      setStep(step + 1);
    } else {
      localStorage.setItem("seenTutorial", "true");
      navigate("/login");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-6">
      <div className="max-w-md w-full bg-white/10 backdrop-blur-lg p-8 rounded-3xl shadow-2xl text-center border border-white/20">
        
        <div className="text-8xl mb-6 animate-bounce">{tutorialSteps[step].emoji}</div>
        
        <h1 className="text-3xl font-bold mb-4">{tutorialSteps[step].title}</h1>
        <p className="text-lg opacity-90 mb-8">{tutorialSteps[step].description}</p>

        <div className="flex justify-center gap-2 mb-8">
          {tutorialSteps.map((_, i) => (
            <div 
              key={i} 
              className={`h-2 w-2 rounded-full transition-all ${i === step ? "w-8 bg-white" : "bg-white/40"}`} 
            />
          ))}
        </div>

        <button 
          onClick={handleNext}
          className="w-full py-4 bg-white text-indigo-600 font-bold rounded-2xl hover:bg-indigo-50 transition-all transform hover:scale-[1.02] shadow-lg"
        >
          {step === tutorialSteps.length - 1 ? "Get Started" : "Next"}
        </button>
      </div>
    </div>
  );
};