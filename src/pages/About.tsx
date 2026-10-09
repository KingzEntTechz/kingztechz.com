import { Rocket, Shield, Globe, CheckCircle, MessageCircle } from 'lucide-react';

export default function About() {
  return (
    <div className="animate-fade-in">
      <section className="bg-gradient-to-br from-dark-500 to-dark-300 border-b border-dark-50 py-12 sm:py-16 text-center">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <span className="inline-block bg-accent-500 text-white px-5 py-1.5 rounded-full text-sm font-semibold mb-4">
            About Our Services
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">Rental & Activation Services</h1>
          <p className="text-gray-400 text-lg">
            Learn about our premium tool rental services and how we can help you with your digital needs
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <h2 className="section-title mb-4">About Kingz Techz</h2>
        <p className="text-center text-gray-400 max-w-2xl mx-auto mb-8 text-lg">
          We provide premium digital tool rental services with instant delivery
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="card card-hover p-6 animate-slide-up">
            <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-accent-500/10 mb-4">
              <Rocket className="w-7 h-7 text-accent-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Instant Delivery</h3>
            <p className="text-gray-400 text-sm">
              Our automated system delivers login credentials instantly after payment confirmation. No waiting time, access your tools immediately.
            </p>
          </div>

          <div className="card card-hover p-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-info-500/10 mb-4">
              <Shield className="w-7 h-7 text-info-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Secure & Reliable</h3>
            <p className="text-gray-400 text-sm">
              All our tools are verified and secure. We ensure reliable service with 99.9% uptime guarantee for all our rental tools.
            </p>
          </div>

          <div className="card card-hover p-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-success-500/10 mb-4">
              <Globe className="w-7 h-7 text-success-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Global Access</h3>
            <p className="text-gray-400 text-sm">
              Access our tools from anywhere in the world. Our services are available 24/7 to customers worldwide.
            </p>
          </div>
        </div>

        <div className="card p-8">
          <h3 className="text-xl font-bold text-info-500 mb-4">Benefits of Using Our Services</h3>
          <p className="text-gray-400 mb-4">
            Our rental services provide numerous benefits for professionals and enthusiasts:
          </p>
          <ul className="space-y-2 mb-4">
            {[
              'Cost-effective access to premium tools without large upfront investments',
              'Flexible rental periods to suit your specific needs',
              'No long-term commitments — rent only when you need',
              'Always access the latest versions of tools',
              'Professional support to help you maximize tool usage',
              'Secure payment options with instant delivery',
            ].map((benefit) => (
              <li key={benefit} className="flex items-start gap-2 text-gray-300">
                <CheckCircle className="w-5 h-5 text-success-500 shrink-0 mt-0.5" />
                {benefit}
              </li>
            ))}
          </ul>
          <p className="text-gray-400">
            Whether you're a professional technician or a DIY enthusiast, our rental services provide the perfect solution for your digital tool needs.
          </p>

          <div className="mt-6 pt-6 border-t border-dark-50">
            <a
              href="https://wa.me/254752000550"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-success inline-flex items-center gap-2"
            >
              <MessageCircle className="w-5 h-5" />
              Chat with us on WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
