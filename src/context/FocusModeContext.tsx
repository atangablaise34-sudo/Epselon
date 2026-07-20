import React, { createContext, useContext, useState, useEffect } from "react";
import { EventBus } from "../lib/EventBus";

interface FocusModeContextType {
  isFocusMode: boolean;
  toggleFocusMode: () => void;
}

const FocusModeContext = createContext<FocusModeContextType | undefined>(undefined);

export const FocusModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isFocusMode, setIsFocusMode] = useState(false);

  const toggleFocusMode = () => {
    setIsFocusMode((prev) => !prev);
  };

  useEffect(() => {
    if (isFocusMode) {
      EventBus.publish("FOCUS_MODE_ENTERED");
    } else {
      EventBus.publish("FOCUS_MODE_EXITED");
    }
  }, [isFocusMode]);

  return (
    <FocusModeContext.Provider value={{ isFocusMode, toggleFocusMode }}>
      {children}
    </FocusModeContext.Provider>
  );
};

export const useFocusMode = () => {
  const context = useContext(FocusModeContext);
  if (!context) {
    throw new Error("useFocusMode must be used within a FocusModeProvider");
  }
  return context;
};
