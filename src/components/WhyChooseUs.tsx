import React from 'react';
import { Shield, Clock, Users, Star, CheckCircle, Headphones } from 'lucide-react';

const WhyChooseUs: React.FC = () => {
  const features = [
    {
      icon: Shield,
      title: 'Verified Vendors',
      description: 'All our vendors are thoroughly vetted and verified to ensure quality service.',
      color: 'text-blue-600 bg-blue-100'
    },
    {
      icon: Clock,
      title: '24/7 Support',
      description: 'Round-the-clock customer support to help you with any questions or concerns.',
      color: 'text-purple-600 bg-purple-100'
    },
    {
      icon: Users,
      title: 'Expert Team',
      description: 'Our experienced event coordinators help match you with the perfect vendors.',
      color: 'text-teal-600 bg-teal-100'
    },
    {
      icon: Star,
      title: 'Quality Guarantee',
      description: 'We guarantee satisfaction with our 5-star rated services and vendors.',
      color: 'text-yellow-600 bg-yellow-100'
    },
    {
      icon: CheckCircle,
      title: 'Easy Booking',
      description: 'Simple, streamlined booking process that gets your event planned quickly.',
      color: 'text-green-600 bg-green-100'
    },
    {
      icon: Headphones,
      title: 'Personal Assistant',
      description: 'Dedicated event coordinator assigned to each booking for personalized service.',
      color: 'text-red-600 bg-red-100'
    }
  ];

  return (
    <div className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Why Choose DreamEvents?
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We're committed to making your event planning experience seamless, stress-free, and exceptional.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="group p-6 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300"
              >
                <div className={`w-12 h-12 rounded-lg ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-center text-white">
          <h3 className="text-3xl font-bold mb-4">
            Ready to Plan Your Perfect Event?
          </h3>
          <p className="text-xl mb-6 text-blue-100">
            Join thousands of satisfied customers who trust us with their special moments.
          </p>
          <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
            Get Started Today
          </button>
        </div>
      </div>
    </div>
  );
};

export default WhyChooseUs;