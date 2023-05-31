'use client';

import { useEffect, useState } from 'react';
import React, { createContext, useContext } from 'react';

type FlashMessageType = 'success' | 'error' | 'warning';

export interface FlashMessage {
  type: FlashMessageType;
  heading: string;
  message: string;
}

interface FlashMessageContextType {
  flashMessage: FlashMessage | null;
  showFlashMessage: (message: FlashMessage) => void;
  clearFlashMessage: () => void;
}

const FlashMessageContext = createContext<FlashMessageContextType | null>(null);

export const FlashMessageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [flashMessage, setFlashMessage] = useState<FlashMessage | null>(null);

  useEffect(() => {
    console.log(flashMessage);
  }, [flashMessage]);

  const clearFlashMessage = () => {
    setFlashMessage(null);
  };

  const showFlashMessage = (message: FlashMessage) => {
    setFlashMessage(message);
    setTimeout(() => clearFlashMessage(), 50000);
  };

  const contextValue: FlashMessageContextType = {
    flashMessage,
    showFlashMessage,
    clearFlashMessage,
  };

  return <FlashMessageContext.Provider value={contextValue}>{children}</FlashMessageContext.Provider>;
};

export const useFlashMessage = (): FlashMessageContextType => {
  const context = useContext(FlashMessageContext);
  if (!context) {
    throw new Error('useFlashMessageContext must be used within a FlashMessageProvider');
  }
  return context;
};
