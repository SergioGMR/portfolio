import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

function getRandomTailwindColor(): string {
  const randomColor = colors[Math.floor(Math.random() * colors.length)];
  const randomShade = shades[Math.floor(Math.random() * shades.length)];

  return `${randomColor}-${randomShade}`;
}

export function generateRandomGradient(): string {
  let color1 = getRandomTailwindColor();
  let color2 = getRandomTailwindColor();

  while (color1 === color2) {
    color2 = getRandomTailwindColor();
  }

  return `bg-gradient-to-br from-${color1} to-${color2}`;
}

export const colors = [
  'red', 'yellow', 'green', 'sky', 'purple', 'pink'
];
export const shades = ['100', '200', '300', '400', '500', '600', '700', '800', '900'];