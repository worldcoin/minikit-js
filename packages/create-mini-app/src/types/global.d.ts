declare global {
  interface Window {
    WorldApp?: any; // You might want to replace 'any' with a more specific type if available
  }
}

export {}; // This ensures the file is treated as a module
