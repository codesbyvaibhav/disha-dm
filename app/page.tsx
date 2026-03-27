'use client';

import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { motion } from 'motion/react';
import { MessageSquare, Zap, Target, Users, ArrowRight, Instagram } from 'lucide-react';

export default function LandingPage() {
  const { user, signIn } = useAuth();

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <MessageSquare className="text-white w-6 h-6" />
          </div>
          <span className="text-xl font-bold tracking-tight">DishaDM</span>
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <Link 
              href="/dashboard" 
              className="px-4 py-2 bg-indigo-600 text-white rounded-full font-medium hover:bg-indigo-700 transition-colors"
            >
              Go to Dashboard
            </Link>
          ) : (
            <button 
              onClick={signIn}
              className="px-4 py-2 bg-indigo-600 text-white rounded-full font-medium hover:bg-indigo-700 transition-colors"
            >
              Sign In
            </button>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-6 pt-20 pb-32 max-w-7xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter mb-6 leading-tight">
            Turn Instagram Comments <br />
            <span className="text-indigo-600">Into Automated Leads</span>
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-10">
            Automatically reply to comments and send DMs based on keywords. 
            Capture leads, deliver links, and grow your business while you sleep.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={signIn}
              className="w-full sm:w-auto px-8 py-4 bg-indigo-600 text-white rounded-full text-lg font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
            >
              Get Started for Free <ArrowRight className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-slate-500 font-medium">
              <Instagram className="w-5 h-5" />
              For Instagram Professional Accounts
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="bg-slate-50 py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-12">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
              <div className="bg-indigo-100 p-3 rounded-2xl w-fit mb-6">
                <Zap className="text-indigo-600 w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Instant Automation</h3>
              <p className="text-slate-600">
                Reply to comments within seconds. Never miss a lead or a customer question again.
              </p>
            </div>
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
              <div className="bg-indigo-100 p-3 rounded-2xl w-fit mb-6">
                <Target className="text-indigo-600 w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Keyword Targeting</h3>
              <p className="text-slate-600">
                Trigger specific replies based on keywords like &quot;price&quot;, &quot;link&quot;, or &quot;demo&quot;.
              </p>
            </div>
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
              <div className="bg-indigo-100 p-3 rounded-2xl w-fit mb-6">
                <Users className="text-indigo-600 w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Lead Management</h3>
              <p className="text-slate-600">
                Capture commenter data and export them as leads for your sales funnel.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-slate-100">
        <div className="max-w-7xl mx-auto flex flex-col md:row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <MessageSquare className="text-indigo-600 w-5 h-5" />
            <span className="font-bold">DishaDM</span>
          </div>
          <p className="text-slate-500 text-sm">
            © 2026 DishaDM. All rights reserved. Built for Meta Platform.
          </p>
        </div>
      </footer>
    </div>
  );
}
