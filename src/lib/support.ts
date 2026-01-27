export const SUPPORT_MESSENGER_URL = "https://m.me/61577901386334";

export const openSupportMessenger = () => {
  if (typeof window === "undefined") return;
  window.open(SUPPORT_MESSENGER_URL, "_blank", "noopener,noreferrer");
};
