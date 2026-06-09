import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Building, 
  ArrowRight, 
  Users, 
  Clock, 
  CalendarDays, 
  Search, 
  Sparkles, 
  LineChart, 
  ChevronDown, 
  Menu, 
  X,
  Mail,
  ShieldCheck,
  CheckCircle2,
  HelpCircle,
  MessageSquare
} from 'lucide-react';

const Landing = () => {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Accordion state for FAQs
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const featuresList = [
    {
      icon: Users,
      color: 'text-primary-400 bg-primary-500/10 border-primary-500/20',
      title: 'Employee Management',
      description: 'Manage employee information, departments, and roles in a single centralized system.'
    },
    {
      icon: Clock,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      title: 'Attendance Tracking',
      description: 'Monitor employee check-ins and check-outs in real time with geolocation checks.'
    },
    {
      icon: CalendarDays,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      title: 'Leave Management',
      description: 'Handle employee leave requests, approval logs, and automated balances.'
    },
    {
      icon: Search,
      color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
      title: 'Recruitment System',
      description: 'Create job openings, screen applications, and coordinate hiring pipelines.'
    },
    {
      icon: Sparkles,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
      title: 'AI Candidate Screening',
      description: 'Analyze resumes using advanced algorithms to match the best profiles automatically.'
    },
    {
      icon: LineChart,
      color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
      title: 'Performance Reviews',
      description: 'Track employee growth, coordinate feedback cycles, and log review history.'
    }
  ];

  const pricingTiers = [
    {
      name: 'Starter',
      price: '$49',
      period: '/ month',
      description: 'Best suited for growing startups and small teams.',
      features: [
        'Up to 15 Employees',
        'Basic Attendance Tracking',
        'Self-service Leave Requesting',
        'Standard Email Support',
        'Secure Cloud Data Backup'
      ],
      cta: 'Start Free Trial',
      popular: false
    },
    {
      name: 'Professional',
      price: '$129',
      period: '/ month',
      description: 'Tailored features for expanding businesses.',
      features: [
        'Up to 75 Employees',
        'Real-time Attendance Console',
        'Leave Approval Workflow Manager',
        'Recruitment Pipeline & Boards',
        'Priority Slack & Email Support',
        'Custom Roles & Access Levels'
      ],
      cta: 'Start Free Trial',
      popular: true
    },
    {
      name: 'Enterprise',
      price: '$299',
      period: '/ month',
      description: 'Advanced capabilities for larger enterprises.',
      features: [
        'Unlimited Employees',
        'AI Candidate Resume Screening',
        'Performance Review Modules',
        'Detailed Analytics & Exports',
        'Dedicated Success Manager',
        'Custom Integrations & API'
      ],
      cta: 'Book Demo',
      popular: false
    }
  ];

  const faqs = [
    {
      question: 'How easy is the onboarding process for new employees?',
      answer: 'Extremely simple! HR Managers can add employees directly. Employees then log in with their email, instantly access their timesheet dashboards, and check in with one click.'
    },
    {
      question: 'Is employee data secure on PulseHR?',
      answer: 'Yes. PulseHR uses advanced JWT authentication and password hashing (Bcrypt). Every endpoint is gated by role-based authorization rules so only permitted Admin/HR accounts see salaries and reports.'
    },
    {
      question: 'Can I upgrade or downgrade my pricing plan later?',
      answer: 'Absolutely. You can change your plan at any time through your billing settings, and the rates will be automatically prorated.'
    },
    {
      question: 'Do you offer customer support for setup?',
      answer: 'Yes! We provide full onboarding support, technical guides, and direct assistance to help set up departments and import employee lists.'
    }
  ];

  const testimonials = [
    {
      quote: "PulseHR has transformed our operations. The AI screening saved us hours of manual parsing, and leave approval is now fully automated.",
      author: "Sarah Jenkins",
      position: "VP of HR, TechVibe Studios",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80"
    },
    {
      quote: "The real-time attendance tracking is exactly what we needed for our hybrid workforce. The dashboard statistics give us clear monthly summaries.",
      author: "Marcus Vance",
      position: "COO, Zenith Logistics",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 overflow-x-hidden selection:bg-primary-500 selection:text-white scroll-smooth">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary-600/5 rounded-full blur-[160px] pointer-events-none"></div>
      <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-[160px] pointer-events-none"></div>

      {/* Floating Header */}
      <header className="fixed top-0 inset-x-0 h-20 glass border-b border-slate-800/60 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto h-full px-6 flex items-center justify-between">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary-600/20 group-hover:scale-105 transition-transform duration-200">
              <Building size={20} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-wide">PulseHR</h1>
              <span className="text-[10px] text-primary-400 font-semibold tracking-widest uppercase">Operations Control</span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-400">
            <a href="#hero" className="hover:text-white transition">Home</a>
            <a href="#features" className="hover:text-white transition">Features</a>
            <a href="#pricing" className="hover:text-white transition">Pricing</a>
            <a href="#testimonials" className="hover:text-white transition">Testimonials</a>
            <a href="#faq" className="hover:text-white transition">FAQ</a>
            <a href="#contact" className="hover:text-white transition">Contact</a>
          </nav>

          {/* CTAs */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <Link 
                to="/dashboard" 
                className="px-5 py-2.5 bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-primary-600/10 transition flex items-center gap-1.5"
              >
                Dashboard <ArrowRight size={14} />
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-xs font-bold text-slate-300 hover:text-white transition">
                  Book Demo
                </Link>
                <Link 
                  to="/login" 
                  className="px-5 py-2.5 bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-primary-600/10 transition"
                >
                  Start Free Trial
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1 rounded-lg text-slate-450 hover:bg-slate-800/60 hover:text-white md:hidden text-slate-400"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 top-20 bg-slate-950/95 backdrop-blur-md z-45 flex flex-col p-6 space-y-6 md:hidden">
          <a href="#hero" onClick={() => setMobileMenuOpen(false)} className="text-lg font-bold text-slate-300 hover:text-white">Home</a>
          <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-lg font-bold text-slate-300 hover:text-white">Features</a>
          <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="text-lg font-bold text-slate-300 hover:text-white">Pricing</a>
          <a href="#testimonials" onClick={() => setMobileMenuOpen(false)} className="text-lg font-bold text-slate-300 hover:text-white">Testimonials</a>
          <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="text-lg font-bold text-slate-300 hover:text-white">FAQ</a>
          <a href="#contact" onClick={() => setMobileMenuOpen(false)} className="text-lg font-bold text-slate-300 hover:text-white">Contact</a>
          <div className="pt-6 border-t border-slate-800/80 flex flex-col gap-4">
            {user ? (
              <Link 
                to="/dashboard" 
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-3 bg-primary-600 text-white text-sm font-bold rounded-xl"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link 
                  to="/login" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-3 bg-slate-900 border border-slate-800 text-slate-300 text-sm font-bold rounded-xl"
                >
                  Book Demo
                </Link>
                <Link 
                  to="/login" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-3 bg-primary-600 text-white text-sm font-bold rounded-xl"
                >
                  Start Free Trial
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      {/* 1. HERO SECTION */}
      <section id="hero" className="relative pt-36 pb-20 md:pt-48 md:pb-32 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
        {/* Glow Element */}
        <div className="absolute top-20 w-80 h-80 bg-primary-500/20 rounded-full blur-[100px] pointer-events-none"></div>

        {/* Small Intro Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-xs font-bold uppercase tracking-widest mb-6">
          <Sparkles size={12} /> Next-Gen HR Automation
        </div>

        {/* Headline */}
        <h2 className="text-4xl md:text-6xl font-black text-white leading-tight tracking-tight max-w-4xl">
          Manage Your Workforce Smarter with <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-indigo-500">AI-Powered</span> HR Operations
        </h2>

        {/* Subheadline */}
        <p className="text-base md:text-lg text-slate-400 mt-6 max-w-2xl font-medium leading-relaxed">
          Simplify employee management, hiring, attendance tracking, and performance reviews from a single platform.
        </p>

        {/* Call to Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mt-10 w-full sm:w-auto">
          <Link 
            to="/login" 
            className="px-8 py-3.5 bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-xl shadow-lg shadow-primary-600/20 transition-all duration-200 text-center"
          >
            Start Free Trial
          </Link>
          <Link 
            to="/login" 
            className="px-8 py-3.5 bg-slate-900 border border-slate-800 text-slate-200 hover:text-white font-bold rounded-xl transition duration-200 text-center"
          >
            Schedule Demo
          </Link>
        </div>

        {/* Interactive Dashboard Preview Graphic */}
        <div className="mt-20 w-full max-w-5xl glass-card rounded-2xl p-4 border border-slate-800/80 shadow-2xl relative overflow-hidden group">
          <div className="h-6 flex items-center gap-2 mb-4 px-2 border-b border-slate-800/40 pb-3">
            <span className="w-2.5 h-2.5 bg-red-500 rounded-full"></span>
            <span className="w-2.5 h-2.5 bg-yellow-500 rounded-full"></span>
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span>
            <span className="text-[10px] text-slate-500 font-bold ml-2">PULSEHR PORTAL PREVIEW</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left p-2">
            <div className="p-5 bg-slate-900/60 border border-slate-800/40 rounded-xl space-y-2">
              <span className="text-[10px] font-bold text-primary-400 tracking-wider uppercase">Active Staff</span>
              <p className="text-2xl font-black text-white">48 Employees</p>
              <div className="w-full bg-slate-800 h-1 rounded overflow-hidden">
                <div className="w-3/4 bg-primary-500 h-full"></div>
              </div>
            </div>
            <div className="p-5 bg-slate-900/60 border border-slate-800/40 rounded-xl space-y-2">
              <span className="text-[10px] font-bold text-emerald-400 tracking-wider uppercase">Today's Checkins</span>
              <p className="text-2xl font-black text-white">92.4% Present</p>
              <div className="w-full bg-slate-800 h-1 rounded overflow-hidden">
                <div className="w-[92%] bg-emerald-500 h-full"></div>
              </div>
            </div>
            <div className="p-5 bg-slate-900/60 border border-slate-800/40 rounded-xl space-y-2">
              <span className="text-[10px] font-bold text-amber-400 tracking-wider uppercase">Leave Status</span>
              <p className="text-2xl font-black text-white">2 Pending Approvals</p>
              <div className="w-full bg-slate-800 h-1 rounded overflow-hidden">
                <div className="w-1/3 bg-amber-500 h-full"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. FEATURES SECTION */}
      <section id="features" className="scroll-mt-20 py-20 bg-slate-900/20 border-y border-slate-900 px-6">
        <div className="max-w-7xl mx-auto space-y-12">
          {/* Section Header */}
          <div className="text-center space-y-3">
            <span className="text-xs font-bold text-primary-400 uppercase tracking-widest">Capabilities</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white">Everything You Need to Manage Operations</h2>
            <p className="text-slate-400 max-w-xl mx-auto text-sm">
              All tools built into a unified system to handle employees, leaves, attendance, and candidate recruitment.
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuresList.map((f, i) => {
              const Icon = f.icon;
              return (
                <div 
                  key={i} 
                  className="glass-card p-6 rounded-2xl border border-slate-800/60 hover:border-slate-700/60 transition duration-300 hover:-translate-y-1 hover:shadow-lg space-y-4"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${f.color}`}>
                    <Icon size={20} />
                  </div>
                  <h4 className="text-base font-bold text-white">{f.title}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">{f.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. TESTIMONIALS SECTION */}
      <section id="testimonials" className="scroll-mt-20 py-20 px-6 max-w-7xl mx-auto space-y-12">
        {/* Section Header */}
        <div className="text-center space-y-3">
          <span className="text-xs font-bold text-primary-400 uppercase tracking-widest">Success Stories</span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white">Loved by HR Leaders Worldwide</h2>
          <p className="text-slate-400 max-w-xl mx-auto text-sm">
            Read comments from administrators and managers who have simplified their workflows with PulseHR.
          </p>
        </div>

        {/* Testimonials grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {testimonials.map((t, i) => (
            <div key={i} className="glass p-6 md:p-8 rounded-2xl border border-slate-800/60 flex flex-col justify-between space-y-6">
              <p className="text-sm italic text-slate-300 leading-relaxed">
                "{t.quote}"
              </p>
              <div className="flex items-center gap-3">
                <img 
                  src={t.avatar} 
                  alt={t.author} 
                  className="w-10 h-10 rounded-full object-cover border border-slate-800"
                />
                <div>
                  <h5 className="text-sm font-bold text-white">{t.author}</h5>
                  <p className="text-xs text-slate-500">{t.position}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. PRICING SECTION */}
      <section id="pricing" className="scroll-mt-20 py-20 bg-slate-900/20 border-y border-slate-900 px-6">
        <div className="max-w-7xl mx-auto space-y-12">
          {/* Section Header */}
          <div className="text-center space-y-3">
            <span className="text-xs font-bold text-primary-400 uppercase tracking-widest">Pricing Plans</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white">Simple, Predictable Pricing</h2>
            <p className="text-slate-400 max-w-xl mx-auto text-sm">
              Choose the perfect plan for your business size. No hidden setup fees or surprise costs.
            </p>
          </div>

          {/* Pricing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto items-stretch">
            {pricingTiers.map((p, i) => (
              <div 
                key={i} 
                className={`glass-card rounded-2xl p-6 md:p-8 border flex flex-col justify-between space-y-6 relative hover:border-slate-700/60 transition duration-300 ${
                  p.popular 
                    ? 'border-primary-500/40 shadow-xl shadow-primary-500/5 ring-1 ring-primary-500/20 scale-102 md:scale-105 bg-slate-900/60' 
                    : 'border-slate-800/60 bg-slate-950/40'
                }`}
              >
                {p.popular && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary-600 text-[10px] font-black text-white uppercase tracking-widest rounded-full shadow-md">
                    Most Popular
                  </span>
                )}
                
                {/* Plan Details */}
                <div className="space-y-4">
                  <h4 className="text-lg font-bold text-white">{p.name}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">{p.description}</p>
                  
                  {/* Price */}
                  <div className="flex items-baseline gap-1 py-2">
                    <span className="text-4xl font-black text-white">{p.price}</span>
                    <span className="text-xs text-slate-500 font-semibold">{p.period}</span>
                  </div>

                  {/* Feature List */}
                  <div className="border-t border-slate-800/40 pt-4 space-y-2.5">
                    {p.features.map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                        <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Call to action */}
                <Link
                  to="/login"
                  className={`w-full py-3 text-center text-xs font-bold rounded-xl transition-all duration-200 block ${
                    p.popular
                      ? 'bg-primary-600 hover:bg-primary-500 text-white shadow-lg shadow-primary-600/10'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800'
                  }`}
                >
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. FAQ SECTION */}
      <section id="faq" className="scroll-mt-20 py-20 px-6 max-w-7xl mx-auto space-y-12">
        {/* Section Header */}
        <div className="text-center space-y-3">
          <span className="text-xs font-bold text-primary-400 uppercase tracking-widest">Knowledge Base</span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white">Frequently Asked Questions</h2>
          <p className="text-slate-400 max-w-xl mx-auto text-sm">
            Answers to common questions regarding onboarding setup, billing tiers, and database security.
          </p>
        </div>

        {/* FAQs Accordion */}
        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, idx) => (
            <div 
              key={idx} 
              className="glass rounded-xl border border-slate-800/60 overflow-hidden transition-all duration-200"
            >
              <button
                onClick={() => toggleFaq(idx)}
                className="w-full px-6 py-4 flex items-center justify-between gap-4 text-left font-bold text-sm text-slate-200 hover:text-white hover:bg-slate-900/20 transition"
              >
                <span className="flex items-center gap-2"><HelpCircle size={15} className="text-primary-500" /> {faq.question}</span>
                <ChevronDown 
                  size={16} 
                  className={`text-slate-500 transition-transform duration-200 flex-shrink-0 ${
                    openFaq === idx ? 'rotate-180 text-primary-400' : ''
                  }`}
                />
              </button>
              
              <div 
                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  openFaq === idx ? 'max-h-[200px] border-t border-slate-800/40' : 'max-h-0'
                }`}
              >
                <p className="px-6 py-4 text-xs text-slate-400 leading-relaxed bg-slate-900/10">
                  {faq.answer}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. CONTACT SECTION */}
      <section id="contact" className="scroll-mt-20 py-20 bg-slate-900/10 border-t border-slate-900 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Info Details */}
          <div className="space-y-6">
            <span className="text-xs font-bold text-primary-400 uppercase tracking-widest">Connect</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white">Let’s Optimize Your Operations Together</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Have unique payroll compliance configurations or department architectures? Contact our operations specialists for customized integrations or a tailored walkthrough demo.
            </p>
            
            <div className="space-y-4 pt-4 text-sm text-slate-300">
              <div className="flex items-center gap-3">
                <Mail size={16} className="text-primary-500" />
                <span>info@pulsehr.com</span>
              </div>
              <div className="flex items-center gap-3">
                <ShieldCheck size={16} className="text-emerald-500" />
                <span>HIPAA & SOC2 Compliant Data Nodes</span>
              </div>
            </div>
          </div>

          {/* Contact Input Form */}
          <div className="glass p-6 md:p-8 rounded-3xl border border-slate-800/60 space-y-4">
            <h4 className="text-base font-bold text-white flex items-center gap-2"><MessageSquare size={16} className="text-primary-500" /> Send a Message</h4>
            <form onSubmit={(e) => { e.preventDefault(); alert('Thank you for contacting us! We will get back to you shortly.'); }} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Your Name</label>
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 rounded-xl py-2.5 px-4 text-slate-200 placeholder-slate-650 text-sm outline-none transition"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="john@company.com"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 rounded-xl py-2.5 px-4 text-slate-200 placeholder-slate-650 text-sm outline-none transition"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Message</label>
                <textarea
                  required
                  rows="4"
                  placeholder="How can we help your team?"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 rounded-xl py-2.5 px-4 text-slate-200 placeholder-slate-650 text-sm outline-none transition resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-primary-600 hover:bg-primary-500 text-white font-semibold text-sm rounded-xl transition duration-150 shadow-md shadow-primary-600/10"
              >
                Send Message
              </button>
            </form>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-slate-950 border-t border-slate-900 text-center text-xs text-slate-500 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Building size={14} className="text-slate-600" />
            <span className="font-semibold text-slate-400">PulseHR Platforms © {new Date().getFullYear()}</span>
          </div>
          <p>Designed for intelligent, modern employee operations.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
