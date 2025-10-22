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
  DollarSign,
  PieChart,
  Clock,
  Globe,
  Briefcase,
  Shield,
} from "lucide-react";

const InvestorPitch = () => {
  const [showPitch, setShowPitch] = useState(false);
  const [showEquity, setShowEquity] = useState(false);
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

  const handleSubmit = async () => {
    if (!formData.name || !formData.email) {
      alert("Please fill in required fields");
      return;
    }

    try {
      const response = await fetch("/api/submit-form", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setIsSubmitted(true);

        setTimeout(() => {
          setIsSubmitted(false);
          setFormData({ name: "", email: "", company: "", message: "" });
          setShowForm(false);
        }, 3000);
      } else {
        alert("Failed to submit form. Please try again.");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("An error occurred. Please try again.");
    }
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
                  Interested in WhatPrice&apos;s investment opportunity?
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
                      Investment Interest
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={4}
                      value={formData.message}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                      placeholder="Which investment phase interests you? What value can you add beyond capital?"
                    ></textarea>
                  </div>

                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    <Send className="w-5 h-5" />
                    Submit Investment Inquiry
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showEquity) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="container mx-auto px-4 py-16">
          <button
            onClick={() => setShowEquity(false)}
            className="mb-8 text-blue-600 hover:text-blue-800 flex items-center gap-2 transition-colors"
          >
            ← Back to Pitch
          </button>

          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-3 bg-green-600 text-white px-6 py-3 rounded-full mb-6">
                <PieChart className="w-6 h-6" />
                <span className="font-semibold text-lg">
                  Equity Structure & Investment Terms
                </span>
              </div>
              <h1 className="text-5xl font-bold text-gray-900 mb-6">
                Strategic <span className="text-blue-600">Partnership</span>{" "}
                Opportunity
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Join us in building Pakistan&apos;s premier vendor-first
                marketplace
              </p>
            </div>

            {/* Founder Profile */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 mb-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Shield className="w-7 h-7 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    Founder Credentials
                  </h3>
                  <p className="text-gray-600">
                    Sole founder with proven track record
                  </p>
                </div>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-3xl font-bold text-blue-600">9 Years</p>
                  <p className="text-sm text-gray-600">
                    Building & Operating WhatPrice
                  </p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-3xl font-bold text-green-600">100%</p>
                  <p className="text-sm text-gray-600">Bootstrapped Success</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-3xl font-bold text-purple-600">
                    Full-Stack
                  </p>
                  <p className="text-sm text-gray-600">
                    Technical & Business Expertise
                  </p>
                </div>
              </div>
            </div>

            {/* Investment Phases */}
            <div className="mb-12">
              <h3 className="text-3xl font-bold text-gray-900 mb-8 text-center">
                Investment Phases
              </h3>

              <div className="space-y-6">
                {/* Phase 1 */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 border-2 border-blue-200">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <div className="inline-block bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold mb-3">
                        Phase 1: Web Development
                      </div>
                      <h4 className="text-2xl font-bold text-gray-900 mb-2">
                        Angel Investment Round
                      </h4>
                      <p className="text-gray-600">
                        Founder-led web development with proven expertise
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600 mb-1">Investment</p>
                      <p className="text-3xl font-bold text-blue-600">
                        $11-12K
                      </p>
                      <p className="text-sm text-gray-500">PKR 3-3.5M</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white rounded-lg p-4">
                      <Clock className="w-5 h-5 text-blue-600 mb-2" />
                      <p className="font-semibold text-gray-900">Timeline</p>
                      <p className="text-gray-600 text-sm">6-8 months</p>
                    </div>
                    <div className="bg-white rounded-lg p-4">
                      <PieChart className="w-5 h-5 text-blue-600 mb-2" />
                      <p className="font-semibold text-gray-900">
                        Equity Offered
                      </p>
                      <p className="text-gray-600 text-sm">8-10%</p>
                    </div>
                    <div className="bg-white rounded-lg p-4">
                      <Target className="w-5 h-5 text-blue-600 mb-2" />
                      <p className="font-semibold text-gray-900">
                        Use of Funds
                      </p>
                      <p className="text-gray-600 text-sm">Founder salary</p>
                    </div>
                  </div>

                  <div className="border-t border-blue-200 pt-4">
                    <p className="text-sm text-gray-700">
                      <strong>Deliverables:</strong> Full-featured web
                      application with vendor dashboard, subscription
                      management, and automated pricing system
                    </p>
                  </div>
                </div>

                {/* Phase 2 */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-8 border-2 border-green-200">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <div className="inline-block bg-green-600 text-white px-3 py-1 rounded-full text-sm font-semibold mb-3">
                        Phase 2: Mobile Development
                      </div>
                      <h4 className="text-2xl font-bold text-gray-900 mb-2">
                        Expansion Round
                      </h4>
                      <p className="text-gray-600">
                        Professional mobile app development (iOS & Android)
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600 mb-1">Investment</p>
                      <p className="text-3xl font-bold text-green-600">
                        $14-18K
                      </p>
                      <p className="text-sm text-gray-500">PKR 4-5M</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white rounded-lg p-4">
                      <Clock className="w-5 h-5 text-green-600 mb-2" />
                      <p className="font-semibold text-gray-900">Timeline</p>
                      <p className="text-gray-600 text-sm">4-5 months</p>
                    </div>
                    <div className="bg-white rounded-lg p-4">
                      <PieChart className="w-5 h-5 text-green-600 mb-2" />
                      <p className="font-semibold text-gray-900">
                        Additional Equity
                      </p>
                      <p className="text-gray-600 text-sm">5-7%</p>
                    </div>
                    <div className="bg-white rounded-lg p-4">
                      <Target className="w-5 h-5 text-green-600 mb-2" />
                      <p className="font-semibold text-gray-900">
                        Use of Funds
                      </p>
                      <p className="text-gray-600 text-sm">
                        Outsourced development
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-green-200 pt-4">
                    <p className="text-sm text-gray-700">
                      <strong>Deliverables:</strong> Native mobile apps for
                      vendors and customers, real-time synchronization, push
                      notifications
                    </p>
                  </div>
                </div>

                {/* Combined Package */}
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl p-8">
                  <div className="text-center mb-6">
                    <h4 className="text-3xl font-bold mb-2">
                      Complete Package Deal
                    </h4>
                    <p className="text-xl opacity-90">
                      Commit to full development cycle for preferred terms
                    </p>
                  </div>

                  <div className="grid md:grid-cols-4 gap-4">
                    <div className="text-center bg-white/20 rounded-lg p-4">
                      <DollarSign className="w-8 h-8 mx-auto mb-2" />
                      <p className="font-bold text-2xl">$25-30K</p>
                      <p className="text-sm opacity-90">Total Investment</p>
                    </div>
                    <div className="text-center bg-white/20 rounded-lg p-4">
                      <PieChart className="w-8 h-8 mx-auto mb-2" />
                      <p className="font-bold text-2xl">15-18%</p>
                      <p className="text-sm opacity-90">Total Equity</p>
                    </div>
                    <div className="text-center bg-white/20 rounded-lg p-4">
                      <Clock className="w-8 h-8 mx-auto mb-2" />
                      <p className="font-bold text-2xl">10-12</p>
                      <p className="text-sm opacity-90">Months to Market</p>
                    </div>
                    <div className="text-center bg-white/20 rounded-lg p-4">
                      <Shield className="w-8 h-8 mx-auto mb-2" />
                      <p className="font-bold text-2xl">Board Seat</p>
                      <p className="text-sm opacity-90">Advisory Rights</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Cap Table */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                Proposed Cap Table Structure
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        Founder (CEO/CTO)
                      </p>
                      <p className="text-sm text-gray-600">
                        Protected equity, immediate vesting
                      </p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">62-65%</p>
                </div>

                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                      <Briefcase className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        Angel Investor(s)
                      </p>
                      <p className="text-sm text-gray-600">Phase 1 + Phase 2</p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-green-600">15-18%</p>
                </div>

                <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">ESOP Pool</p>
                      <p className="text-sm text-gray-600">
                        Future key employees
                      </p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-purple-600">10-12%</p>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        Reserved for Series A
                      </p>
                      <p className="text-sm text-gray-600">
                        Future growth capital
                      </p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-gray-600">10-15%</p>
                </div>
              </div>
            </div>

            {/* Key Terms */}
            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <h4 className="text-xl font-bold text-gray-900 mb-4">
                  Investor Rights
                </h4>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <span className="text-gray-700">
                      Board observer rights (15%+ investors)
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <span className="text-gray-700">
                      Monthly reporting on KPIs
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <span className="text-gray-700">
                      Pro-rata rights in future rounds
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <span className="text-gray-700">
                      1x liquidation preference
                    </span>
                  </li>
                </ul>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <h4 className="text-xl font-bold text-gray-900 mb-4">
                  Founder Protections
                </h4>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                    <span className="text-gray-700">
                      Majority board control maintained
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                    <span className="text-gray-700">
                      No forced exit provisions
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                    <span className="text-gray-700">
                      Immediate vesting (9 years earned)
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                    <span className="text-gray-700">
                      Key decision veto rights
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={() => setShowForm(true)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-8 rounded-full font-semibold text-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 flex items-center gap-3 mx-auto"
              >
                <Briefcase className="w-6 h-6" />
                Express Investment Interest
                <ArrowRight className="w-6 h-6" />
              </button>
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
                  Investment Opportunity - Pakistan Market
                </span>
              </div>
              <h1 className="text-5xl font-bold text-gray-900 mb-6">
                WhatPrice{" "}
                <span className="text-blue-600">Investment Pitch</span>
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Transforming Pakistan&apos;s trusted price platform into a
                scalable vendor marketplace
              </p>
            </div>

            {/* Market Opportunity */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 mb-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <Globe className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">
                  Pakistan Market Reality
                </h3>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="font-semibold text-blue-800 mb-1">
                      Market Size
                    </p>
                    <p className="text-3xl font-bold text-blue-600">220M</p>
                    <p className="text-sm text-blue-700">
                      Population with growing digital adoption
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="font-semibold text-green-800 mb-1">
                      Internet Users
                    </p>
                    <p className="text-3xl font-bold text-green-600">70M+</p>
                    <p className="text-sm text-green-700">
                      Active internet users
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <p className="font-semibold text-purple-800 mb-1">
                      Smartphone Users
                    </p>
                    <p className="text-3xl font-bold text-purple-600">50M+</p>
                    <p className="text-sm text-purple-700">
                      Growing mobile-first economy
                    </p>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <p className="font-semibold text-orange-800 mb-1">
                      E-commerce Growth
                    </p>
                    <p className="text-3xl font-bold text-orange-600">35%</p>
                    <p className="text-sm text-orange-700">
                      YoY growth post-COVID
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-800">
                  <strong>Key Advantage:</strong> First-mover advantage in
                  vendor subscription model for price discovery in Pakistan.
                  Less competition than Western markets.
                </p>
              </div>
            </div>

            {/* Financial Projections */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white mb-8">
              <h3 className="text-3xl font-bold text-center mb-8">
                Revenue Model & Projections
              </h3>

              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white/20 rounded-xl p-6 text-center">
                  <p className="text-lg font-semibold mb-2">Year 1</p>
                  <p className="text-3xl font-bold mb-1">500</p>
                  <p className="text-sm opacity-90">Paying Vendors</p>
                  <p className="text-xl font-semibold mt-3">PKR 6M</p>
                  <p className="text-xs opacity-90">($21K revenue)</p>
                </div>

                <div className="bg-white/20 rounded-xl p-6 text-center">
                  <p className="text-lg font-semibold mb-2">Year 2</p>
                  <p className="text-3xl font-bold mb-1">2,000</p>
                  <p className="text-sm opacity-90">Paying Vendors</p>
                  <p className="text-xl font-semibold mt-3">PKR 24M</p>
                  <p className="text-xs opacity-90">($85K revenue)</p>
                </div>

                <div className="bg-white/20 rounded-xl p-6 text-center">
                  <p className="text-lg font-semibold mb-2">Year 3</p>
                  <p className="text-3xl font-bold mb-1">5,000</p>
                  <p className="text-sm opacity-90">Paying Vendors</p>
                  <p className="text-xl font-semibold mt-3">PKR 60M</p>
                  <p className="text-xs opacity-90">($215K revenue)</p>
                </div>
              </div>

              <div className="border-t border-white border-opacity-30 pt-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="font-semibold mb-2">Revenue Streams:</p>
                    <ul className="text-sm space-y-1 opacity-90">
                      <li>• Basic Plan: PKR 500/month ($1.80)</li>
                      <li>• Professional: PKR 2,000/month ($7)</li>
                      <li>• Enterprise: PKR 5,000/month ($18)</li>
                      <li>• Priority placement credits</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold mb-2">Unit Economics:</p>
                    <ul className="text-sm space-y-1 opacity-90">
                      <li>• CAC: PKR 1,500 ($5.40)</li>
                      <li>• LTV: PKR 24,000 ($86)</li>
                      <li>• Gross Margin: 85%</li>
                      <li>• Payback: 3 months</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Competitive Advantages */}
            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Proven Assets
                </h3>
                <ul className="space-y-3 text-gray-600">
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span>
                      <strong>9 years</strong> of brand trust and market
                      presence
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span>
                      <strong>SEO authority</strong> with high organic traffic
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span>
                      <strong>Vendor relationships</strong> across major cities
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span>
                      <strong>Deep market knowledge</strong> of Pakistan&apos;s
                      pricing dynamics
                    </span>
                  </li>
                </ul>
              </div>

              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
                  <Target className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Execution Strategy
                </h3>
                <div className="space-y-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-800 mb-1">
                      Phase 1
                    </p>
                    <p className="text-gray-700 text-sm">
                      Launch web platform with core cities
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-800 mb-1">
                      Phase 2
                    </p>
                    <p className="text-gray-700 text-sm">
                      Mobile apps for vendor convenience
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-800 mb-1">
                      Phase 3
                    </p>
                    <p className="text-gray-700 text-sm">
                      Expand to tier-2 cities
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-800 mb-1">
                      Phase 4
                    </p>
                    <p className="text-gray-700 text-sm">
                      Regional expansion (Bangladesh, Sri Lanka)
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Exit Strategy */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 mb-12">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                Exit Opportunities
              </h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <Briefcase className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                  <p className="font-semibold text-gray-900 mb-2">
                    Strategic Acquisition
                  </p>
                  <p className="text-sm text-gray-600">
                    E-commerce players like Daraz, or regional marketplaces
                  </p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <Globe className="w-8 h-8 text-green-600 mx-auto mb-3" />
                  <p className="font-semibold text-gray-900 mb-2">
                    Regional Expansion
                  </p>
                  <p className="text-sm text-gray-600">
                    Scale to emerging markets with similar dynamics
                  </p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <TrendingUp className="w-8 h-8 text-purple-600 mx-auto mb-3" />
                  <p className="font-semibold text-gray-900 mb-2">
                    Series A/B Funding
                  </p>
                  <p className="text-sm text-gray-600">
                    Attract growth capital at higher valuations
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center">
              <h3 className="text-3xl font-bold text-gray-900 mb-4">
                Ready to Join Our Journey?
              </h3>
              <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                We&apos;re seeking strategic partners who understand the
                Pakistan market and can add value beyond capital.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => setShowEquity(true)}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 px-8 rounded-full font-semibold text-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105 flex items-center gap-3 justify-center"
                >
                  <PieChart className="w-6 h-6" />
                  View Equity Structure
                </button>
                <button
                  onClick={() => setShowForm(true)}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-8 rounded-full font-semibold text-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 flex items-center gap-3 justify-center"
                >
                  <Mail className="w-6 h-6" />
                  Contact Us
                </button>
              </div>
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
            <span className="text-blue-600">WhatPrice</span> Investment
            Opportunity
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            9 years of proven success. Now seeking strategic partners to
            transform into Pakistan&apos;s leading vendor marketplace.
          </p>

          {/* Investment Highlight */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl p-6">
              <div className="flex items-center justify-center gap-8">
                <div className="text-center">
                  <p className="text-3xl font-bold">$25-30K</p>
                  <p className="text-sm opacity-90">Total Investment</p>
                </div>
                <div className="w-px h-12 bg-white opacity-30"></div>
                <div className="text-center">
                  <p className="text-3xl font-bold">15-18%</p>
                  <p className="text-sm opacity-90">Equity Offered</p>
                </div>
                <div className="w-px h-12 bg-white opacity-30"></div>
                <div className="text-center">
                  <p className="text-3xl font-bold">10-12</p>
                  <p className="text-sm opacity-90">Months to Market</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setShowPitch(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-8 rounded-full font-semibold text-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 flex items-center gap-3 justify-center"
            >
              View Investment Pitch
              <ArrowRight className="w-6 h-6" />
            </button>
            <button
              onClick={() => setShowEquity(true)}
              className="bg-white text-blue-600 border-2 border-blue-600 py-4 px-8 rounded-full font-semibold text-lg hover:bg-blue-50 transition-all duration-300 flex items-center gap-3 justify-center"
            >
              <PieChart className="w-6 h-6" />
              Equity Structure
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="max-w-6xl mx-auto mb-16">
          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 text-center">
              <Clock className="w-8 h-8 text-blue-600 mx-auto mb-3" />
              <p className="text-3xl font-bold text-gray-900">9 Years</p>
              <p className="text-sm text-gray-600">Market Presence</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 text-center">
              <Users className="w-8 h-8 text-green-600 mx-auto mb-3" />
              <p className="text-3xl font-bold text-gray-900">3 Cities</p>
              <p className="text-sm text-gray-600">Coverage</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 text-center">
              <TrendingUp className="w-8 h-8 text-purple-600 mx-auto mb-3" />
              <p className="text-3xl font-bold text-gray-900">85%</p>
              <p className="text-sm text-gray-600">Gross Margin</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 text-center">
              <Target className="w-8 h-8 text-orange-600 mx-auto mb-3" />
              <p className="text-3xl font-bold text-gray-900">PKR 60M</p>
              <p className="text-sm text-gray-600">Year 3 Target</p>
            </div>
          </div>
        </div>

        {/* Key Investment Points */}
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Invest in WhatPrice?
            </h2>
            <p className="text-xl text-gray-600">
              A unique opportunity to enter Pakistan&apos;s growing digital
              economy
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 mb-12">
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                De-Risked Investment
              </h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                  <span>9 years operational history</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                  <span>Established brand trust</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                  <span>Founder with proven expertise</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                  <span>Clear path to profitability</span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                <Globe className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Market Opportunity
              </h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                  <span>220M population market</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                  <span>35% YoY e-commerce growth</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                  <span>First-mover advantage</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                  <span>Regional expansion potential</span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Attractive Terms
              </h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                  <span>Low entry valuation</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                  <span>Board observer rights</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                  <span>Pro-rata rights</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                  <span>Clear exit strategy</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="text-center">
            <p className="text-lg text-gray-600 mb-6">
              Join us in building Pakistan&apos;s next unicorn from a proven
              foundation
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 px-8 rounded-full font-semibold text-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105 flex items-center gap-3 mx-auto"
            >
              <Briefcase className="w-6 h-6" />
              Express Investment Interest
              <ArrowRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvestorPitch;
