function requireEnvironmentVariable(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getPayPalConfig() {
  const mode = process.env.PAYPAL_MODE || "sandbox";
  if (mode !== "sandbox" && mode !== "live") {
    throw new Error("PAYPAL_MODE must be either sandbox or live.");
  }

  return {
    apiBaseUrl:
      mode === "live"
        ? "https://api-m.paypal.com"
        : "https://api-m.sandbox.paypal.com",
    clientId: requireEnvironmentVariable("PAYPAL_CLIENT_ID"),
    clientSecret: requireEnvironmentVariable("PAYPAL_CLIENT_SECRET"),
    planId: requireEnvironmentVariable("PAYPAL_VIP_PLAN_ID"),
  };
}

export async function getPayPalAccessToken() {
  const config = getPayPalConfig();
  const credentials = Buffer.from(
    `${config.clientId}:${config.clientSecret}`
  ).toString("base64");
  const response = await fetch(`${config.apiBaseUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });

  if (!response.ok) {
    console.error("PayPal OAuth request failed with status:", response.status);
    throw new Error("Could not authenticate with PayPal.");
  }

  const result = (await response.json()) as { access_token?: string };
  if (!result.access_token) {
    throw new Error("PayPal did not return an access token.");
  }
  return { accessToken: result.access_token, config };
}

export async function paypalRequest<T>(
  apiBaseUrl: string,
  accessToken: string,
  path: string,
  init: RequestInit = {}
) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    console.error("PayPal API request failed with status:", response.status);
    throw new Error("PayPal could not complete the request.");
  }
  if (response.status === 204) return null as T;
  return (await response.json()) as T;
}
