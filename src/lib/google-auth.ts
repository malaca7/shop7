/**
 * Integração Oficial com a API do Google Identity Services (GIS)
 * Permite autenticação sem redirect_uri_mismatch via popup oficial OAuth2 do Google
 * e Google One Tap / ID Token.
 */

export const GOOGLE_CLIENT_ID =
  (import.meta.env.VITE_GOOGLE_CLIENT_ID as string) ||
  "636848592961-1jg2mu7ifjq4f5hb9o2f52ucjd5eft8c.apps.googleusercontent.com";

export interface GoogleUserData {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  email_verified?: boolean;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          prompt: (momentListener?: (notification: any) => void) => void;
          renderButton: (parent: HTMLElement, options: any) => void;
          disableAutoSelect: () => void;
          revoke: (hint: string, done: () => void) => void;
        };
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: {
              access_token?: string;
              error?: string;
              error_description?: string;
              error_uri?: string;
            }) => void;
            error_callback?: (error: any) => void;
          }) => {
            requestAccessToken: (overrideConfig?: { prompt?: string }) => void;
          };
        };
      };
    };
  }
}

/**
 * Garante que o script oficial do Google Identity Services está carregado.
 */
export function loadGoogleIdentityScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();

  if (window.google?.accounts?.oauth2) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
    if (existing) {
      if (window.google?.accounts?.oauth2) {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Falha ao carregar script do Google")));
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Não foi possível carregar a API do Google"));
    document.head.appendChild(script);
  });
}

/**
 * Decodifica o JWT retornado pelo Google Identity One-Tap / ID Token
 */
export function parseGoogleJwt(token: string): GoogleUserData | null {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const data = JSON.parse(jsonPayload);
    return {
      id: data.sub,
      email: data.email,
      full_name: data.name || data.email?.split("@")[0] || "Usuário Google",
      avatar_url: data.picture || null,
      email_verified: Boolean(data.email_verified),
    };
  } catch (e) {
    console.error("Erro ao decodificar token do Google:", e);
    return null;
  }
}

/**
 * Abre o popup oficial de autenticação do Google via OAuth2 Token Client
 * Elimina totalmente redirect_uri_mismatch pois não utiliza redirecionamento de URL.
 */
export async function promptGoogleOAuthPopup(): Promise<GoogleUserData> {
  await loadGoogleIdentityScript();

  if (!window.google?.accounts?.oauth2) {
    throw new Error("A API do Google não pôde ser inicializada no seu navegador.");
  }

  return new Promise((resolve, reject) => {
    let resolvedOrRejected = false;

    const tokenClient = window.google!.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: "email profile openid",
      callback: async (tokenResponse) => {
        if (resolvedOrRejected) return;

        if (tokenResponse.error) {
          resolvedOrRejected = true;
          if (tokenResponse.error === "popup_closed" || tokenResponse.error === "access_denied") {
            reject(new Error("POPUP_CLOSED"));
          } else {
            reject(new Error(tokenResponse.error_description || "Falha na autorização do Google."));
          }
          return;
        }

        if (!tokenResponse.access_token) {
          resolvedOrRejected = true;
          reject(new Error("Token do Google não recebido."));
          return;
        }

        try {
          // Consultar endpoint oficial de perfil do Google
          const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
            headers: {
              Authorization: `Bearer ${tokenResponse.access_token}`,
            },
          });

          if (!res.ok) {
            throw new Error(`Erro ao obter perfil do Google: ${res.statusText}`);
          }

          const info = await res.json();
          resolvedOrRejected = true;
          resolve({
            id: info.sub,
            email: info.email,
            full_name: info.name || info.email?.split("@")[0] || "Usuário Google",
            avatar_url: info.picture || null,
            email_verified: Boolean(info.email_verified),
          });
        } catch (err: any) {
          resolvedOrRejected = true;
          reject(err);
        }
      },
      error_callback: (err: any) => {
        if (resolvedOrRejected) return;
        resolvedOrRejected = true;
        if (err?.type === "popup_closed") {
          reject(new Error("POPUP_CLOSED"));
        } else {
          reject(new Error(err?.message || "Erro no popup do Google."));
        }
      },
    });

    try {
      tokenClient.requestAccessToken({ prompt: "select_account" });
    } catch (e: any) {
      resolvedOrRejected = true;
      reject(e);
    }
  });
}
