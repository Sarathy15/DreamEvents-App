import React from 'react';
import { Calendar, Users, Star, Award, Heart, Shield, Clock, MapPin } from 'lucide-react';

const About: React.FC = () => {
  const stats = [
    { icon: Calendar, label: 'Events Planned', value: '500+' },
    { icon: Users, label: 'Happy Customers', value: '450+' },
    { icon: Star, label: 'Average Rating', value: '4.9/5' },
    { icon: Award, label: 'Years Experience', value: '1 month+' }
  ];

  const values = [
    {
      icon: Heart,
      title: 'Passion for Excellence',
      description: 'We pour our heart into every event, ensuring each celebration is unique and memorable.'
    },
    {
      icon: Shield,
      title: 'Trust & Reliability',
      description: 'Our verified vendors and secure platform give you peace of mind for your special day.'
    },
    {
      icon: Clock,
      title: 'Timely Delivery',
      description: 'We understand the importance of timing and ensure everything runs smoothly on schedule.'
    },
    {
      icon: MapPin,
      title: 'Local Expertise',
      description: 'Our network of local vendors knows the best venues and services in your area.'
    }
  ];

  const team = [
    {
      name: 'Gokul V',
      role: 'Backend Developer',
      image: 'https://github.com/Sarathy15/gokulprofile/blob/260f94ea6e2c6f90634478863954cb69f94c4bf5/WhatsApp%20Image%202025-07-31%20at%2009.36.58_17ce5df8.jpg',
      bio: 'Make DreamEvents to make celebration planning accessible to everyone.'
    },
    {
      name: 'Sarathy',
      role: 'Domain Expert',
      image: 'https://github.com/Sarathy15/profileCloud/blob/d71a4efafe08bb56c5613ccd2dac43acfc726492/IMG-20250626-WA0275.jpg',
      bio: 'Sarathy leads our vendor partnerships, ensuring we collaborate with the best in the industry.'
    },
    {
      name: 'Karthish',
      role: 'Frontend Developer',
      image: 'https://github.com/Sarathy15/KarthishProfile/blob/8fc3f5a5630f4c5d9d16f609d602c9f3e48a1c09/WhatsApp%20Image%202025-08-07%20at%2014.38.15_63560c76.jpg',
      bio: 'karthish crafts beautiful and user-friendly interfaces to enhance your experience on DreamEvents.'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-teal-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              About <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">DreamEvents</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              We're passionate about turning your special moments into unforgettable experiences. 
              Since 2016, we've been connecting customers with the finest event vendors to create magical celebrations.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
                  <div className="text-gray-600">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Story Section */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">Our Story</h2>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>
                  DreamEvents was born from a simple idea: planning your perfect event shouldn't be stressful. 
                  Our founder, Sarathy, experienced firsthand the challenges of coordinating multiple vendors 
                  for her own wedding in 2025.
                </p>
                <p>
                  Frustrated by the lack of a centralized platform to discover, compare, and book quality event services, 
                  she decided to create the solution herself. What started as a small local directory has grown into 
                  a comprehensive platform serving thousands of customers nationwide.
                </p>
                <p>
                  Today, we're proud to be the trusted partner for life's most important celebrations, 
                  connecting customers with verified, professional vendors who share our commitment to excellence.
                </p>
              </div>
            </div>
            <div className="relative">
              <img
                src="https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="Our Story"
                className="rounded-2xl shadow-xl"
              />
              <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-xl shadow-lg">
                <div className="text-2xl font-bold text-blue-600">2025</div>
                <div className="text-gray-600">Founded</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Values Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Values</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              These core values guide everything we do and shape the experience we create for our customers and vendors.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <div key={index} className="text-center group">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{value.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{value.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Meet Our Team</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              The passionate people behind DreamEvents who work tirelessly to make your events extraordinary.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <div key={index} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
                />
                <h3 className="text-xl font-semibold text-gray-900 text-center mb-2">{member.name}</h3>
                <p className="text-blue-600 text-center mb-4 font-medium">{member.role}</p>
                <p className="text-gray-600 text-center leading-relaxed">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to Plan Your Dream Event?</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Join thousands of satisfied customers who trust DreamEvents for their special celebrations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
              Browse Services
            </button>
            <button className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors">
              Become a Vendor
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;