import { MessageCircle, Phone, Mail, Headset } from 'lucide-react';

export default function Support() {
  return (
    <div className="animate-fade-in">
      <section className="bg-gradient-to-br from-dark-500 to-dark-300 border-b border-dark-50 py-12 sm:py-16 text-center">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <span className="inline-block bg-accent-500 text-white px-5 py-1.5 rounded-full text-sm font-semibold mb-4">
            Support Center
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">Customer Support</h1>
          <p className="text-gray-400 text-lg">We're here to help you with any questions or issues</p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <h2 className="section-title mb-4">Support Center</h2>
        <p className="text-center text-gray-400 max-w-2xl mx-auto mb-8 text-lg">
          Get help with your tool rentals and account
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card card-hover p-6 text-center animate-slide-up">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-success-500/10 mx-auto mb-4">
              <MessageCircle className="w-8 h-8 text-success-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">WhatsApp Support</h3>
            <p className="text-gray-400 text-sm mb-4">
              Get instant support via WhatsApp. Our team is available 24/7 to assist you with any issues.
            </p>
            <a href="https://wa.me/254752000550" target="_blank" rel="noopener noreferrer" className="btn-success w-full inline-flex items-center justify-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Contact via WhatsApp
            </a>
          </div>

          <div className="card card-hover p-6 text-center animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-info-500/10 mx-auto mb-4">
              <Phone className="w-8 h-8 text-info-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Phone Support</h3>
            <p className="text-gray-400 text-sm mb-4">
              Call us for immediate assistance with your tool rentals or account issues.
            </p>
            <a href="tel:0752000550" className="btn-outline w-full inline-flex items-center justify-center gap-2">
              <Phone className="w-5 h-5" />
              Call: 0752000550
            </a>
          </div>

          <div className="card card-hover p-6 text-center animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-accent-500/10 mx-auto mb-4">
              <Mail className="w-8 h-8 text-accent-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Email Support</h3>
            <p className="text-gray-400 text-sm mb-4">
              Send us an email and we'll get back to you within a few hours with a solution.
            </p>
            <a href="mailto:kingzenttechz@gmail.com" className="btn-primary w-full inline-flex items-center justify-center gap-2">
              <Mail className="w-5 h-5" />
              Email Us
            </a>
          </div>
        </div>

        {/* FAQ */}
        <div className="card p-8 mt-8">
          <div className="flex items-center gap-2 mb-6">
            <Headset className="w-6 h-6 text-info-500" />
            <h3 className="text-xl font-bold text-white">Frequently Asked Questions</h3>
          </div>
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold text-gray-200 mb-1">How do I rent a tool?</h4>
              <p className="text-sm text-gray-400">
                Browse the Tools page, select your tool, choose a payment method, send payment, and submit your transaction code. You'll receive credentials instantly via WhatsApp.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-200 mb-1">How long does delivery take?</h4>
              <p className="text-sm text-gray-400">
                Delivery is instant! Once your payment is confirmed, you receive your login credentials immediately via WhatsApp.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-200 mb-1">What payment methods do you accept?</h4>
              <p className="text-sm text-gray-400">
                We accept M-Pesa, Airtel Money, and Binance Pay. See the Payment page for details.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-200 mb-1">Can I extend my rental period?</h4>
              <p className="text-sm text-gray-400">
                Rental periods are fixed. To extend, simply rent the tool again with a new payment.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
