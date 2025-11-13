import * as Sentry from '@sentry/react-native';
import { Stack } from 'expo-router';

Sentry.init({
  dsn: 'https://d8ccf85b1558d0f561c4ece642d0d349@o4510359138205696.ingest.us.sentry.io/4510359139909632',

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  // Enable Logs
  enableLogs: false,

  // Configure Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [Sentry.mobileReplayIntegration()],

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});

function Layout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}

export default Sentry.wrap(Layout);
