/**
 * Crypto Payment Modal Component
 * Displays cryptocurrency payment options and QR codes
 */

import { useState } from "react";
import { X, Copy, ExternalLink } from "lucide-react";

interface CryptoPaymentModalProps {
  packageName: string;
  priceUsd: number;
  coins: number;
  onClose: () => void;
  onPaymentCreated: (chargeId: string, chargeCode: string) => void;
}

interface CryptoCharge {
  chargeId: string;
  chargeCode: string;
  addressUrl: string;
  cryptoAddress: string;
  cryptoAmount: string;
  currency: string;
  pricing: {
    bitcoin: string;
    ethereum: string;
    litecoin: string;
    usdc: string;
  };
  expiresAt: string;
}

export default function CryptoPaymentModal({
  packageName,
  priceUsd,
  coins,
  onClose,
  onPaymentCreated,
}: CryptoPaymentModalProps) {
  const [selectedCrypto, setSelectedCrypto] = useState<"bitcoin" | "ethereum" | "litecoin" | "usdc">("bitcoin");
  const [cryptoCharge, setCryptoCharge] = useState<CryptoCharge | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const cryptoOptions = [
    { id: "bitcoin", name: "Bitcoin", symbol: "BTC", icon: "₿" },
    { id: "ethereum", name: "Ethereum", symbol: "ETH", icon: "Ξ" },
    { id: "litecoin", name: "Litecoin", symbol: "LTC", icon: "Ł" },
    { id: "usdc", name: "USDC", symbol: "USDC", icon: "◎" },
  ];

  const handleCreateCharge = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/trpc/shop.createCryptoCharge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          packageName,
          priceUsd,
          coins,
        }),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to create payment charge");
      }

      const data = await response.json();
      const charge = data.result.data as CryptoCharge;
      setCryptoCharge(charge);
      onPaymentCreated(charge.chargeId, charge.chargeCode);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment creation failed");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (cryptoCharge) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
        <div
          className="rounded-lg p-6 max-w-md w-full relative"
          style={{
            background: "linear-gradient(135deg, #0d0d20, #1a1a35)",
            border: "2px solid #D4AF37",
          }}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded"
          >
            <X size={20} style={{ color: "#D4AF37" }} />
          </button>

          <h2 className="text-2xl font-bold mb-4" style={{ color: "#FFD700" }}>
            Send {selectedCrypto.toUpperCase()}
          </h2>

          <div className="bg-white p-4 rounded-lg mb-4 text-center">
            {/* QR Code placeholder - in production, generate actual QR code */}
            <div
              className="w-48 h-48 mx-auto bg-gray-200 rounded flex items-center justify-center mb-4"
              style={{ background: "#f0f0f0" }}
            >
              <span style={{ color: "#999" }}>QR Code</span>
            </div>
          </div>

          <div className="space-y-3 mb-4">
            <div>
              <label className="text-xs" style={{ color: "#D4AF37" }}>
                Amount
              </label>
              <div className="flex items-center justify-between p-3 rounded bg-black/30 border border-gray-600">
                <span style={{ color: "#F5E6C8" }}>{cryptoCharge.cryptoAmount}</span>
                <span style={{ color: "#D4AF37" }}>{selectedCrypto.toUpperCase()}</span>
              </div>
            </div>

            <div>
              <label className="text-xs" style={{ color: "#D4AF37" }}>
                Send to Address
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={cryptoCharge.cryptoAddress}
                  readOnly
                  className="flex-1 p-3 rounded bg-black/30 border border-gray-600 text-sm"
                  style={{ color: "#F5E6C8" }}
                />
                <button
                  onClick={() => copyToClipboard(cryptoCharge.cryptoAddress)}
                  className="p-3 rounded hover:bg-white/10 transition"
                  style={{ color: "#D4AF37" }}
                >
                  <Copy size={18} />
                </button>
              </div>
              {copied && <span className="text-xs text-green-400 mt-1">Copied!</span>}
            </div>

            <div>
              <label className="text-xs" style={{ color: "#D4AF37" }}>
                Expires At
              </label>
              <div className="p-3 rounded bg-black/30 border border-gray-600 text-sm" style={{ color: "#F5E6C8" }}>
                {new Date(cryptoCharge.expiresAt).toLocaleString()}
              </div>
            </div>
          </div>

          <a
            href={cryptoCharge.addressUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 rounded font-bold flex items-center justify-center gap-2 transition hover:opacity-80"
            style={{
              background: "#D4AF37",
              color: "#000",
            }}
          >
            Open in Coinbase <ExternalLink size={16} />
          </a>

          <p className="text-xs text-center mt-4" style={{ color: "rgba(212,175,55,0.6)" }}>
            Payment will be confirmed automatically once received
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div
        className="rounded-lg p-6 max-w-md w-full relative"
        style={{
          background: "linear-gradient(135deg, #0d0d20, #1a1a35)",
          border: "2px solid #D4AF37",
        }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded"
        >
          <X size={20} style={{ color: "#D4AF37" }} />
        </button>

        <h2 className="text-2xl font-bold mb-2" style={{ color: "#FFD700" }}>
          Pay with Crypto
        </h2>
        <p className="text-sm mb-6" style={{ color: "rgba(245,230,200,0.7)" }}>
          {packageName} • {coins.toLocaleString()} coins • ${(priceUsd / 100).toFixed(2)}
        </p>

        <div className="space-y-3 mb-6">
          {cryptoOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => setSelectedCrypto(option.id as any)}
              className="w-full p-4 rounded-lg border-2 transition flex items-center justify-between"
              style={{
                background:
                  selectedCrypto === option.id
                    ? "rgba(212,175,55,0.2)"
                    : "rgba(212,175,55,0.05)",
                borderColor:
                  selectedCrypto === option.id ? "#D4AF37" : "rgba(212,175,55,0.3)",
              }}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{option.icon}</span>
                <div className="text-left">
                  <div className="font-bold" style={{ color: "#FFD700" }}>
                    {option.name}
                  </div>
                  <div className="text-xs" style={{ color: "rgba(212,175,55,0.6)" }}>
                    {option.symbol}
                  </div>
                </div>
              </div>
              {selectedCrypto === option.id && (
                <div className="w-5 h-5 rounded-full" style={{ background: "#D4AF37" }} />
              )}
            </button>
          ))}
        </div>

        {error && (
          <div className="p-3 rounded mb-4 bg-red-500/20 border border-red-500 text-sm text-red-300">
            {error}
          </div>
        )}

        <button
          onClick={handleCreateCharge}
          disabled={loading}
          className="w-full py-3 rounded font-bold transition disabled:opacity-50"
          style={{
            background: "#D4AF37",
            color: "#000",
          }}
        >
          {loading ? "Creating Payment..." : "Continue to Payment"}
        </button>

        <p className="text-xs text-center mt-4" style={{ color: "rgba(212,175,55,0.6)" }}>
          Powered by Coinbase Commerce
        </p>
      </div>
    </div>
  );
}
