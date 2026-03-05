// ABOUTME: Utility functions shared across the app.
// ABOUTME: Provides cn() for conditional className merging.

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
