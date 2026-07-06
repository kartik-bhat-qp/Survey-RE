'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  getDefaultDistributeRouteState,
  getDistributeChannelPath,
  parseDistributeRouteFromPathname,
} from '@/components/surveys/survey-distribute-navigation';
import {
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

interface SurveyDistributeViewProviderProps {
  children: ReactNode;
  surveyId: number;
}

export function SurveyDistributeViewProvider({
  children,
  surveyId,
}: SurveyDistributeViewProviderProps) {
  const pathname = usePathname() ?? '';
  const router = useRouter();
  const routeFromPath =
    parseDistributeRouteFromPathname(pathname, surveyId) ?? getDefaultDistributeRouteState();

  const [activeChannel, setActiveChannelState] = useState<DistributeChannelId>(
    routeFromPath.channel
  );
  const [activeEmailSidebar, setActiveEmailSidebarState] = useState<EmailSidebarId>(
    routeFromPath.emailSidebar
  );

  useEffect(() => {
    setActiveChannelState(routeFromPath.channel);
    setActiveEmailSidebarState(routeFromPath.emailSidebar);
  }, [routeFromPath.channel, routeFromPath.emailSidebar]);

  const setActiveChannel = useCallback(
    (channel: DistributeChannelId) => {
      const emailSidebar =
        channel === 'email'
          ? activeChannel === 'email'
            ? activeEmailSidebar
            : getDefaultEmailSidebarItem()
          : getDefaultEmailSidebarItem();
      const targetPath = getDistributeChannelPath(surveyId, channel, emailSidebar);

      if (pathname !== targetPath) {
        router.push(targetPath);
      }

      setActiveChannelState(channel);
      if (channel === 'email') {
        setActiveEmailSidebarState(emailSidebar);
      }
    },
    [activeEmailSidebar, pathname, router, surveyId]
  );

  const setActiveEmailSidebar = useCallback(
    (item: EmailSidebarId) => {
      const targetPath = getDistributeChannelPath(surveyId, 'email', item);

      if (pathname !== targetPath) {
        router.push(targetPath);
      }

      setActiveChannelState('email');
      setActiveEmailSidebarState(item);
    },
    [pathname, router, surveyId]
  );

  const value = useMemo(
    () => ({
      activeChannel,
      activeEmailSidebar,
      setActiveChannel,
      setActiveEmailSidebar,
    }),
    [activeChannel, activeEmailSidebar, setActiveChannel, setActiveEmailSidebar]
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
