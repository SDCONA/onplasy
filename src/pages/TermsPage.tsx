import { Scale } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="flex items-center gap-3 mb-6">
            <Scale className="w-8 h-8 text-blue-600" />
            <h1>Terms of Service</h1>
          </div>
          
          <div className="space-y-6 text-gray-700">
            <section>
              <h2 className="mb-3">1. Acceptance of Terms</h2>
              <p>
                By accessing and using this marketplace platform, you accept and agree to be bound by the terms and provision of this agreement.
              </p>
            </section>

            <section>
              <h2 className="mb-3">2. User Accounts</h2>
              <p>
                You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.
              </p>
            </section>

            <section>
              <h2 className="mb-3">3. Listing Guidelines</h2>
              <p>
                All listings must be accurate, honest, and comply with applicable laws. You may not list items that are illegal, infringe on intellectual property rights, or violate our community guidelines.
              </p>
            </section>

            <section>
              <h2 className="mb-3">4. Transactions</h2>
              <p>
                This platform facilitates connections between buyers and sellers. We are not responsible for the actual transactions between users. All transactions are at your own risk.
              </p>
            </section>

            <section>
              <h2 className="mb-3">5. Prohibited Activities</h2>
              <p>
                Users may not engage in fraudulent activities, spam, harassment, or any other behavior that violates our community standards. Violations may result in account suspension or termination.
              </p>
            </section>

            <section>
              <h2 className="mb-3">6. Content Ownership</h2>
              <p>
                You retain ownership of all content you post on the platform. However, by posting content, you grant us a license to use, display, and distribute that content on the platform.
              </p>
            </section>

            <section>
              <h2 className="mb-3">7. Limitation of Liability</h2>
              <p>
                The platform is provided "as is" without any warranties. We are not liable for any damages arising from the use of the platform or transactions between users.
              </p>
            </section>

            <section>
              <h2 className="mb-3">8. Modifications</h2>
              <p>
                We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting. Your continued use of the platform constitutes acceptance of the modified terms.
              </p>
            </section>

            <section>
              <h2 className="mb-3">9. Contact</h2>
              <p>
                If you have any questions about these Terms of Service, please contact us through the platform.
              </p>
            </section>

            <div className="border-t border-gray-200 pt-6 mt-8">
              <p className="text-gray-500 text-sm">
                Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
