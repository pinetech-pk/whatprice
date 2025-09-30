"use client";

import React, { useState } from "react";
import {
  ArrowRight,
  TrendingUp,
  Users,
  Target,
  CheckCircle,
  Mail,
  Building,
  User,
  MessageSquare,
  Send,
} from "lucide-react";

const WhatPriceLanding = () => {
  const [showPitch, setShowPitch] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    message: "",
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.email) {
      alert("Please fill in required fields");
      return;
    }
    // Store form data (in real app, this would go to a backend)
    console.log("Investor inquiry submitted:", formData);
    setIsSubmitted(true);

    // Reset form after 3 seconds
    setTimeout(() => {
      setIsSubmitted(false);
      setFormData({ name: "", email: "", company: "", message: "" });
      setShowForm(false);
    }, 3000);
  };

  if (showForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto">
            <button
              onClick={() => setShowForm(false)}
              className="mb-8 text-blue-600 hover:text-blue-800 flex items-center gap-2 transition-colors"
            >
              ← Back to Pitch
            </button>

            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900">
                  Get in Touch
                </h2>
                <p className="text-gray-600 mt-2">
                  Interested in WhatPrice&apos;s rebranding opportunity?
                  Let&apos;s discuss.
                </p>
              </div>

              {isSubmitted ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    Thank You!
                  </h3>
                  <p className="text-gray-600">
                    We&apos;ll be in touch shortly to discuss this exciting
                    opportunity.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      <User className="w-4 h-4 inline mr-2" />
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      <Mail className="w-4 h-4 inline mr-2" />
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Enter your email address"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="company"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      <Building className="w-4 h-4 inline mr-2" />
                      Company/Organization
                    </label>
                    <input
                      type="text"
                      id="company"
                      name="company"
                      value={formData.company}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Your company or investment firm"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="message"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      <MessageSquare className="w-4 h-4 inline mr-2" />
                      Message/Interest
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={4}
                      value={formData.message}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                      placeholder="Tell us about your interest in this opportunity..."
                    ></textarea>
                  </div>

                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    <Send className="w-5 h-5" />
                    Submit Inquiry
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showPitch) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="container mx-auto px-4 py-16">
          <button
            onClick={() => setShowPitch(false)}
            className="mb-8 text-blue-600 hover:text-blue-800 flex items-center gap-2 transition-colors"
          >
            ← Back to Overview
          </button>

          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-3 bg-blue-600 text-white px-6 py-3 rounded-full mb-6">
                <TrendingUp className="w-6 h-6" />
                <span className="font-semibold text-lg">
                  Investment Opportunity
                </span>
              </div>
              <h1 className="text-5xl font-bold text-gray-900 mb-6">
                WhatPrice Rebrand <span className="text-blue-600">Pitch</span>
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                From Pakistan&apos;s leading price discovery platform to a
                scalable subscription-based marketplace
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-16">
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Proven Track Record
                </h3>
                <ul className="space-y-3 text-gray-600">
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span>
                      <strong>9 years</strong> of successful operations with
                      high organic traffic
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span>
                      Trusted by vendors and consumers across{" "}
                      <strong>Karachi, Lahore, and Islamabad</strong>
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span>
                      <strong>Recognized brand</strong> for accurate price
                      comparison in Pakistan
                    </span>
                  </li>
                </ul>
              </div>

              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
                  <Target className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Rebrand Opportunity
                </h3>
                <div className="space-y-4">
                  <div className="p-4 bg-red-50 rounded-lg">
                    <p className="text-sm font-medium text-red-800">
                      Previous Model
                    </p>
                    <p className="text-red-700">100% Google AdSense revenue</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm font-medium text-green-800">
                      New Model
                    </p>
                    <p className="text-green-700">
                      Vendor subscriptions + premium visibility credits
                    </p>
                  </div>
                  <p className="text-gray-600">
                    Free tier for limited listings, premium tier unlocks scale
                    and priority placement
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white mb-12">
              <div className="max-w-3xl mx-auto text-center">
                <h3 className="text-3xl font-bold mb-4">Why Now?</h3>
                <div className="grid md:grid-cols-3 gap-6 mt-8">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="w-8 h-8" />
                    </div>
                    <h4 className="font-semibold mb-2">Market Maturity</h4>
                    <p className="text-sm opacity-90">
                      Vendors are ready to pay for exposure and visibility
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <TrendingUp className="w-8 h-8" />
                    </div>
                    <h4 className="font-semibold mb-2">Technology Ready</h4>
                    <p className="text-sm opacity-90">
                      Automation & AI reduce manual work—scalability achieved
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Target className="w-8 h-8" />
                    </div>
                    <h4 className="font-semibold mb-2">Brand Trust</h4>
                    <p className="text-sm opacity-90">
                      Opportunity to revive trusted brand with sustainable model
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center">
              <h3 className="text-3xl font-bold text-gray-900 mb-4">
                Next Step
              </h3>
              <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                Rebrand WhatPrice into a vendor-first subscription marketplace.
                We&apos;re seeking strategic partners, early adopters, and
                investors to scale this proven concept.
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-8 rounded-full font-semibold text-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 flex items-center gap-3 mx-auto"
              >
                <Mail className="w-6 h-6" />
                Connect With Us
                <ArrowRight className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="inline-block bg-blue-600 text-white px-6 py-2 rounded-full text-sm font-semibold mb-6">
            Pakistan&apos;s Premier Price Discovery Platform
          </div>
          <h1 className="text-6xl font-bold text-gray-900 mb-6">
            <span className="text-blue-600">WhatPrice</span> Evolution
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            9 years of proven success, now ready for transformation. From
            content-driven platform to vendor-first marketplace.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setShowPitch(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-8 rounded-full font-semibold text-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 flex items-center gap-3 justify-center"
            >
              View Rebrand Pitch
              <ArrowRight className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Journey Section */}
        <div className="max-w-6xl mx-auto mb-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              The WhatPrice Journey
            </h2>
            <p className="text-xl text-gray-600">
              A decade of building Pakistan&apos;s most trusted price comparison
              platform
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 mb-12">
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    Content & Accuracy Excellence
                  </h3>
                </div>
                <p className="text-gray-600 mb-4">
                  Two years dedicated to building reliable content pipeline with
                  direct vendor submissions and manual data collection across
                  major Pakistani cities.
                </p>
                <p className="text-gray-600">
                  Achieved deep familiarity with Karachi, Lahore, and Islamabad
                  pricing structures, enabling accurate inter-city price
                  estimations.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    Audience Impact
                  </h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-gray-600">
                      <strong>Primary:</strong> End customers searching for
                      competitive prices
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-gray-600">
                      <strong>Secondary:</strong> Shopkeepers analyzing
                      wholesale vs retail trends
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Target className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    Growth Strategy
                  </h3>
                </div>
                <p className="text-gray-600 mb-4">
                  SEO-driven organic growth with Google search as the primary
                  traffic source. Strategic marketing campaigns boosted
                  authority and early adoption.
                </p>
                <p className="text-gray-600">
                  Revenue generated entirely through Google AdSense, focusing on
                  traffic growth as the key success metric.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-orange-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    Category Evolution
                  </h3>
                </div>
                <p className="text-gray-600 mb-4">
                  Started broadly with Electronics → Appliances → Lifestyle,
                  then strategically narrowed to high-demand categories with
                  sustainable update cycles.
                </p>
                <p className="text-gray-600">
                  Geographic focus on major cities with selective expansion to
                  Faisalabad and Multan for unique products.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Rebranding Plan */}
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              The Rebranding Vision
            </h2>
            <p className="text-xl text-gray-600">
              Transforming from content platform to vendor-first marketplace
            </p>
          </div>

          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white mb-12">
            <div className="max-w-4xl mx-auto">
              <h3 className="text-3xl font-bold text-center mb-8">
                Revenue Model Transformation
              </h3>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-white bg-opacity-10 rounded-xl p-6">
                  <h4 className="text-xl font-bold mb-4">Previous Model</h4>
                  <div className="space-y-2">
                    <p>• 100% Google AdSense dependency</p>
                    <p>• Traffic-focused growth strategy</p>
                    <p>• Free vendor participation</p>
                    <p>• No direct vendor monetization</p>
                  </div>
                </div>
                <div className="bg-white bg-opacity-10 rounded-xl p-6">
                  <h4 className="text-xl font-bold mb-4">New Model</h4>
                  <div className="space-y-2">
                    <p>• Vendor subscription plans</p>
                    <p>• Free tier with limited listings</p>
                    <p>• Premium tier with expanded features</p>
                    <p>• Credits for sticky posts & priority placement</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                Key Advantages
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <p className="text-gray-600">
                    <strong>Self-Updating:</strong> Vendors maintain their own
                    listings, ensuring automatic accuracy
                  </p>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <p className="text-gray-600">
                    <strong>Scalable Model:</strong> Reduces reliance on manual
                    updates and data collection
                  </p>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <p className="text-gray-600">
                    <strong>Sustainable Revenue:</strong> Direct monetization
                    from vendor services
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                Focus Transformation
              </h3>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="font-semibold text-blue-800 mb-2">
                    Primary Target
                  </p>
                  <p className="text-blue-700">
                    Vendors and retailers as direct paying clients
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="font-semibold text-green-800 mb-2">
                    Continued Benefit
                  </p>
                  <p className="text-green-700">
                    End customers maintain free access to price discovery
                  </p>
                </div>
                <p className="text-gray-600 text-sm">
                  This dual-focus approach ensures platform value while creating
                  sustainable revenue streams.
                </p>
              </div>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={() => setShowPitch(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-8 rounded-full font-semibold text-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 flex items-center gap-3 mx-auto"
            >
              View Complete Pitch
              <ArrowRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatPriceLanding;
