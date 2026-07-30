/**
 * Checkout Success Page
 * Handles the redirect from Square Checkout after payment
 */

import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { CheckCircle, Loader2, XCircle, Coins } from "lucide-react";

export default function CheckoutSuccess() {
  const [, navigate] = useLocation();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [coinsAdded, setCoinsAdded] = useState<number>(0);

  const verifyCheckout = trpc.shop.verifyCheckoutSuccess.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        setCoinsAdded(data.coinsAdded ?? 0);
        setStatus("success");
        // Redirect to home after 3 seconds
        setTimeout(() => navigate("/"), 3000);
      } else {
        setStatus("error");
        setErrorMessage("Payment verification failed");
      }
    },
    onError: (err) => {
      setStatus("error");
      setErrorMessage(err.message || "Failed to verify payment");
    },
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const purchaseId = params.get("purchaseId");
    if (purchaseId) {
      verifyCheckout.mutate({ purchaseId: parseInt(purchaseId, 10) });
    } else {
      setStatus("error");
      setErrorMessage("No purchase ID found");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center p-4"
      style={{
        background: "linear-gradient(160deg, #050510 0%, #0a0a1a 50%, #0d0a1a 100%)",
        height: "100dvh",
      }}
    >
      {/* Background decoration */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `url(https://d2xsxph8kpxj0f.cloudfront.net/310519663349960110/ayNoVaN9cNAqmUHUzZ966J/ritd-hero-bg-FzGNyPyAATYm9thgu9JZxr.webp)`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      <div
        className="relative z-10 max-w-md w-full p-8 rounded-2xl text-center"
        style={{
          background: "linear-gradient(135deg, #0d0d20, #1a1a35)",
          border: "2px solid #D4AF37",
          boxShadow: "0 0 40px rgba(212,175,55,0.4)",
        }}
      >
        {status === "loading" && (
          <>
            <Loader2
              size={64}
              className="mx-auto mb-4 animate-spin"
              style={{ color: "#D4AF37" }}
            />
            <h1
              className="text-2xl font-bold mb-2"
              style={{ fontFamily: "'Playfair Display', serif", color: "#D4AF37" }}
            >
              Processing Payment...
            </h1>
            <p style={{ color: "rgba(245,230,200,0.7)" }}>
              Please wait while we verify your payment and add coins to your account.
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle
              size={64}
              className="mx-auto mb-4"
              style={{ color: "#00FF00" }}
            />
            <h1
              className="text-2xl font-bold mb-2"
              style={{ fontFamily: "'Playfair Display', serif", color: "#00FF00" }}
            >
              Payment Successful!
            </h1>
            <div
              className="flex items-center justify-center gap-2 my-4 p-3 rounded-lg"
              style={{ background: "rgba(0,255,0,0.1)", border: "1px solid #00FF00" }}
            >
              <Coins size={24} style={{ color: "#00FF00" }} />
              <span className="text-xl font-bold" style={{ color: "#00FF00" }}>
                +{coinsAdded.toLocaleString()} Coins Added!
              </span>
            </div>
            <p style={{ color: "rgba(245,230,200,0.7)" }}>
              Redirecting you back to the game...
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle
              size={64}
              className="mx-auto mb-4"
              style={{ color: "#FF6B6B" }}
            />
            <h1
              className="text-2xl font-bold mb-2"
              style={{ fontFamily: "'Playfair Display', serif", color: "#FF6B6B" }}
            >
              Something Went Wrong
            </h1>
            <p style={{ color: "rgba(245,230,200,0.7)" }} className="mb-4">
              {errorMessage || "We couldn't verify your payment."}
            </p>
            <button
              onClick={() => navigate("/")}
              className="px-6 py-3 rounded-lg font-bold transition hover:opacity-80"
              style={{
                background: "linear-gradient(135deg, #D4AF37, #C8860A)",
                color: "#0a0a1a",
              }}
            >
              Return to Game
            </button>
          </>
        )}
      </div>

      {/* Footer */}
      <p
        className="mt-8 text-xs"
        style={{ color: "rgba(212,175,55,0.5)" }}
      >
        Rolling in the Dough © 2026
      </p>
    </div>
  );
}