import { Shield } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-8 h-8 text-blue-600" />
            <h1>Privacy Policy</h1>
          </div>
          
          <div className="space-y-6 text-gray-700">
            <section>
              <h2 className="mb-3">1. Information We Collect</h2>
              <p>
                We collect information you provide directly to us, including your name, email address, profile information, and any content you post on the platform. We also collect information about your usage of the platform.
              </p>
            </section>

            <section>
              <h2 className="mb-3">2. How We Use Your Information</h2>
              <p>
                We use the information we collect to provide, maintain, and improve our services, to communicate with you, to monitor and analyze trends and usage, and to detect and prevent fraud and abuse.
              </p>
            </section>

            <section>
              <h2 className="mb-3">3. Information Sharing</h2>
              <p>
                We do not sell your personal information. We may share information with service providers who perform services on our behalf, or when required by law. Public profile information and listings are visible to other users.
              </p>
            </section>

            <section>
              <h2 className="mb-3">4. Data Storage and Security</h2>
              <p>
                We use industry-standard security measures to protect your data. Your information is stored securely using Supabase infrastructure with encryption in transit and at rest.
              </p>
            </section>

            <section>
              <h2 className="mb-3">5. Cookies and Tracking</h2>
              <p>
                We use cookies and similar technologies to maintain your session, understand how you use our platform, and improve your experience. You can control cookies through your browser settings.
              </p>
            </section>

            <section>
              <h2 className="mb-3">6. Your Rights and Choices</h2>
              <p>
                You have the right to access, update, or delete your personal information. You can manage your account settings or contact us to exercise these rights. You may also opt out of certain communications.
              </p>
            </section>

            <section>
              <h2 className="mb-3">7. Data Retention</h2>
              <p>
                We retain your information for as long as your account is active or as needed to provide you services. We may retain certain information as required by law or for legitimate business purposes.
              </p>
            </section>

            <section>
              <h2 className="mb-3">8. Children's Privacy</h2>
              <p>
                Our platform is not intended for users under the age of 13. We do not knowingly collect personal information from children under 13.
              </p>
            </section>

            <section>
              <h2 className="mb-3">9. International Users</h2>
              <p>
                Your information may be transferred to and processed in countries other than your own. By using our platform, you consent to such transfers.
              </p>
            </section>

            <section>
              <h2 className="mb-3">10. Changes to This Policy</h2>
              <p>
                We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date.
              </p>
            </section>

            <section>
              <h2 className="mb-3">11. Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy or our data practices, please contact us through the platform.
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
