import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import { supabaseAdmin } from "./supabase";
import { getSessionCookieOptions } from "./cookies";
import * as db from "../db";
import { sdk } from "./sdk";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {
  /**
   * Supabase OAuth callback
   * Handles redirect from Supabase Auth after user authorizes.
   * Exchanges auth code for a Supabase session, then creates a local session.
   */
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    const provider = getQueryParam(req, "provider") as "google" | "facebook" | "apple" | "microsoft" | undefined;

    if (!code) {
      res.status(400).json({ error: "OAuth code is required" });
      return;
    }

    try {
      // Exchange code for Supabase session
      const { data: sessionData, error: sbError } =
        await supabaseAdmin.auth.exchangeCodeForSession(code);

      if (sbError || !sessionData.session) {
        console.error("[OAuth/Supabase] Session exchange failed:", sbError);
        res.redirect("/?auth_error=session_exchange_failed");
        return;
      }

      const sbUser = sessionData.user;
      const sbId = sbUser.id;
      const email = sbUser.email ?? null;
      const name = sbUser.user_metadata?.full_name ?? sbUser.user_metadata?.name ?? null;
      const loginMethod = provider || (sbUser.app_metadata?.provider ?? "supabase");

      // Upsert user in local DB (links local account to Supabase UID)
      const localUser = await db.upsertUser({
        openId: sbId,
        name,
        email,
        loginMethod,
        lastSignedIn: new Date(),
      });

      // Create a local session token for the app (existing Manus session flow)
      const localSessionToken = await sdk.createSessionToken(sbId, {
        name: name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, localSessionToken, {
        ...cookieOptions,
        maxAge: ONE_YEAR_MS,
      });

      // Decode redirect path from state if provided
      let redirectTo = "/";
      if (state) {
        try {
          const decoded = JSON.parse(atob(state));
          redirectTo = decoded.redirectUri || "/";
        } catch {
          // Invalid state, stay on homepage
        }
      }

      res.redirect(302, redirectTo);
    } catch (error) {
      console.error("[OAuth] Callback failed:", error);
      res.redirect("/?auth_error=callback_failed");
    }
  });

  /**
   * Initiate Supabase OAuth login — redirects to Supabase Auth page.
   * Query params: provider (google|facebook|apple|microsoft), redirectUri
   */
  app.get("/api/oauth/authorize", async (req: Request, res: Response) => {
    const provider = getQueryParam(req, "provider") as "google" | "facebook" | "apple" | "microsoft";
    const redirectUri = getQueryParam(req, "redirectUri") ||
      `${req.protocol}://${req.get("host")}/api/oauth/callback`;

    if (!provider) {
      res.status(400).json({ error: "provider is required" });
      return;
    }

    const { data, error } = await supabaseAdmin.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
        skipBrowserRedirect: true,
        scopes: provider === "google"
          ? "openid email profile"
          : provider === "apple"
          ? "email name"
          : undefined,
      },
    });

    if (error || !data.url) {
      console.error("[OAuth/Authorize] Failed to get OAuth URL:", error);
      res.status(500).json({ error: "Failed to initiate OAuth flow" });
      return;
    }

    res.redirect(302, data.url);
  });

  /**
   * Existing Manus SDK callback — preserved for backwards compatibility
   * during migration.
   */
  app.get("/api/oauth/manus-callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? "manus",
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Manus callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}
