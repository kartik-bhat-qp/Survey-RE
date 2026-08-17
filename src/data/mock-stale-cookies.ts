export type StaleCookiePlatform = 'Desktop' | 'Mobile';

export type StaleCookieBrowser = 'Chrome' | 'Safari' | 'Firefox';

export const STALE_COOKIE_PLATFORMS: StaleCookiePlatform[] = ['Desktop', 'Mobile'];

export const STALE_COOKIE_BROWSERS: StaleCookieBrowser[] = ['Chrome', 'Safari', 'Firefox'];

export const STALE_COOKIE_STEPS: Record<
  StaleCookieBrowser,
  Record<StaleCookiePlatform, string[]>
> = {
  Chrome: {
    Desktop: [
      'Click the three dots in the top-right corner, then Settings.',
      'Go to Privacy and security, then Clear browsing data.',
      'Select Cookies and other site data, set range to All time, then Clear data.',
      'Reload the survey link.',
    ],
    Mobile: [
      'Tap the three dots menu, then Settings.',
      'Tap Privacy and security, then Clear browsing data.',
      'Select Cookies, site data, set range to All time, then tap Clear data.',
      'Reload the survey link.',
    ],
  },
  Safari: {
    Desktop: [
      'Open Safari Settings, then Privacy.',
      'Click Manage Website Data, search for the survey domain, and remove it.',
      'Or enable the Develop menu in Advanced settings, then use Develop, Empty Caches.',
      'Reload the survey link.',
    ],
    Mobile: [
      'On the device, open Settings, then scroll down to Safari.',
      'Tap Advanced, then Website Data.',
      'Search for the survey domain and swipe to remove it, or tap Remove All Website Data.',
      'Reload the survey link.',
    ],
  },
  Firefox: {
    Desktop: [
      'Click the menu icon in the top-right corner, then Settings.',
      'Go to Privacy and Security, then Cookies and Site Data, then Clear Data.',
      'Check Cookies and Site Data, then click Clear.',
      'Reload the survey link.',
    ],
    Mobile: [
      'Tap the three dots menu, then Settings.',
      'Tap Delete browsing data.',
      'Select Cookies and site data, then tap Delete browsing data.',
      'Reload the survey link.',
    ],
  },
};

export const DEFAULT_STALE_COOKIE_BROWSER: StaleCookieBrowser = 'Chrome';

export const DEFAULT_STALE_COOKIE_PLATFORM: StaleCookiePlatform = 'Desktop';

export const STALE_COOKIE_PAGE_COPY = {
  title: 'This survey link needs a fresh page load',
  description:
    'This usually happens when your browser holds on to an old cookie from a previous survey session. Reload the page below to clear it.',
  reloadLabel: 'Reload the survey',
  reloadHint: 'Clears local site data for this page, then tries again',
  manualStepsLabel: 'If that did not work, try clearing cookies manually',
  incognitoHint:
    'Or open the survey link in a private/incognito window, which always starts with a clean slate.',
};
