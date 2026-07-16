'use client';

import { useState, InputHTMLAttributes } from 'react';

export function PasswordInput({ name = 'password', required = true, placeholder = '', className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      <input 
        type={show ? "text" : "password"} 
        name={name} 
        required={required} 
        placeholder={placeholder}
        className={`w-full border-2 border-[var(--charcoal-ink)] bg-transparent p-3 pr-12 font-sans focus:outline-none focus:border-[var(--madder-red)] transition-colors ${className}`} 
        {...props}
      />
      <button 
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--charcoal-ink)]/70 hover:text-[var(--charcoal-ink)] transition-colors focus:outline-none"
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
            <line x1="1" y1="1" x2="23" y2="23"></line>
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
        )}
      </button>
    </div>
  );
}
