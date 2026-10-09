export default function Legal() {
  return (
    <div className="animate-fade-in min-h-screen">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <h1 className="text-3xl font-bold leading-tight text-white sm:text-4xl">Terms and Conditions</h1>
        <p className="mb-8 mt-3 text-sm leading-7 text-gray-400 sm:text-base">
          Welcome to our website. By accessing or using our services, you agree to be bound by the following terms and conditions. Please read them carefully.
        </p>

        <div className="space-y-4 sm:space-y-6">
          <section className="card p-5 sm:p-6">
            <h2 className="text-lg font-bold text-info-500 mb-2">1. Digital Products</h2>
            <p className="text-sm leading-7 text-gray-400">
              All products sold on this website are digital in nature. Once purchased, they will be delivered electronically to the customer's registered email or account download section.
            </p>
          </section>

          <section className="card p-5 sm:p-6">
            <h2 className="text-lg font-bold text-accent-500 mb-2">2. No Refund Policy</h2>
            <p className="text-sm leading-7 text-gray-400">
              Due to the nature of digital products, all sales are final. We do not offer refunds, exchanges, or cancellations once the product has been delivered or the download link has been accessed.
            </p>
          </section>

          <section className="card p-5 sm:p-6">
            <h2 className="text-lg font-bold text-success-500 mb-2">3. License and Usage</h2>
            <p className="text-sm leading-7 text-gray-400">
              All digital products are sold for personal or commercial use as specified. Redistribution, resale, or unauthorized sharing of our digital content is strictly prohibited.
            </p>
          </section>

          <section className="card p-5 sm:p-6">
            <h2 className="text-lg font-bold text-info-500 mb-2">4. Account Responsibility</h2>
            <p className="text-sm leading-7 text-gray-400">
              You are responsible for maintaining the confidentiality of your account and password. We are not liable for any loss or damage arising from your failure to protect your login credentials.
            </p>
          </section>

          <section className="card p-5 sm:p-6">
            <h2 className="text-lg font-bold text-accent-500 mb-2">5. Modifications</h2>
            <p className="text-sm leading-7 text-gray-400">
              We reserve the right to update or modify these Terms and Conditions at any time without prior notice. Continued use of our services after any changes shall constitute your consent to such changes.
            </p>
          </section>

          <section className="card p-5 sm:p-6">
            <h2 className="text-lg font-bold text-success-500 mb-2">6. Disclaimer</h2>
            <p className="text-sm leading-7 text-gray-400">
              All products are provided "as is" without warranties of any kind, either express or implied. We do not guarantee that our products will meet your expectations or be error-free.
            </p>
          </section>

          <section className="card p-5 sm:p-6">
            <h2 className="text-lg font-bold text-info-500 mb-2">7. Governing Law</h2>
            <p className="text-sm leading-7 text-gray-400">
              These terms are governed by the laws of our jurisdiction. Any disputes shall be resolved in the courts of our country or region.
            </p>
          </section>

          <p className="pt-3 text-center text-sm leading-6 text-gray-500 sm:pt-4">
            If you have any questions about our terms, please contact us.
          </p>
        </div>
      </div>
    </div>
  );
}
