import { useState, useEffect, useRef } from "react";
import { X, Copy, ExternalLink, CheckCircle, Clock, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface CryptoPaymentModalProps {
  packageName: string;
  priceUsd: number;
  coins: number;
  onClose: () => void;
  onPaymentComplete?: () => void;
}

interface CryptoPricing {
  bitcoin: { amount: string; currency: string };
  ethereum: { amount: string; currency: string };
  litecoin: { amount: string; currency: string };
  usdc: { amount: string; currency: string };
}

interface CryptoCharge {
  chargeId: string;
  chargeCode: string;
  hostedUrl: string;
  cryptoAddress: string;
  cryptoAmount: string;
  currency: string;
  pricing: CryptoPricing;
  expiresAt: string;
}

const cryptoOptions = [
  { id: "bitcoin" as const, name: "Bitcoin", symbol: "BTC", icon: "₿" },
  { id: "ethereum" as const, name: "Ethereum", symbol: "ETH", icon: "Ξ" },
  { id: "litecoin" as const, name: "Litecoin", symbol: "LTC", icon: "Ł" },
  { id: "usdc" as const, name: "USDC", symbol: "USDC", icon: "◎" },
];

type PaymentStatus = "idle" | "pending" | "confirmed" | "expired";

function generateQrUrl(data: string): string {
  return `https://chart.googleapis.com/chart?chs=220x220&cht=qr&chl=${encodeURIComponent(data)}&choe=UTF-8&chld=L|0`;
}

function formatTimeLeft(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const mins = Math.floor(diff / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function CryptoPaymentModal({
  packageName,
  priceUsd,
  coins,
  onClose,
  onPaymentComplete,
}: CryptoPaymentModalProps) {
  const [selectedCrypto, setSelectedCrypto] = useState<"bitcoin" | "ethereum" | "litecoin" | "usdc">("bitcoin");
  const [charge, setCharge] = useState<CryptoCharge | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState<PaymentStatus>("idle");
  const pollRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const createCharge = trpc.shop.createCryptoCharge.useMutation();
  const { refetch: checkStatus } = trpc.shop.getCryptoChargeStatus.useQuery(
    { chargeId: charge?.chargeId || "" },
    { enabled: false }
  );

  const selectedOption = cryptoOptions.find(o => o.id === selectedCrypto)!;
  const cryptoAmount = charge?.pricing?.[selectedCrypto]?.amount || "";
  const cryptoCurrency = charge?.pricing?.[selectedCrypto]?.currency || selectedCrypto.toUpperCase();

  // Start polling after charge created
  useEffect(() => {
    if (charge && status === "idle") {
      setStatus("pending");
      pollRef.current = setInterval(async () => {
        try {
          const result = await checkStatus();
          const chargeStatus = result.data?.status;
          if (chargeStatus === "confirmed" || chargeStatus === "completed") {
            setStatus("confirmed");
            clearInterval(pollRef.current);
            setTimeout(() => onPaymentComplete?.(), 2000);
          } else if (chargeStatus === "expired" || chargeStatus === "canceled") {
            setStatus("expired");
            clearInterval(pollRef.current);
          }
        } catch {}
      }, 5000);
    }
    return () => clearInterval(pollRef.current);
  }, [charge, status, checkStatus, onPaymentComplete]);

  const handleCreateCharge = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await createCharge.mutateAsync({
        packageName,
        priceUsd,
        coins,
      });
      setCharge(result as unknown as CryptoCharge);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment creation failed");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // ── Payment created view ──
  if (charge) {
    const isConfirmed = status === "confirmed";
    const isExpired = status === "expired";

    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
        <div className="glass-panel rounded-xl p-6 max-w-md w-full relative border-2" style={{ borderColor: isConfirmed ? "#4ADE80" : "#D4AF37" }}>
          <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded z-10">
            <X size={20} style={{ color: "#D4AF37" }} />
          </button>

          {/* Status indicator */}
          <div className="flex items-center gap-3 mb-5">
            {isConfirmed ? (
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(74,222,128,0.2)" }}>
                <CheckCircle size={22} style={{ color: "#4ADE80" }} />
              </div>
            ) : isExpired ? (
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(255,100,100,0.2)" }}>
                <Clock size={22} style={{ color: "#ff6464" }} />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(212,175,55,0.2)", animation: "pulse 2s infinite" }}>
                <Clock size={22} style={{ color: "#D4AF37" }} />
              </div>
            )}
            <div>
              <h2 className="text-xl font-display font-bold" style={{ color: "#FFD700" }}>
                {isConfirmed ? "Payment Received!" : isExpired ? "Payment Expired" : `Send ${selectedOption.symbol}`}
              </h2>
              <p className="text-xs" style={{ color: "rgba(245,230,200,0.6)" }}>
                {isConfirmed ? "Your coins are being added" : isExpired ? "Please create a new payment" : "Complete within the time limit"}
              </p>
            </div>
          </div>

          {!isConfirmed && !isExpired && (
            <>
              {/* QR Code */}
              <div className="bg-white rounded-lg p-3 mb-4 flex items-center justify-center">
                <img
                  src={generateQrUrl(charge.hostedUrl)}
                  alt="Payment QR Code"
                  className="w-48 h-48"
                  style={{ imageRendering: "pixelated" }}
                />
              </div>

              {/* Amount */}
              <div className="mb-4">
                <label className="text-xs mb-1 block" style={{ color: "#D4AF37" }}>Amount to Send</label>
                <div className="flex items-center justify-between p-3 rounded-lg bg-black/40 border" style={{ borderColor: "rgba(212,175,55,0.3)" }}>
                  <span className="font-numbers text-lg font-bold" style={{ color: "#F5E6C8" }}>{cryptoAmount}</span>
                  <span className="font-bold text-sm px-2 py-0.5 rounded" style={{ background: "rgba(212,175,55,0.15)", color: "#D4AF37" }}>{cryptoCurrency}</span>
                </div>
              </div>

              {/* Address */}
              <div className="mb-4">
                <label className="text-xs mb-1 block" style={{ color: "#D4AF37" }}>Send to Address</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={charge.cryptoAddress}
                    readOnly
                    className="flex-1 p-2.5 rounded-lg bg-black/40 border text-sm font-mono"
                    style={{ borderColor: "rgba(212,175,55,0.3)", color: "#F5E6C8" }}
                  />
                  <button
                    onClick={() => copyToClipboard(charge.cryptoAddress)}
                    className="p-2.5 rounded-lg hover:bg-white/10 transition border"
                    style={{ borderColor: "rgba(212,175,55,0.3)", color: "#D4AF37" }}
                  >
                    <Copy size={18} />
                  </button>
                </div>
                {copied && <span className="text-xs text-green-400 mt-1 flex items-center gap-1"><CheckCircle size={12} /> Copied!</span>}
              </div>

              {/* Timer */}
              <div className="mb-4 text-center">
                <div className="text-sm" style={{ color: "rgba(245,230,200,0.7)" }}>
                  Time remaining: <span className="font-bold font-numbers" style={{ color: "#FFD700" }}>{formatTimeLeft(charge.expiresAt)}</span>
                </div>
              </div>

              {/* Open in Coinbase */}
              <a
                href={charge.hostedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 transition hover:opacity-85 bg-gold-gradient text-black"
              >
                Open in Coinbase <ExternalLink size={16} />
              </a>

              {/* Scanning hint */}
              <p className="text-xs text-center mt-3" style={{ color: "rgba(212,175,55,0.5)" }}>
                Scan QR code with your wallet app or use the button above
              </p>
            </>
          )}

          {/* Confirmed state */}
          {isConfirmed && (
            <div className="py-6 text-center">
              <div className="text-5xl mb-3">🎉</div>
              <p className="text-sm" style={{ color: "rgba(245,230,200,0.7)" }}>
                +{coins.toLocaleString()} coins incoming!
              </p>
            </div>
          )}

          {/* Expired state */}
          {isExpired && (
            <div className="py-4">
              <button
                onClick={() => { setCharge(null); setStatus("idle"); }}
                className="w-full py-2.5 rounded-lg font-bold bg-gold-gradient text-black"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Currency selection view ──
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="glass-panel rounded-xl p-6 max-w-md w-full relative border-2" style={{ borderColor: "#D4AF37" }}>
        <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded z-10">
          <X size={20} style={{ color: "#D4AF37" }} />
        </button>

        <h2 className="text-2xl font-display font-bold mb-1" style={{ color: "#FFD700" }}>
          Pay with Crypto
        </h2>
        <p className="text-sm mb-5" style={{ color: "rgba(245,230,200,0.6)" }}>
          {packageName} • {coins.toLocaleString()} coins • ${(priceUsd / 100).toFixed(2)}
        </p>

        <div className="space-y-2 mb-5">
          {cryptoOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => setSelectedCrypto(option.id)}
              className="w-full p-3.5 rounded-lg border-2 transition flex items-center justify-between"
              style={{
                background: selectedCrypto === option.id
                  ? "rgba(212,175,55,0.15)"
                  : "rgba(212,175,55,0.04)",
                borderColor: selectedCrypto === option.id
                  ? "#D4AF37"
                  : "rgba(212,175,55,0.2)",
              }}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{option.icon}</span>
                <div className="text-left">
                  <div className="font-bold" style={{ color: "#FFD700" }}>{option.name}</div>
                  <div className="text-xs" style={{ color: "rgba(212,175,55,0.5)" }}>{option.symbol}</div>
                </div>
              </div>
              {selectedCrypto === option.id && (
                <div className="w-5 h-5 rounded-full" style={{ background: "#D4AF37" }} />
              )}
            </button>
          ))}
        </div>

        {error && (
          <div className="p-3 rounded-lg mb-4 bg-red-500/15 border border-red-500/40 text-sm text-red-300">
            {error}
          </div>
        )}

        <button
          onClick={handleCreateCharge}
          disabled={loading}
          className="w-full py-3 rounded-lg font-bold transition disabled:opacity-50 hover:opacity-85 bg-gold-gradient text-black"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 size={18} className="animate-spin" /> Creating Payment...
            </span>
          ) : (
            `Continue with ${selectedOption.name}`
          )}
        </button>

        <p className="text-xs text-center mt-4" style={{ color: "rgba(212,175,55,0.4)" }}>
          Powered by Coinbase Commerce
        </p>
      </div>
    </div>
  );
}
