'use client';

import { motion } from 'framer-motion';
import { DM_Sans } from 'next/font/google';
import { ArrowLeft, MessageSquare, Send, CheckCircle, AlertCircle, Phone, Loader2, Paperclip, X, FileText, ArrowUp } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
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
  const [attachments, setAttachments] = useState<File[]>([]);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const maxMessageLength = 2000;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const totalFiles = attachments.length + newFiles.length;

      if (totalFiles > 5) {
        setErrors({ ...errors, attachments: 'You can only attach up to 5 files' });
        return;
      }

      // Check file size (max 5MB per file)
      const oversizeFiles = newFiles.filter(file => file.size > 5 * 1024 * 1024);
      if (oversizeFiles.length > 0) {
        setErrors({ ...errors, attachments: 'Each file must be less than 5MB' });
        return;
      }

      setAttachments([...attachments, ...newFiles]);
      if (errors.attachments) {
        const { attachments: _, ...rest } = errors;
        setErrors(rest);
      }
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

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
    // TODO: Implement backend API integration for feedback submission

    setIsSubmitting(false);
    setSubmitted(true);

    setTimeout(() => {
      setSubmitted(false);
      setName('');
      setEmail('');
      setPhone('');
      setSubject('');
      setMessage('');
      setAttachments([]);
      setFeedbackType('general');
      setPriority('medium');
      setErrors({});
    }, 5000);
  };

  const remainingChars = maxMessageLength - message.length;

  return (
    <main className={dmSans.className + " min-h-screen bg-[#FAF9F6] text-black pt-24 sm:pt-32 pb-20"}>
      <div className="px-3 sm:px-6 lg:px-36 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-black transition-colors mb-8"
          >
            <ArrowLeft size={20} />
            <span>Back to Home</span>
          </Link>

          <div className="flex items-center gap-3 mb-4">
            <MessageSquare className="text-black" size={40} />
            <h1 className="text-4xl sm:text-5xl font-light">Feedback</h1>
          </div>
          <p className="text-gray-600 mb-2">
            We value your feedback and are committed to improving DeedBlock based on your input.
          </p>
          <p className="text-gray-600 mb-12">
            Share your thoughts, report issues, suggest features, or let us know how we can serve you better.
          </p>

          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white border border-gray-200 rounded-lg p-6 sm:p-12 text-center"
            >
              <CheckCircle className="text-black mx-auto mb-4" size={48} />
              <h2 className="text-2xl font-light text-black mb-2">Thank You!</h2>
              <p className="text-gray-700 mb-4">
                Your feedback has been received successfully. We appreciate you taking the time to share your thoughts with us.
              </p>
              <p className="text-gray-600 text-sm">
                We&apos;ll review your {feedbackType === 'bug' ? 'bug report' : feedbackType === 'feature' ? 'feature request' : feedbackType === 'support' ? 'support request' : 'feedback'} and get back to you if needed.
              </p>
            </motion.div>
          ) : (
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              onSubmit={handleSubmit}
              className="bg-white border border-gray-200 rounded-lg p-4 sm:p-8"
            >
              {/* Feedback Type */}
              <div className="mb-8">
                <label className="block text-black font-light mb-4 text-lg">
                  Feedback Type <span className="text-gray-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {(Object.keys(feedbackTypes) as FeedbackType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFeedbackType(type)}
                      className={`w-full h-12 rounded-lg border-2 transition-all flex items-center justify-center ${feedbackType === type
                        ? 'border-black bg-black text-white'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-black hover:text-black'
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
                  <label className="block text-black font-light mb-3">Priority</label>
                  <div className="flex flex-wrap gap-3">
                    {(['low', 'medium', 'high'] as Priority[]).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPriority(p)}
                        className={`px-6 py-2 rounded-lg text-sm font-light transition-colors ${priority === p
                          ? 'bg-black text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
                <h3 className="text-black font-light mb-4 text-lg">Contact Information (Optional)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name */}
                  <div>
                    <label htmlFor="name" className="block text-black font-light mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-black placeholder-gray-400 focus:outline-none focus:border-black transition-colors"
                      placeholder="Your name"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block text-black font-light mb-2">
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
                      className={`w-full px-4 py-3 bg-white border rounded-lg text-black placeholder-gray-400 focus:outline-none transition-colors ${errors.email ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-black'
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
                  <label htmlFor="phone" className="block text-black font-light mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600" size={20} />
                    <input
                      type="tel"
                      id="phone"
                      value={phone}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setPhone(value);
                        if (errors.phone) setErrors({ ...errors, phone: '' });
                      }}
                      className={`w-full pl-12 pr-4 py-3 bg-white border rounded-lg text-black placeholder-gray-400 focus:outline-none transition-colors ${errors.phone ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-black'
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
                <label htmlFor="subject" className="block text-black font-light mb-2 text-lg">
                  Subject (Optional)
                </label>
                <input
                  type="text"
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-black placeholder-gray-400 focus:outline-none focus:border-black transition-colors"
                  placeholder={`Brief summary of your ${feedbackType === 'bug' ? 'bug report' : feedbackType === 'feature' ? 'feature request' : feedbackType === 'support' ? 'support request' : 'feedback'}`}
                />
              </div>

              {/* Message */}
              <div className="mb-8">
                <label htmlFor="message" className="block text-black font-light mb-2 text-lg">
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
                  className={`w-full px-4 py-3 bg-white border rounded-lg text-black placeholder-gray-400 focus:outline-none resize-none transition-colors ${errors.message ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-black'
                    }`}
                  placeholder={
                    feedbackType === 'bug'
                      ? 'Please describe the bug in detail:\n\n• What were you trying to do?\n• What happened instead?\n• Steps to reproduce the issue\n• Expected behavior\n• Screenshots or error messages (if any)'
                      : feedbackType === 'feature'
                        ? 'Describe the feature you would like to see:\n\n• What feature would you like?\n• How would it help you?\n• Any specific requirements or preferences?'
                        : feedbackType === 'support'
                          ? 'Please describe the issue you\'re experiencing:\n\n• What problem are you facing?\n• When did it start?\n• Have you tried any solutions?\n• Any error messages?'
                          : 'Tell us what\'s on your mind. Share your thoughts, suggestions, or any feedback you have about DeedBlock...'
                  }
                />

                {attachments.length > 0 && (
                  <div className="mt-4 mb-2 flex flex-wrap gap-3">
                    {attachments.map((file, index) => (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        key={index}
                        className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg shadow-sm group hover:border-black transition-colors w-full sm:w-48"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="p-2 bg-gray-50 rounded-md">
                            <FileText size={18} className="text-gray-600" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-medium text-black truncate">{file.name}</span>
                            <span className="text-xs text-gray-500">{(file.size / 1024).toFixed(0)} KB</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAttachment(index)}
                          className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                          aria-label="Remove file"
                        >
                          <X size={16} />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-2 gap-2">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-4">
                      <label
                        htmlFor="file-upload"
                        className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors text-sm font-medium"
                      >
                        <Paperclip size={16} />
                        Attach Files
                      </label>
                      <input
                        id="file-upload"
                        type="file"
                        multiple
                        onChange={handleFileChange}
                        className="hidden"
                        accept="image/*,.pdf,.doc,.docx"
                      />
                      <span className="text-xs text-gray-500 hidden sm:inline">Max 5 files, 5MB each</span>
                    </div>
                  </div>
                  <p className={`text-xs ${remainingChars < 50 ? 'text-red-400' : remainingChars < 200 ? 'text-yellow-400' : 'text-gray-600'} sm:ml-auto`}>
                    {remainingChars} characters remaining
                  </p>
                </div>

                {/* Validation Errors */}
                <div className="flex flex-col gap-1 mt-2">
                  {errors.message && (
                    <p className="text-red-400 text-xs flex items-center gap-1">
                      <AlertCircle size={12} />
                      {errors.message}
                    </p>
                  )}
                  {errors.attachments && (
                    <p className="text-red-400 text-xs flex items-center gap-1">
                      <AlertCircle size={12} />
                      {errors.attachments}
                    </p>
                  )}
                </div>


              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-8 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed min-w-[160px]"
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
          <div className="mt-12 text-center text-gray-600 text-sm">
            <p className="mb-2">
              We typically respond to feedback within 1-2 business days.
            </p>
            <p>
              For urgent matters, please visit our <Link href="/help" className="text-black underline">Help Center</Link> for immediate assistance.
            </p>
          </div>
        </motion.div>
      </div>

      {/* Back to Top Button */}
      {showScrollTop && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 bg-black text-white p-3 rounded-full shadow-lg hover:bg-gray-800 transition-colors z-50"
          aria-label="Back to top"
        >
          <ArrowUp size={24} />
        </motion.button>
      )}
    </main>
  );
}
