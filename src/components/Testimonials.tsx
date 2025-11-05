import React from 'react';
import { Star, Quote } from 'lucide-react';

const Testimonials: React.FC = () => {
  const testimonials = [
    {
      id: 1,
      name: 'Sarah Johnson',
      role: 'Bride',
      rating: 5,
      comment: 'DreamEvents made our wedding planning so easy! The vendors were professional, and the service was exceptional. Our special day was perfect!',
      image: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=300',
      event: 'Wedding'
    },
    {
      id: 2,
      name: 'Michael Chen',
      role: 'Corporate Event Manager',
      rating: 5,
      comment: 'We organized our company annual dinner through DreamEvents. The coordination was flawless, and everything went smoothly. Highly recommended!',
      image: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=300',
      event: 'Corporate Event'
    },
    {
      id: 3,
      name: 'Emily Rodriguez',
      role: 'Birthday Party Host',
      rating: 5,
      comment: 'Amazing experience! The decoration and catering services exceeded our expectations. My daughter\'s birthday party was magical!',
      image: 'https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&cs=tinysrgb&w=300',
      event: 'Birthday Party'
    }
  ];

  return (
    <div className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            What Our Customers Say
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Don't just take our word for it. Here's what our satisfied customers have to say about their experience with DreamEvents.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300"
            >
              <div className="flex items-center mb-4">
                <Quote className="h-8 w-8 text-blue-600 mb-2" />
              </div>
              
              <div className="flex items-center mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 text-yellow-500 fill-current" />
                ))}
              </div>

              <p className="text-gray-600 mb-6 leading-relaxed">
                "{testimonial.comment}"
              </p>

              <div className="flex items-center">
                <img
                  src={testimonial.image}
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full object-cover mr-4"
                />
                <div>
                  <div className="font-semibold text-gray-900">{testimonial.name}</div>
                  <div className="text-sm text-gray-600">{testimonial.role}</div>
                  <div className="text-xs text-blue-600 font-medium">{testimonial.event}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <div className="inline-flex items-center space-x-2 bg-yellow-100 px-6 py-3 rounded-full">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 text-yellow-500 fill-current" />
              ))}
            </div>
            <span className="text-gray-800 font-semibold">4.9 out of 5</span>
            <span className="text-gray-600">from 2,000+ reviews</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Testimonials;