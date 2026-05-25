import { DiscordSDK } from "@discord/embedded-app-sdk";

const clientId = import.meta.env.VITE_CLIENT_ID;

if (!clientId) {
  throw new Error("VITE_CLIENT_ID is not set");
}

export const discordSdk = new DiscordSDK(clientId);
