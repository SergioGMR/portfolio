import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import fs from 'node:fs';
import path from 'node:path';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getFilesFromDirectory(directoryPath: string): string[] {
  const directory = path.resolve(directoryPath);
  try {
    return fs.readdirSync(directory);
  } catch (error) {
    console.error(`Error reading directory ${directory}:`, error);
    return [];
  }
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