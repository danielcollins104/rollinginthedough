export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  // Square payment configuration
  squareAccessToken: process.env.SQUARE_ACCESS_TOKEN ?? "",
  squareLocationId: process.env.SQUARE_LOCATION_ID ?? "L2N0S3FA7EX8B", // Default to test location
  squareAppId: process.env.VITE_SQUARE_APP_ID ?? "",
};