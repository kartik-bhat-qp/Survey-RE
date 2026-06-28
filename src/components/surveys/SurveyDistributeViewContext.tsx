'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  getDefaultDistributeChannel,
  getDefaultEmailSidebarItem,
  type DistributeChannelId,
  type EmailSidebarId,
} from '@/data/mock-survey-distribute';

interface SurveyDistributeViewContextValue {
  activeChannel: DistributeChannelId;
  activeEmailSidebar: EmailSidebarId;
  setActiveChannel: (channel: DistributeChannelId) => void;
  setActiveEmailSidebar: (item: EmailSidebarId) => void;
}

const SurveyDistributeViewContext = createContext<SurveyDistributeViewContextValue | null>(
  null
);

export function SurveyDistributeViewProvider({ children }: { children: ReactNode }) {
  const [activeChannel, setActiveChannel] = useState<DistributeChannelId>(
    getDefaultDistributeChannel()
  );
  const [activeEmailSidebar, setActiveEmailSidebar] = useState<EmailSidebarId>(
    getDefaultEmailSidebarItem()
  );

  const handleSetActiveChannel = useCallback((channel: DistributeChannelId) => {
    setActiveChannel(channel);
    if (channel === 'email') {
      setActiveEmailSidebar(getDefaultEmailSidebarItem());
    }
  }, []);

  const value = useMemo(
    () => ({
      activeChannel,
      activeEmailSidebar,
      setActiveChannel: handleSetActiveChannel,
      setActiveEmailSidebar,
    }),
    [activeChannel, activeEmailSidebar, handleSetActiveChannel]
  );

  return (
    <SurveyDistributeViewContext.Provider value={value}>
      {children}
    </SurveyDistributeViewContext.Provider>
  );
}

export function useSurveyDistributeView(): SurveyDistributeViewContextValue {
  const context = useContext(SurveyDistributeViewContext);
  if (!context) {
    throw new Error(
      'useSurveyDistributeView must be used within SurveyDistributeViewProvider'
    );
  }
  return context;
}
