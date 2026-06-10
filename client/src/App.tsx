/**
 * Rolling in the Dough — App Root
 * Art Deco Opulence theme, dark mode
 */

import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";

// Lazy-load the small, secondary pages. The initial bundle keeps
// Home (the landing page, which imports SlotMachine, CoinShop,
// BonusGameOverlay, and most of the game's heavy components) plus
// the framework. The Privacy, Terms, Pricing, CheckoutSuccess, and
// NotFound pages are split into their own chunks and only
// downloaded when the user navigates to them.
//
// Home stays in the initial bundle because lazy-loading it would
// not save meaningful bytes (its imports are the bulk of the
// game's runtime) and it would force a Suspense fallback for the
// landing page on every cold load.
//
// See docs/PHASE_4_STATUS.md Gap A.
const Pricing = lazy(() => import("./pages/Pricing"));
const CheckoutSuccess = lazy(() => import("./pages/CheckoutSuccess"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Suspense fallback shown while a lazy chunk downloads. Matches
// the dark "Art Deco Opulence" theme used by the rest of the app.
function PageLoading() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #0d0d20, #1a1a35)",
        color: "#D4AF37",
        fontFamily: "'Playfair Display', serif",
        fontSize: "1.25rem",
        letterSpacing: "0.05em",
      }}
    >
      Loading…
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<PageLoading />}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/checkout-success" component={CheckoutSuccess} />
        <Route path="/pricing" component={Pricing} />
        <Route path="/terms" component={TermsOfService} />
        <Route path="/privacy" component={PrivacyPolicy} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster
            toastOptions={{
              style: {
                background: "linear-gradient(135deg, #0d0d20, #1a1a35)",
                border: "1px solid #D4AF37",
                color: "#F5E6C8",
                fontFamily: "'Playfair Display', serif",
              },
            }}
          />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
