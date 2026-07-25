const hostedPlatformVariables = ["RAILWAY_ENVIRONMENT", "VERCEL", "RENDER", "FLY_APP_NAME"];

export function isHostedDeployment(env = process.env) {
  return hostedPlatformVariables.some((name) => Boolean(env[name]));
}

/**
 * The implicit localhost super admin session is a local development convenience. A hosted
 * deployment must never grant it, even when it was started outside production mode.
 */
export function allowsLocalDevelopmentAccess(env = process.env) {
  return env.NODE_ENV !== "production" && !isHostedDeployment(env);
}
