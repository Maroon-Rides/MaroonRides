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
}

export const lightMode: Theme = {
    mode: 'light',
    background: '#fff',
    subtitle: 'gray',
    text: '#000',
    divider: '#e5e5ea',
    exitButton: 'gray',
    nextStopBubble: 'lightgrey',
    secondaryBackground: '#e5e5ea',
    alertSymbol: '#ff3b30',
    starColor: '#ffcc00',
    timetableRowA: 'white',
    timetableRowB: '#efefef',
}

export const darkMode: Theme = {
    mode: 'dark',
    background: '#1c1c1e',
    subtitle: '#d1d1d6',
    text: '#fff',
    divider: '#48484a',
    exitButton: 'gray',
    nextStopBubble: '#48484a',
    secondaryBackground: '#48484a',
    alertSymbol: '#3a3a3d',
    starColor: '#ffd60a',
    timetableRowA: '#1c1c1e',
    timetableRowB: '#2c2c2e',
}

