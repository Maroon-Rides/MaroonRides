export interface Theme {
    mode: 'light' | 'dark',
    text: string,
    subtitle: string,
    background: string,
    divider: string,
    exitButton: string,
    nextStopBubble: string,
    secondaryBackground: string,
    alertSymbol: string,
    starColor: string,
    timetableRowA: string,
    timetableRowB: string,
    pillBorder: string,
    busTints: {[key: string] : string}
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
    alertSymbol: '#FFC700',
    starColor: '#ffcc00',
    timetableRowA: 'white',
    timetableRowB: '#efefef',
    pillBorder: 'lightgrey',
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
    alertSymbol: '#ffce0a',
    starColor: '#ffd60a',
    timetableRowA: '#1c1c1e',
    timetableRowB: '#2c2c2e',
    pillBorder: '#686867',
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
        "34": "#ff649a",
        "35": "#ff9500",
        "36": "#00a2ff",
        "40": "#2da9de",
        "47-48": "#d187ff",
        "47": "#05d56d",
        "48": "#05d56d",
    }
}

