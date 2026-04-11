import { useState } from 'react';
import { X, ArrowRight, ArrowLeft, Check } from 'lucide-react';

interface OnboardingModalProps {
  onComplete: () => void;
  onSkip: () => void;
}

const steps = [
  {
    title: 'Welcome to DormLife! 🏠',
    description: 'Your all-in-one platform for dorm living. Let us show you around!',
    features: [
      'Connect with dorm mates',
      'Buy & sell items',
      'Track laundry machines',
      'Join events & activities',
    ],
  },
  {
    title: 'Stay Connected 💬',
    description: 'Chat with your dorm community in real-time',
    features: [
      'Private messaging with other students',
      'Dorm-specific group chats',
      'Global chat for all dorms',
      'Real-time notifications',
    ],
  },
  {
    title: 'Marketplace & More 🛍️',
    description: 'Everything you need for dorm life',
    features: [
      'Buy and sell items with ease',
      'Propose trades with other students',
      'Check laundry machine availability',
      'Create and join dorm events',
    ],
  },
];

export function OnboardingModal({ onComplete, onSkip }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const step = steps[currentStep];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white relative">
          <button
            onClick={onSkip}
            className="absolute top-4 right-4 text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center justify-center mb-4">
            <div className="flex gap-2">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 rounded-full transition-all ${
                    index === currentStep
                      ? 'w-8 bg-white'
                      : index < currentStep
                      ? 'w-2 bg-white opacity-70'
                      : 'w-2 bg-white opacity-30'
                  }`}
                />
              ))}
            </div>
          </div>

          <h2 className="text-2xl font-bold text-center mb-2">{step.title}</h2>
          <p className="text-blue-100 text-center">{step.description}</p>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="space-y-4 mb-8">
            {step.features.map((feature, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                  <Check className="w-4 h-4 text-blue-600" />
                </div>
                <p className="text-gray-700 flex-1">{feature}</p>
              </div>
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className="flex gap-3">
            {currentStep > 0 && (
              <button
                onClick={handlePrevious}
                className="flex items-center gap-2 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Previous
              </button>
            )}
            
            <button
              onClick={handleNext}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              {currentStep === steps.length - 1 ? (
                <>
                  Get Started
                  <Check className="w-5 h-5" />
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>

          {/* Skip Button */}
          <div className="text-center mt-4">
            <button
              onClick={onSkip}
              className="text-sm text-gray-600 hover:text-gray-900 hover:underline"
            >
              Skip tutorial
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
