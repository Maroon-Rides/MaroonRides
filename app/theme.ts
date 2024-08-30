
export interface Theme {
    mode: 'light' | 'dark',
    text: string,
    subtitle: string,
    background: string,
    divider: string,
    exitButton: string,
    nextStopBubble: string,
    secondaryBackground: string,
    tertiaryBackground: string,
    alertSymbol: string,
    starColor: string,
    timetableRowA: string,
    timetableRowB: string,
    pillBorder: string,
    myLocation: string,
    busTints: {[key: string] : string}
    error: string
    androidSegmentedBackground: string
    androidTextPlaceholderColor: string
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
    myLocation: "#007afe",
    error: "#ff3b2f",

    androidSegmentedBackground: "#eeeef0",
    androidTextPlaceholderColor: "#525254",

    busTints: {
        "47": "#2e8545",
    }
}

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
    myLocation: "#0a84ff",
    error: "#fe453b",

    androidSegmentedBackground: "#323137",
    androidTextPlaceholderColor: "#58585a",

    busTints: {
        "01-04": "#fe453a",
        "03": "#03a8e4",
        "03-05": "#0285ff",
        "04": "#ff9500",
        "05": "#a387ff",
        "06": "#d15cff",
        "07": "#e9b11a",
        "08": "#619bff",
        "12": "#04bcef",
        "15": "#34d070",
        "22": "#dca200",
        "27": "#29c753",
        "G31": "#28c3d8",
        "34": "#ff649a",
        "35": "#ff9500",
        "G35": "#ff9500",
        "36": "#00a2ff",
        "40": "#2da9de",
        "47-48": "#d187ff",
        "47": "#05d56d",
        "48": "#05d56d",
        "WR": "#05d56d",
        "PARA": "#7bd1ff",
        "BRY": "#2da9de",
    }
}

export const DarkGoogleMaps = [
    {
        "elementType": "geometry",
        "stylers": [
        {
            "color": "#212121"
        }
        ]
    },
    {
        "elementType": "labels.icon",
        "stylers": [
        {
            "visibility": "off"
        }
        ]
    },
    {
        "elementType": "labels.text.fill",
        "stylers": [
        {
            "color": "#757575"
        }
        ]
    },
    {
        "elementType": "labels.text.stroke",
        "stylers": [
        {
            "color": "#212121"
        }
        ]
    },
    {
        "featureType": "administrative",
        "elementType": "geometry",
        "stylers": [
        {
            "color": "#757575"
        }
        ]
    },
    {
        "featureType": "administrative.country",
        "elementType": "labels.text.fill",
        "stylers": [
        {
            "color": "#9e9e9e"
        }
        ]
    },
    {
        "featureType": "administrative.land_parcel",
        "stylers": [
        {
            "visibility": "off"
        }
        ]
    },
    {
        "featureType": "administrative.locality",
        "elementType": "labels.text.fill",
        "stylers": [
        {
            "color": "#bdbdbd"
        }
        ]
    },
    {
        "featureType": "poi",
        "elementType": "labels.text.fill",
        "stylers": [
        {
            "color": "#757575"
        }
        ]
    },
    {
        "featureType": "poi.park",
        "elementType": "geometry",
        "stylers": [
        {
            "color": "#181818"
        }
        ]
    },
    {
        "featureType": "poi.park",
        "elementType": "labels.text.fill",
        "stylers": [
        {
            "color": "#616161"
        }
        ]
    },
    {
        "featureType": "poi.park",
        "elementType": "labels.text.stroke",
        "stylers": [
        {
            "color": "#1b1b1b"
        }
        ]
    },
    {
        "featureType": "road",
        "elementType": "geometry.fill",
        "stylers": [
        {
            "color": "#2c2c2c"
        }
        ]
    },
    {
        "featureType": "road",
        "elementType": "labels.text.fill",
        "stylers": [
        {
            "color": "#8a8a8a"
        }
        ]
    },
    {
        "featureType": "road.arterial",
        "elementType": "geometry",
        "stylers": [
        {
            "color": "#373737"
        }
        ]
    },
    {
        "featureType": "road.highway",
        "elementType": "geometry",
        "stylers": [
        {
            "color": "#3c3c3c"
        }
        ]
    },
    {
        "featureType": "road.highway.controlled_access",
        "elementType": "geometry",
        "stylers": [
        {
            "color": "#4e4e4e"
        }
        ]
    },
    {
        "featureType": "road.local",
        "elementType": "labels.text.fill",
        "stylers": [
        {
            "color": "#616161"
        }
        ]
    },
    {
        "featureType": "transit",
        "elementType": "labels.text.fill",
        "stylers": [
        {
            "color": "#757575"
        }
        ]
    },
    {
        "featureType": "water",
        "elementType": "geometry",
        "stylers": [
        {
            "color": "#000000"
        }
        ]
    },
    {
        "featureType": "water",
        "elementType": "labels.text.fill",
        "stylers": [
        {
            "color": "#3d3d3d"
        }
        ]
    }
]
