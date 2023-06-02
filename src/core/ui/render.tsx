import { Resvg } from '@resvg/resvg-js';
import { readFile } from 'fs';
import { ReactNode } from 'react';
import satori from 'satori';
import { WRAPPER_SIZE_WIDTHS, WrapperSize } from '../../components/Wrapper.js';

const FONT_NAME = 'Roboto';
const FONT_FILES = ['Roboto', 'Roboto-Bold', 'Roboto-Black'];

console.log('Importing fonts...');
const [robotoFlex, robotoFlexBold, robotoFlexBlack] = await Promise.all(
  FONT_FILES.map(
    (file) =>
      new Promise<Buffer>((resolve, reject) => {
        readFile(`src/assets/fonts/${file}.ttf`, (error, data) => {
          if (error) reject(error);
          resolve(data);
        });
      }),
  ),
);
console.log('Fonts imported');

export default async function render(
  element: ReactNode,
  size: WrapperSize = WrapperSize.Regular,
) {
  const svg = await satori(element, {
    width: WRAPPER_SIZE_WIDTHS[size],
    fonts: [
      { data: robotoFlex, name: FONT_NAME, weight: 400 },
      { data: robotoFlexBold, name: FONT_NAME, weight: 700 },
      { data: robotoFlexBlack, name: FONT_NAME, weight: 900 },
    ],
  });
  const png = new Resvg(svg).render().asPng();

  return png;
}
