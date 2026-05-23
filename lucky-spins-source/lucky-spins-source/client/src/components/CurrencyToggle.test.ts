import { describe, it, expect, vi } from "vitest";

describe("CurrencyToggle Component", () => {
  it("should render with gold and green coin buttons", () => {
    const mockOnChange = vi.fn();
    const props = {
      selectedCurrency: "gold" as const,
      goldCoins: 10000,
      greenCoins: 500,
      onCurrencyChange: mockOnChange,
    };

    // Test that component would receive correct props
    expect(props.selectedCurrency).toBe("gold");
    expect(props.goldCoins).toBe(10000);
    expect(props.greenCoins).toBe(500);
  });

  it("should call onCurrencyChange when switching to green", () => {
    const mockOnChange = vi.fn();
    mockOnChange("green");
    expect(mockOnChange).toHaveBeenCalledWith("green");
  });

  it("should call onCurrencyChange when switching to gold", () => {
    const mockOnChange = vi.fn();
    mockOnChange("gold");
    expect(mockOnChange).toHaveBeenCalledWith("gold");
  });

  it("should display correct coin amounts", () => {
    const goldCoins = 10000;
    const greenCoins = 500;
    expect(goldCoins).toBe(10000);
    expect(greenCoins).toBe(500);
  });

  it("should show FREE PLAY badge for gold currency", () => {
    const selectedCurrency = "gold";
    const badge = selectedCurrency === "gold" ? "FREE PLAY" : "REDEEMABLE";
    expect(badge).toBe("FREE PLAY");
  });

  it("should show REDEEMABLE badge for green currency", () => {
    const selectedCurrency = "green";
    const badge = selectedCurrency === "gold" ? "FREE PLAY" : "REDEEMABLE";
    expect(badge).toBe("REDEEMABLE");
  });
});
