"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, ShieldCheck } from 'lucide-react';
import api from '@/utils/api';

const ForgotPin = () => {
  const router = useRouter();
  const [shopCode, setShopCode] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!shopCode.trim()) {
      setError('Please enter your Business ID.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await api.post('shops/reset-pin', {
        shop_code: shopCode.trim(),
      });

      if (response.data?.pin) {
        setResult({
          shopCode: response.data.shop_code,
          pin: response.data.pin,
        });
      } else {
        setError('Unable to reset PIN. Please try again.');
      }
    } catch (err) {
      console.error('Reset PIN error:', err);
      setError(err.response?.data?.message || 'Failed to reset PIN. Please check your Business ID.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyPin = async () => {
    if (!result?.pin) return;
    try {
      await navigator.clipboard.writeText(result.pin);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = result.pin;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const goToLoginWithPin = () => {
    if (typeof window !== 'undefined' && result) {
      sessionStorage.setItem(
        'post_register_login_prefill',
        JSON.stringify({ shopCode: result.shopCode, pin: result.pin })
      );
    }
    router.push('/login');
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-brand-dark max-w-[480px] mx-auto overflow-x-hidden shadow-2xl px-8 pt-20 pb-10 font-display">
      <div className="flex flex-col items-center mb-8">
        <div className="size-20 bg-primary/10 rounded-3xl flex items-center justify-center mb-4 border border-primary/20">
          <ShieldCheck size={38} className="text-primary" />
        </div>
        <div className="text-[11px] uppercase tracking-[0.25em] text-muted-text font-bold">Rezzy</div>
        <div className="text-[9px] text-muted-text/60 tracking-wider mt-1">powered by Eloquent</div>
      </div>

      {!result ? (
        <>
          <div className="mb-10 text-center">
            <h1 className="text-3xl font-extrabold text-white mb-3">Forgot PIN?</h1>
            <p className="text-muted-text text-sm leading-relaxed px-4">
              Enter your Business ID and we'll generate a new PIN for your shop.
            </p>
          </div>

          <form onSubmit={handleReset} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs py-3 px-4 rounded-xl text-center">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-muted-text font-bold ml-1">
                Business ID
              </label>
              <input
                value={shopCode}
                onChange={(e) => {
                  setShopCode(e.target.value);
                  setError('');
                }}
                className="w-full bg-[#151921] border border-white/10 rounded-xl px-5 py-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                placeholder="Enter business code"
                type="text"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-14 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/25 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{isSubmitting ? 'Resetting PIN...' : 'Reset PIN'}</span>
              {!isSubmitting && <span className="material-symbols-outlined text-xl">arrow_forward</span>}
            </button>
          </form>
        </>
      ) : (
        <>
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-extrabold text-white mb-3">New PIN Generated</h1>
            <p className="text-muted-text text-sm leading-relaxed px-4">
              Save this PIN somewhere safe. You'll need it to log in.
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-card-dark border border-white/10 rounded-2xl px-4 py-4 text-sm">
              <div className="text-muted-text text-[10px] uppercase tracking-widest mb-1">Business ID</div>
              <div className="font-bold text-white text-lg">{result.shopCode}</div>
            </div>

            <div className="bg-card-dark border border-primary/30 rounded-2xl px-4 py-4 text-sm">
              <div className="flex items-center justify-between mb-1">
                <div className="text-muted-text text-[10px] uppercase tracking-widest">New PIN</div>
                <button
                  type="button"
                  onClick={copyPin}
                  className="text-[10px] uppercase tracking-widest text-primary font-bold hover:text-white transition-colors"
                >
                  {copied ? 'Copied ✓' : 'Copy'}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <Lock size={18} className="text-primary" />
                <div className="font-bold text-white text-2xl tracking-[0.3em]">{result.pin}</div>
              </div>
            </div>

            <button
              type="button"
              onClick={goToLoginWithPin}
              className="w-full h-14 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Continue to Login</span>
              <span className="material-symbols-outlined text-xl">arrow_forward</span>
            </button>
          </div>
        </>
      )}

      <div className="mt-auto pt-10 text-center">
        <button
          onClick={() => router.push('/login')}
          className="inline-flex items-center gap-2 text-muted-text hover:text-white transition-colors group cursor-pointer"
        >
          <span className="text-sm font-semibold tracking-wide">Back to Login</span>
        </button>
      </div>

      <div className="absolute -top-24 -left-24 size-64 bg-primary/5 rounded-full blur-[80px] pointer-events-none"></div>
      <div className="absolute top-1/2 -right-32 size-80 bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>
    </div>
  );
};

export default ForgotPin;
