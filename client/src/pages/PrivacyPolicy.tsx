import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function PrivacyPolicy() {
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
        <h2 className="text-4xl font-bold text-amber-400 mb-8">Privacy Policy</h2>
        <p className="text-slate-400 mb-8">Last Updated: March 23, 2026</p>

        <div className="space-y-8 text-slate-300">
          {/* Section 1 */}
          <section>
            <h3 className="text-2xl font-bold text-amber-300 mb-4">1. Introduction</h3>
            <div className="space-y-3 text-base leading-relaxed">
              <p>
                Welcome to <strong>Rolling in the Dough</strong> ("we," "us," "our," or "Company"). We are committed to protecting your privacy and ensuring you have a positive experience on our platform. This Privacy Policy explains how we collect, use, disclose, and safeguard your information.
              </p>
              <p>
                Please read this Privacy Policy carefully. If you do not agree with our policies and practices, please do not use our service.
              </p>
            </div>
          </section>

          {/* Section 2 */}
          <section>
            <h3 className="text-2xl font-bold text-amber-300 mb-4">2. Information We Collect</h3>
            <div className="space-y-3 text-base leading-relaxed">
              <p>
                <strong>Personal Information:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Name and email address</li>
                <li>Account username and password</li>
                <li>Date of birth (for age verification)</li>
                <li>Phone number (optional)</li>
                <li>Payment information (credit card, billing address)</li>
              </ul>
              <p>
                <strong>Gameplay Data:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Spin history and results</li>
                <li>Coin balances and transactions</li>
                <li>Bonus rounds played and rewards earned</li>
                <li>Session duration and frequency</li>
                <li>In-game achievements and progress</li>
              </ul>
              <p>
                <strong>Device & Technical Information:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Device type, operating system, and browser</li>
                <li>IP address and location data</li>
                <li>Crash reports and error logs</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>
              <p>
                <strong>Communication Data:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Support tickets and customer service interactions</li>
                <li>Feedback and survey responses</li>
                <li>Marketing communications (if opted in)</li>
              </ul>
            </div>
          </section>

          {/* Section 3 */}
          <section>
            <h3 className="text-2xl font-bold text-amber-300 mb-4">3. How We Use Your Information</h3>
            <div className="space-y-3 text-base leading-relaxed">
              <p>
                We use the information we collect for the following purposes:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Account Management:</strong> Creating and maintaining your account, verifying identity, and processing authentication</li>
                <li><strong>Payment Processing:</strong> Processing purchases, managing subscriptions, and handling refunds through Stripe</li>
                <li><strong>Gameplay:</strong> Delivering game features, tracking progress, calculating rewards, and managing coin balances</li>
                <li><strong>Fraud Prevention:</strong> Detecting and preventing fraudulent activity, cheating, and unauthorized access</li>
                <li><strong>Customer Support:</strong> Responding to inquiries, resolving issues, and improving service quality</li>
                <li><strong>Legal Compliance:</strong> Verifying eligibility, age verification, and compliance with sweepstakes regulations</li>
                <li><strong>Analytics:</strong> Understanding user behavior, improving game design, and optimizing performance</li>
                <li><strong>Marketing:</strong> Sending promotional offers, game updates, and newsletters (with your consent)</li>
              </ul>
            </div>
          </section>

          {/* Section 4 */}
          <section>
            <h3 className="text-2xl font-bold text-amber-300 mb-4">4. Third-Party Services</h3>
            <div className="space-y-3 text-base leading-relaxed">
              <p>
                We share your information with trusted third-party service providers:
              </p>
              <p>
                <strong>Stripe:</strong> Payment processing. Your payment information is handled according to Stripe's privacy policy. We do not store full credit card details.
              </p>
              <p>
                <strong>Analytics Providers:</strong> We use analytics services to understand user behavior and improve the game. These services may collect device information and usage data.
              </p>
              <p>
                <strong>Email Service Providers:</strong> We use third-party email services to send communications. Your email is shared only for this purpose.
              </p>
              <p>
                <strong>Legal Compliance:</strong> We may disclose information to law enforcement, regulators, or other authorities if required by law or to protect our rights.
              </p>
            </div>
          </section>

          {/* Section 5 */}
          <section>
            <h3 className="text-2xl font-bold text-amber-300 mb-4">5. Data Retention</h3>
            <div className="space-y-3 text-base leading-relaxed">
              <p>
                <strong>Active Accounts:</strong> We retain your information while your account is active and for as long as necessary to provide services.
              </p>
              <p>
                <strong>Deleted Accounts:</strong> Upon account deletion, we retain certain information for legal compliance, fraud prevention, and dispute resolution for up to 7 years.
              </p>
              <p>
                <strong>Gameplay Data:</strong> Gameplay history and transaction records are retained for 5 years for audit and compliance purposes.
              </p>
              <p>
                <strong>Payment Information:</strong> Payment records are retained according to tax and financial regulations (typically 7 years).
              </p>
              <p>
                You may request deletion of your personal information at any time, subject to legal retention requirements.
              </p>
            </div>
          </section>

          {/* Section 6 */}
          <section>
            <h3 className="text-2xl font-bold text-amber-300 mb-4">6. Your Privacy Rights</h3>
            <div className="space-y-3 text-base leading-relaxed">
              <p>
                Depending on your location, you may have the following rights:
              </p>
              <p>
                <strong>Right to Access:</strong> You can request a copy of the personal information we hold about you.
              </p>
              <p>
                <strong>Right to Correction:</strong> You can request that we correct inaccurate or incomplete information.
              </p>
              <p>
                <strong>Right to Deletion:</strong> You can request deletion of your personal information, subject to legal obligations.
              </p>
              <p>
                <strong>Right to Opt-Out:</strong> You can opt out of marketing communications at any time by clicking "Unsubscribe" in our emails.
              </p>
              <p>
                <strong>Right to Data Portability:</strong> You can request your data in a portable format.
              </p>
              <p>
                To exercise these rights, contact us at privacy@luckyslots.com.
              </p>
            </div>
          </section>

          {/* Section 7 */}
          <section>
            <h3 className="text-2xl font-bold text-amber-300 mb-4">7. Security</h3>
            <div className="space-y-3 text-base leading-relaxed">
              <p>
                We implement industry-standard security measures to protect your information, including:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>SSL/TLS encryption for data in transit</li>
                <li>Secure password hashing and storage</li>
                <li>Regular security audits and penetration testing</li>
                <li>Access controls and authentication mechanisms</li>
                <li>Compliance with data protection regulations</li>
              </ul>
              <p>
                However, no security system is impenetrable. We cannot guarantee absolute security of your information.
              </p>
            </div>
          </section>

          {/* Section 8 */}
          <section>
            <h3 className="text-2xl font-bold text-amber-300 mb-4">8. Cookies & Tracking</h3>
            <div className="space-y-3 text-base leading-relaxed">
              <p>
                We use cookies and similar technologies to:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Maintain your session and remember your preferences</li>
                <li>Track gameplay and user behavior</li>
                <li>Analyze site performance and usage</li>
                <li>Deliver personalized content and advertisements</li>
              </ul>
              <p>
                You can control cookies through your browser settings. Disabling cookies may affect your ability to use certain features.
              </p>
            </div>
          </section>

          {/* Section 9 */}
          <section>
            <h3 className="text-2xl font-bold text-amber-300 mb-4">9. Children's Privacy</h3>
            <div className="space-y-3 text-base leading-relaxed">
              <p>
                Our service is not intended for users under 18 years of age. We do not knowingly collect personal information from children. If we become aware that a child has provided us with personal information, we will delete such information and terminate the child's account.
              </p>
            </div>
          </section>

          {/* Section 10 */}
          <section>
            <h3 className="text-2xl font-bold text-amber-300 mb-4">10. Changes to This Policy</h3>
            <div className="space-y-3 text-base leading-relaxed">
              <p>
                We may update this Privacy Policy from time to time. We will notify you of significant changes by posting the new policy on our website and updating the "Last Updated" date. Your continued use of the service constitutes acceptance of the updated policy.
              </p>
            </div>
          </section>

          {/* Section 11 */}
          <section>
            <h3 className="text-2xl font-bold text-amber-300 mb-4">11. Contact Us</h3>
            <div className="space-y-3 text-base leading-relaxed">
              <p>
                If you have questions about this Privacy Policy or our privacy practices, please contact us at:
              </p>
              <p className="ml-4">
                <strong>Email:</strong> privacy@luckyslots.com<br />
                <strong>Support Email:</strong> support@luckyslots.com<br />
                <strong>Response Time:</strong> We aim to respond within 30 days
              </p>
            </div>
          </section>

          {/* Acceptance */}
          <section className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 mt-12">
            <p className="text-center">
              By using Rolling in the Dough, you acknowledge that you have read and understood this Privacy Policy.
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
            onClick={() => navigate("/terms")}
            className="text-slate-300 border-slate-600 hover:bg-slate-800"
          >
            Terms of Service
          </Button>
        </div>
      </div>
    </div>
  );
}
