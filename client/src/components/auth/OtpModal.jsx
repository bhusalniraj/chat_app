import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, ArrowLeft, RefreshCw, KeyRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

export const OtpModal = ({ email, devOtp, onBack, onSuccess, onError }) => {
  const { verifyOtp, resendOtp } = useAuth();
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [currentDevOtp, setCurrentDevOtp] = useState(devOtp);
  const inputRefs = useRef([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);

    // Auto-advance to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit if all 6 filled
    if (newDigits.every((d) => d !== '') && index === 5) {
      handleVerify(newDigits.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pasteData)) {
      const digits = pasteData.split('');
      setOtpDigits(digits);
      inputRefs.current[5]?.focus();
      handleVerify(pasteData);
    }
  };

  const handleVerify = async (codeToVerify) => {
    const code = codeToVerify || otpDigits.join('');
    if (code.length !== 6) {
      onError('Please enter a valid 6-digit code');
      return;
    }

    setSubmitting(true);
    const res = await verifyOtp(email, code);
    setSubmitting(false);

    if (res.success) {
      onSuccess();
    } else {
      onError(res.message);
    }
  };

  const handleResend = async () => {
    setResending(true);
    const res = await resendOtp(email);
    setResending(false);

    if (res.success) {
      setTimeLeft(300); // 5 minutes on resend
      if (res.otp) setCurrentDevOtp(res.otp);
    } else {
      onError(res.message);
    }
  };

  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const fillDevOtp = () => {
    if (currentDevOtp && currentDevOtp.length === 6) {
      const digits = currentDevOtp.split('');
      setOtpDigits(digits);
      handleVerify(currentDevOtp);
    }
  };

  return (
    <div className="w-full">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to registration
      </button>

      <div className="text-center mb-6">
        <div className="w-14 h-14 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-emerald-500/20">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Verify Your Email</h2>
        <p className="text-sm text-slate-400 mt-1">
          We sent a 6-digit verification code to <span className="text-emerald-400 font-medium">{email}</span>
        </p>
      </div>

      {currentDevOtp && (
        <div className="mb-6 p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-emerald-300">
            <KeyRound className="w-4 h-4" />
            <span>Dev Test OTP: <strong className="text-emerald-200 tracking-wider font-mono text-sm">{currentDevOtp}</strong></span>
          </div>
          <button
            type="button"
            onClick={fillDevOtp}
            className="text-xs bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold px-2.5 py-1 rounded-lg transition-colors"
          >
            Auto Fill
          </button>
        </div>
      )}

      {/* 6 Digit Inputs */}
      <div className="flex justify-center gap-2 sm:gap-3 mb-6" onPaste={handlePaste}>
        {otpDigits.map((digit, idx) => (
          <input
            key={idx}
            ref={(el) => (inputRefs.current[idx] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(idx, e.target.value)}
            onKeyDown={(e) => handleKeyDown(idx, e)}
            className="w-12 h-14 text-center text-2xl font-bold rounded-xl bg-slate-800/80 border border-slate-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 text-white outline-none transition-all shadow-inner"
          />
        ))}
      </div>

      {/* Expiry Timer & Resend */}
      <div className="flex items-center justify-between text-xs text-slate-400 mb-6 px-1">
        <span>Expires in: <strong className="text-slate-200 font-mono">{formatTimer(timeLeft)}</strong></span>
        <button
          type="button"
          onClick={handleResend}
          disabled={resending || timeLeft > 540}
          className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
          Resend code
        </button>
      </div>

      <button
        onClick={() => handleVerify()}
        disabled={submitting || otpDigits.some((d) => d === '')}
        className="w-full bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
      >
        {submitting ? (
          <>
            <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            <span>Verifying...</span>
          </>
        ) : (
          'Verify & Activate Account'
        )}
      </button>
    </div>
  );
};
