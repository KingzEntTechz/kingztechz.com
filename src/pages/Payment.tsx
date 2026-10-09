import { Smartphone, Bitcoin, Info, MessageCircle, Phone } from 'lucide-react';

export default function Payment() {
  const paymentMethods = [
    {
      icon: Smartphone,
      name: 'M-Pesa (Matembo)',
      number: '0707398858',
      color: 'success',
    },
    {
      icon: Smartphone,
      name: 'Airtel Money (Matembo)',
      number: '0752000550',
      color: 'info',
    },
    {
      icon: Bitcoin,
      name: 'Binance Pay',
      number: 'ID: 1108869988',
      subName: 'Kingz Technologiez',
      color: 'warning',
    },
  ];

  const colorMap: Record<string, string> = {
    success: 'text-success-500 bg-success-500/10',
    info: 'text-info-500 bg-info-500/10',
    warning: 'text-warning-500 bg-warning-500/10',
  };

  return (
    <div className="animate-fade-in">
      <section className="bg-gradient-to-br from-dark-500 to-dark-300 border-b border-dark-50 py-12 sm:py-16 text-center">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <span className="inline-block bg-accent-500 text-white px-5 py-1.5 rounded-full text-sm font-semibold mb-4">
            Payment Methods
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">Payment Options</h1>
          <p className="text-gray-400 text-lg">
            Choose your preferred payment method and receive credentials instantly
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <h2 className="section-title mb-4">Payment Methods</h2>
        <p className="text-center text-gray-400 mb-8 text-lg">Send payment and receive credentials INSTANTLY 24/7</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          {paymentMethods.map((method) => (
            <div key={method.name} className="card card-hover p-6 text-center animate-slide-up">
              <div className={`flex items-center justify-center w-16 h-16 rounded-2xl ${colorMap[method.color]} mx-auto mb-4`}>
                <method.icon className="w-8 h-8" />
              </div>
              <h4 className="font-bold text-white text-lg mb-2">{method.name}</h4>
              <p className="text-gray-100 font-semibold text-lg break-all">{method.number}</p>
              {method.subName && <p className="text-gray-400 text-sm mt-1">{method.subName}</p>}
            </div>
          ))}
        </div>

        <div className="card p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-4">
            <Info className="w-6 h-6 text-info-500" />
            <h3 className="text-xl font-bold text-white">How It Works</h3>
          </div>
          <ol className="space-y-3 text-gray-300">
            {[
              'Choose your tool or service',
              'Send exact amount via your preferred payment method',
              'WhatsApp transaction code to 0752000550',
              'Receive login credentials INSTANTLY',
              'Access begins immediately',
            ].map((step, i) => (
              <li key={step} className="flex items-start gap-3">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-info-500/20 text-info-500 font-bold text-sm shrink-0">
                  {i + 1}
                </span>
                <span className="pt-0.5">{step}</span>
              </li>
            ))}
          </ol>

          <div className="mt-6 pt-6 border-t border-dark-50 flex flex-col sm:flex-row items-center gap-4">
            <a href="tel:0752000550" className="flex items-center gap-2 text-info-500 font-semibold hover:text-info-400 transition-colors">
              <Phone className="w-5 h-5" />
              Need help? Call us anytime: 0752000550
            </a>
            <a
              href="https://wa.me/254752000550"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-success inline-flex items-center gap-2 sm:ml-auto"
            >
              <MessageCircle className="w-5 h-5" />
              WhatsApp Us
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
