import { MediaQuery } from 'svelte/reactivity';

export const SIDE_SHEET_WIDTH_PX = 420;
export const SIDE_SHEET_GUTTER_PX = 16;
export const SIDE_SHEET_OCCUPIED_PX = SIDE_SHEET_WIDTH_PX + SIDE_SHEET_GUTTER_PX;

export const sideSheetLayout = new MediaQuery('(orientation: landscape) and (min-width: 768px)');
