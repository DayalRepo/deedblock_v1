'use client';

import { motion } from 'framer-motion';
import { Lexend_Deca } from 'next/font/google';
import { ArrowLeft, MessageSquare, Send, CheckCircle, AlertCircle, Phone, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

const lexendDeca = Lexend_Deca({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

type FeedbackType = 'general' | 'bug' | 'feature' | 'support';
type Priority = 'low' | 'medium' | 'high';

const feedbackTypes = {
  general: 'General',
  bug: 'Bug',
  feature: 'New Feature',
  support: 'Support'
};

export default function FeedbackPage() {
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('general');
  const [priority, setPriority] = useState<Priority>('medium');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const maxMessageLength = 2000;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!message.trim()) {
      newErrors.message = 'Message is required';
    } else if (message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (phone && !/^[0-9]{10}$/.test(phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Please enter a valid 10-digit phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // In a real application, you would send this to a backend API
    console.log({
      feedbackType,
      priority: feedbackType === 'bug' || feedbackType === 'support' ? priority : undefined,
      name,
      email,
      phone,
      subject,
      message,
      timestamp: new Date().toISOString()
    });

    setIsSubmitting(false);
    setSubmitted(true);
    
    setTimeout(() => {
      setSubmitted(false);
      setName('');
      setEmail('');
      setPhone('');
      setSubject('');
      setMessage('');
      setFeedbackType('general');
      setPriority('medium');
      setErrors({});
    }, 5000);
  };

  const remainingChars = maxMessageLength - message.length;

  return (
    <main className={lexendDeca.className + " min-h-screen bg-black text-white pt-24 sm:pt-32 pb-20"}>
      <div className="px-3 sm:px-6 lg:px-36 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8"
          >
            <ArrowLeft size={20} />
            <span>Back to Home</span>
          </Link>

          <div className="flex items-center gap-3 mb-4">
            <MessageSquare className="text-white" size={40} />
            <h1 className="text-4xl sm:text-5xl font-light">Feedback</h1>
          </div>
          <p className="text-gray-400 mb-2">
            We value your feedback and are committed to improving TITLEREG based on your input.
          </p>
          <p className="text-gray-400 mb-12">
            Share your thoughts, report issues, suggest features, or let us know how we can serve you better.
          </p>

          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gray-900/50 border border-gray-800 rounded-lg p-6 sm:p-12 text-center"
            >
              <CheckCircle className="text-white mx-auto mb-4" size={48} />
              <h2 className="text-2xl font-light text-white mb-2">Thank You!</h2>
              <p className="text-gray-300 mb-4">
                Your feedback has been received successfully. We appreciate you taking the time to share your thoughts with us.
              </p>
              <p className="text-gray-400 text-sm">
                We&apos;ll review your {feedbackType === 'bug' ? 'bug report' : feedbackType === 'feature' ? 'feature request' : feedbackType === 'support' ? 'support request' : 'feedback'} and get back to you if needed.
              </p>
            </motion.div>
          ) : (
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              onSubmit={handleSubmit}
              className="bg-gray-900/50 border border-gray-800 rounded-lg p-4 sm:p-8"
            >
              {/* Feedback Type */}
              <div className="mb-8">
                <label className="block text-white font-light mb-4 text-lg">
                  Feedback Type <span className="text-gray-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {(Object.keys(feedbackTypes) as FeedbackType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFeedbackType(type)}
                      className={`w-full h-12 rounded-lg border-2 transition-all flex items-center justify-center ${
                        feedbackType === type
                          ? 'border-white bg-white text-black'
                          : 'border-gray-700 bg-gray-800/50 text-gray-300 hover:border-gray-600'
                      }`}
                    >
                      <span className="font-light text-base">{feedbackTypes[type]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Priority (for bug and support) */}
              {(feedbackType === 'bug' || feedbackType === 'support') && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-8"
                >
                  <label className="block text-white font-light mb-3">Priority</label>
                  <div className="flex gap-3">
                    {(['low', 'medium', 'high'] as Priority[]).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPriority(p)}
                        className={`px-6 py-2 rounded-lg text-sm font-light transition-colors ${
                          priority === p
                            ? 'bg-white text-black'
                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        }`}
                      >
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Contact Information */}
              <div className="mb-8">
                <h3 className="text-white font-light mb-4 text-lg">Contact Information (Optional)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name */}
                  <div>
                    <label htmlFor="name" className="block text-white font-light mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-600 transition-colors"
                      placeholder="Your name"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block text-white font-light mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errors.email) setErrors({ ...errors, email: '' });
                      }}
                      className={`w-full px-4 py-3 bg-gray-800 border rounded-lg text-white placeholder-gray-500 focus:outline-none transition-colors ${
                        errors.email ? 'border-red-500 focus:border-red-500' : 'border-gray-700 focus:border-gray-600'
                      }`}
                      placeholder="your.email@example.com"
                    />
                    {errors.email && (
                      <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                        <AlertCircle size={12} />
                        {errors.email}
                      </p>
                    )}
                  </div>
                </div>

                {/* Phone */}
                <div className="mt-6">
                  <label htmlFor="phone" className="block text-white font-light mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="tel"
                      id="phone"
                      value={phone}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setPhone(value);
                        if (errors.phone) setErrors({ ...errors, phone: '' });
                      }}
                      className={`w-full pl-12 pr-4 py-3 bg-gray-800 border rounded-lg text-white placeholder-gray-500 focus:outline-none transition-colors ${
                        errors.phone ? 'border-red-500 focus:border-red-500' : 'border-gray-700 focus:border-gray-600'
                      }`}
                      placeholder="10-digit phone number"
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle size={12} />
                      {errors.phone}
                    </p>
                  )}
                </div>
              </div>

              {/* Subject */}
              <div className="mb-8">
                <label htmlFor="subject" className="block text-white font-light mb-2 text-lg">
                  Subject (Optional)
                </label>
                <input
                  type="text"
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-600 transition-colors"
                  placeholder={`Brief summary of your ${feedbackType === 'bug' ? 'bug report' : feedbackType === 'feature' ? 'feature request' : feedbackType === 'support' ? 'support request' : 'feedback'}`}
                />
              </div>

              {/* Message */}
              <div className="mb-8">
                <label htmlFor="message" className="block text-white font-light mb-2 text-lg">
                  Message <span className="text-gray-500">*</span>
                </label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => {
                    if (e.target.value.length <= maxMessageLength) {
                      setMessage(e.target.value);
                      if (errors.message) setErrors({ ...errors, message: '' });
                    }
                  }}
                  required
                  rows={12}
                  className={`w-full px-4 py-3 bg-gray-800 border rounded-lg text-white placeholder-gray-500 focus:outline-none resize-none transition-colors ${
                    errors.message ? 'border-red-500 focus:border-red-500' : 'border-gray-700 focus:border-gray-600'
                  }`}
                  placeholder={
                    feedbackType === 'bug'
                      ? 'Please describe the bug in detail:\n\n• What were you trying to do?\n• What happened instead?\n• Steps to reproduce the issue\n• Expected behavior\n• Screenshots or error messages (if any)'
                      : feedbackType === 'feature'
                      ? 'Describe the feature you would like to see:\n\n• What feature would you like?\n• How would it help you?\n• Any specific requirements or preferences?'
                      : feedbackType === 'support'
                      ? 'Please describe the issue you\'re experiencing:\n\n• What problem are you facing?\n• When did it start?\n• Have you tried any solutions?\n• Any error messages?'
                      : 'Tell us what\'s on your mind. Share your thoughts, suggestions, or any feedback you have about TITLEREG...'
                  }
                />
                <div className="flex justify-between items-center mt-2">
                  {errors.message && (
                    <p className="text-red-400 text-xs flex items-center gap-1">
                      <AlertCircle size={12} />
                      {errors.message}
                    </p>
                  )}
                  <p className={`text-xs ml-auto ${remainingChars < 50 ? 'text-red-400' : remainingChars < 200 ? 'text-yellow-400' : 'text-gray-400'}`}>
                    {remainingChars} characters remaining
                  </p>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-3 bg-white text-black rounded-lg font-medium hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed min-w-[160px]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Send size={20} />
                      <span>Send Feedback</span>
                    </>
                  )}
                </button>
              </div>
            </motion.form>
          )}

          {/* Additional Information */}
          <div className="mt-12 text-center text-gray-400 text-sm">
            <p className="mb-2">
              We typically respond to feedback within 1-2 business days.
            </p>
            <p>
              For urgent matters, please visit our <Link href="/help" className="text-white hover:underline">Help Center</Link> for immediate assistance.
            </p>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
