import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function TermsOfService() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-slate-100">
      {/* Header */}
      <div className="bg-slate-950 border-b border-slate-700 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-amber-400">Rolling in the Dough</h1>
          <Button
            variant="outline"
            onClick={() => navigate("/")}
            className="text-slate-300 border-slate-600 hover:bg-slate-800"
          >
            Back to Game
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h2 className="text-4xl font-bold text-amber-400 mb-8">Terms of Service</h2>
        <p className="text-slate-400 mb-8">Last Updated: March 23, 2026</p>

        <div className="space-y-8 text-slate-300">
          {/* Section 1 */}
          <section>
            <h3 className="text-2xl font-bold text-amber-300 mb-4">1. Sweepstakes Rules & Eligibility</h3>
            <div className="space-y-3 text-base leading-relaxed">
              <p>
                <strong>Rolling in the Dough</strong> is a free-to-play sweepstakes game, not gambling. Participation is voluntary and open to legal residents of the United States aged 18 or older (or the age of majority in your jurisdiction).
              </p>
              <p>
                <strong>Eligibility Requirements:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Must be 18+ years old (or age of majority in your state)</li>
                <li>Must be a legal resident of the United States</li>
                <li>Employees of the operator and their immediate family members are ineligible</li>
                <li>Previous sweepstakes winners may be subject to restrictions</li>
              </ul>
              <p>
                <strong>No Purchase Necessary:</strong> Sweeps Coins can be earned through free daily bonuses and gameplay. No purchase is required to play or win.
              </p>
            </div>
          </section>

          {/* Section 2 */}
          <section>
            <h3 className="text-2xl font-bold text-amber-300 mb-4">2. Dual Currency System</h3>
            <div className="space-y-3 text-base leading-relaxed">
              <p>
                <strong>Gold Coins:</strong> Earned through gameplay and daily bonuses. Used for spinning the reels. Gold Coins have no real-world value and cannot be redeemed for cash or prizes.
              </p>
              <p>
                <strong>Sweeps Coins:</strong> Purchased through our shop or earned through promotions. Sweeps Coins can be redeemed for real-world prizes or cash according to our redemption schedule.
              </p>
              <p>
                <strong>Redemption:</strong> Sweeps Coins may be redeemed for prizes or cash at our discretion. Redemption values and available prizes are subject to change. All redemptions are subject to verification and compliance review.
              </p>
            </div>
          </section>

          {/* Section 3 */}
          <section>
            <h3 className="text-2xl font-bold text-amber-300 mb-4">3. Coin Purchase & Redemption Terms</h3>
            <div className="space-y-3 text-base leading-relaxed">
              <p>
                <strong>Purchases:</strong> All Sweeps Coin purchases are final and non-refundable except as required by law. Purchases are processed through Stripe and subject to their terms and conditions.
              </p>
              <p>
                <strong>Refund Policy:</strong> Refunds may be requested within 30 days of purchase for technical issues or unauthorized transactions. Refunds for gameplay losses are not provided.
              </p>
              <p>
                <strong>Redemption Process:</strong> To redeem Sweeps Coins, users must submit a redemption request through the app. Redemptions are processed within 30-60 business days after verification.
              </p>
              <p>
                <strong>Verification:</strong> We reserve the right to verify user identity and account activity before processing any redemption. Users must comply with all applicable laws and our terms.
              </p>
              <p>
                <strong>Minimum Redemption:</strong> Minimum redemption amount is $20 USD equivalent.
              </p>
            </div>
          </section>

          {/* Section 4 */}
          <section>
            <h3 className="text-2xl font-bold text-amber-300 mb-4">4. No Gambling Disclaimer</h3>
            <div className="space-y-3 text-base leading-relaxed">
              <p className="bg-amber-900/30 border border-amber-700 rounded-lg p-4">
                <strong>IMPORTANT:</strong> Rolling in the Dough is NOT gambling. This is a sweepstakes game where outcomes are determined by random chance, not skill. No real money is wagered on gameplay. Gold Coins have no monetary value. Only Sweeps Coins can be redeemed for real-world value, and only through our official redemption process.
              </p>
              <p>
                This game is intended for entertainment purposes only. If you experience gambling-related concerns, please contact the National Council on Problem Gambling at 1-800-522-4700.
              </p>
            </div>
          </section>

          {/* Section 5 */}
          <section>
            <h3 className="text-2xl font-bold text-amber-300 mb-4">5. User Conduct & Account Rules</h3>
            <div className="space-y-3 text-base leading-relaxed">
              <p>
                <strong>Prohibited Conduct:</strong> Users agree not to:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Create multiple accounts to circumvent limits or bonuses</li>
                <li>Use automated tools, bots, or scripts to play the game</li>
                <li>Exploit bugs or technical vulnerabilities</li>
                <li>Engage in fraud, collusion, or deceptive practices</li>
                <li>Harass, threaten, or abuse other users or staff</li>
                <li>Violate any applicable laws or regulations</li>
              </ul>
              <p>
                <strong>Account Suspension:</strong> We reserve the right to suspend or terminate accounts that violate these terms. Suspended accounts may forfeit all coins and prizes.
              </p>
            </div>
          </section>

          {/* Section 6 */}
          <section>
            <h3 className="text-2xl font-bold text-amber-300 mb-4">6. Limitation of Liability</h3>
            <div className="space-y-3 text-base leading-relaxed">
              <p>
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE ARE NOT LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THIS GAME.
              </p>
              <p>
                Our total liability for any claim shall not exceed the amount you paid for Sweeps Coins in the 12 months preceding the claim.
              </p>
              <p>
                We are not responsible for technical issues, server downtime, data loss, or interruptions to service.
              </p>
            </div>
          </section>

          {/* Section 7 */}
          <section>
            <h3 className="text-2xl font-bold text-amber-300 mb-4">7. Dispute Resolution</h3>
            <div className="space-y-3 text-base leading-relaxed">
              <p>
                <strong>Informal Resolution:</strong> If you have a dispute, contact us first at support@luckyslots.com. We will attempt to resolve the issue within 30 days.
              </p>
              <p>
                <strong>Arbitration:</strong> Any unresolved disputes shall be resolved through binding arbitration in accordance with the American Arbitration Association (AAA) rules, except that you may pursue claims in small claims court if eligible.
              </p>
              <p>
                <strong>Class Action Waiver:</strong> You agree not to pursue class action lawsuits. Disputes must be brought individually.
              </p>
            </div>
          </section>

          {/* Section 8 */}
          <section>
            <h3 className="text-2xl font-bold text-amber-300 mb-4">8. Changes to Terms</h3>
            <div className="space-y-3 text-base leading-relaxed">
              <p>
                We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting. Your continued use of the game constitutes acceptance of the modified terms.
              </p>
            </div>
          </section>

          {/* Section 9 */}
          <section>
            <h3 className="text-2xl font-bold text-amber-300 mb-4">9. Contact Us</h3>
            <div className="space-y-3 text-base leading-relaxed">
              <p>
                For questions about these Terms of Service, please contact us at:
              </p>
              <p className="ml-4">
                <strong>Email:</strong> support@luckyslots.com<br />
                <strong>Address:</strong> Rolling in the Dough Support<br />
                <strong>Response Time:</strong> We aim to respond within 48 business hours
              </p>
            </div>
          </section>

          {/* Acceptance */}
          <section className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 mt-12">
            <p className="text-center">
              By using Rolling in the Dough, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
            </p>
          </section>
        </div>

        {/* Footer Navigation */}
        <div className="flex justify-center gap-4 mt-12">
          <Button
            variant="outline"
            onClick={() => navigate("/")}
            className="text-slate-300 border-slate-600 hover:bg-slate-800"
          >
            Back to Game
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/privacy")}
            className="text-slate-300 border-slate-600 hover:bg-slate-800"
          >
            Privacy Policy
          </Button>
        </div>
      </div>
    </div>
  );
}
