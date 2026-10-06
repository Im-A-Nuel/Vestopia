export const isPasskeySupported = (): boolean =>
  typeof window !== "undefined" && typeof window.PublicKeyCredential !== "undefined";

export const generateAddress = (): string => {
  const bytes = new Uint8Array(20);
  window.crypto.getRandomValues(bytes);
  return `0x${Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
};
