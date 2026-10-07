function requireEnvironmentVariable(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export class PayPalRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly stage: "authentication" | "api",
    readonly issueCodes: string[] = []
  ) {
    super(message);
    this.name = "PayPalRequestError";
  }
}

async function readPayPalError(response: Response) {
  let body: {
    name?: string;
    error?: string;
    details?: Array<{ issue?: string }>;
  } = {};
  try {
    body = await response.json();
  } catch {
    // The status code remains useful if PayPal returned a non-JSON error.
  }

  return {
    name: body.name || body.error || "UNKNOWN",
    issueCodes: (body.details || [])
      .map((detail) => detail.issue)
      .filter((issue): issue is string => !!issue),
  };
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
    const details = await readPayPalError(response);
    console.error("PayPal OAuth request failed:", {
      status: response.status,
      name: details.name,
    });
    throw new PayPalRequestError(
      "PayPal authentication failed.",
      response.status,
      "authentication"
    );
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
    const details = await readPayPalError(response);
    console.error("PayPal API request failed:", {
      status: response.status,
      name: details.name,
      issueCodes: details.issueCodes,
    });
    throw new PayPalRequestError(
      "PayPal could not complete the request.",
      response.status,
      "api",
      details.issueCodes
    );
  }
  if (response.status === 204) return null as T;
  return (await response.json()) as T;
}
