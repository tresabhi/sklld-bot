import { style, styleVariants } from '@vanilla-extract/css';

const MIN_WIDTH = 640 + 128;
const HEIGHT = 48;

export const hamburger = style({
  display: 'inline-flex',

  '@media': {
    [`screen and (min-width: ${MIN_WIDTH}px)`]: {
      display: 'none',
    },
  },
});

export const tools = style({
  display: 'none',

  '@media': {
    [`screen and (min-width: ${MIN_WIDTH}px)`]: {
      display: 'flex',
    },
  },
});

export const navbar = style({
  height: HEIGHT,
  marginBottom: -1, // 1px overlap with content to bleed color
  position: 'sticky',
  top: 0,
  zIndex: 1,
});

const navbarExpanderBase = style({
  transitionDuration: '250ms',
  height: '1000px',
  width: '100%',
  overflow: 'hidden',

  backdropFilter: 'blur(4rem) brightness(0.75)',
  WebkitBackdropFilter: 'blur(4rem) brightness(0.75)',

  '@media': {
    [`screen and (min-width: ${MIN_WIDTH}px)`]: {
      maxHeight: HEIGHT,
    },
  },
});

export const navbarExpander = styleVariants({
  false: [
    navbarExpanderBase,
    {
      maxHeight: HEIGHT,
    },
  ],
  true: [
    navbarExpanderBase,
    {
      maxHeight: '100vh',
    },
  ],
});

export const navbarContent = style({
  width: '100%',
  maxHeight: '100vh',
});
