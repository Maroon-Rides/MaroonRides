import { getColorScheme } from 'src/utils';

export interface Theme {
  mode: 'light' | 'dark';
  text: string;
  subtitle: string;
  background: string;
  divider: string;
  exitButton: string;
  nextStopBubble: string;
  secondaryBackground: string;
  tertiaryBackground: string;
  alertSymbol: string;
  starColor: string;
  timetableRowA: string;
  timetableRowB: string;
  pillBorder: string;
  myLocation: string;
  busTints: { [key: string]: string };
  error: string;
  androidSegmentedBackground: string;
  androidTextPlaceholderColor: string;
}

export const lightMode: Theme = {
  mode: 'light',
  background: '#ffffff',
  subtitle: 'gray',
  text: '#000',
  divider: '#e5e5ea',
  exitButton: 'gray',
  nextStopBubble: 'lightgrey',
  secondaryBackground: '#f3f1f6',
  tertiaryBackground: '#f3f1f6',
  alertSymbol: '#FFC700',
  starColor: '#ffcc00',
  timetableRowA: 'white',
  timetableRowB: '#efefef',
  pillBorder: 'lightgrey',
  myLocation: '#007afe',
  error: '#ff3b2f',

  androidSegmentedBackground: '#eeeef0',
  androidTextPlaceholderColor: '#525254',

  busTints: {
    G26: '#2e8545',
    '47': '#2e8545',
  },
};

export const darkMode: Theme = {
  mode: 'dark',
  background: '#1c1c1e',
  subtitle: '#d1d1d6',
  text: '#ffffff',
  divider: '#48484a',
  exitButton: 'gray',
  nextStopBubble: '#48484a',
  secondaryBackground: '#48484a',
  tertiaryBackground: '#2c2c2e',
  alertSymbol: '#ffce0a',
  starColor: '#ffd60a',
  timetableRowA: '#1c1c1e',
  timetableRowB: '#2c2c2e',
  pillBorder: '#686867',
  myLocation: '#0a84ff',
  error: '#fe453b',

  androidSegmentedBackground: '#323137',
  androidTextPlaceholderColor: '#58585a',

  busTints: {
    '01-04': '#fe453a',
    '03': '#03a8e4',
    '03-05': '#0285ff',
    '04': '#ff9500',
    '05': '#a387ff',
    '06': '#d15cff',
    '07': '#e9b11a',
    '08': '#619bff',
    '12': '#04bcef',
    '15': '#34d070',
    '22': '#dca200',
    '27': '#29c753',
    G31: '#28c3d8',
    '34': '#ff649a',
    '35': '#ff9500',
    G35: '#ff9500',
    '36': '#00a2ff',
    '40': '#2da9de',
    '47-48': '#d187ff',
    '47': '#05d56d',
    '48': '#05d56d',
    WR: '#05d56d',
    PARA: '#7bd1ff',
    BRY: '#2da9de',
  },
};

export const DarkGoogleMaps = [
  {
    elementType: 'geometry',
    stylers: [
      {
        color: '#242f3e',
      },
    ],
  },
  {
    elementType: 'labels.text.fill',
    stylers: [
      {
        color: '#746855',
      },
    ],
  },
  {
    elementType: 'labels.text.stroke',
    stylers: [
      {
        color: '#242f3e',
      },
    ],
  },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [
      {
        color: '#d59563',
      },
    ],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [
      {
        color: '#d59563',
      },
    ],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [
      {
        color: '#263c3f',
      },
    ],
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [
      {
        color: '#6b9a76',
      },
    ],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [
      {
        color: '#38414e',
      },
    ],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [
      {
        color: '#212a37',
      },
    ],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [
      {
        color: '#9ca5b3',
      },
    ],
  },
  {
    featureType: 'road.arterial',
    elementType: 'geometry.fill',
    stylers: [
      {
        color: '#666666',
      },
    ],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [
      {
        color: '#746855',
      },
    ],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [
      {
        color: '#1f2835',
      },
    ],
  },
  {
    featureType: 'road.highway',
    elementType: 'labels.text.fill',
    stylers: [
      {
        color: '#f3d19c',
      },
    ],
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [
      {
        color: '#2f3948',
      },
    ],
  },
  {
    featureType: 'transit.station',
    elementType: 'labels.text.fill',
    stylers: [
      {
        color: '#d59563',
      },
    ],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [
      {
        color: '#17263c',
      },
    ],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [
      {
        color: '#515c6d',
      },
    ],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.stroke',
    stylers: [
      {
        color: '#17263c',
      },
    ],
  },
];

export default async function getTheme(): Promise<Theme> {
  const colorTheme = (await getColorScheme()) === 'dark' ? darkMode : lightMode;
  return colorTheme;
}
