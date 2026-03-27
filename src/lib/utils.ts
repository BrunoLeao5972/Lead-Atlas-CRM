import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPhoneWithDdd(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);

  if (digits.length <= 2) return digits;

  const ddd = digits.slice(0, 2);
  const tail = digits.slice(2);

  if (tail.length <= 4) return `(${ddd}) ${tail}`;
  if (tail.length <= 8) return `(${ddd}) ${tail.slice(0, 4)}-${tail.slice(4)}`;
  return `(${ddd}) ${tail.slice(0, 5)}-${tail.slice(5)}`;
}
