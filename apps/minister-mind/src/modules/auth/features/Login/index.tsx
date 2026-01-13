import React, { useState } from 'react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle login logic here
  };

  return (
    <div className="w-full h-full flex items-center justify-center">
      <form 
        onSubmit={handleSubmit}
        className="flex flex-col gap-6 w-full max-w-md"
        dir="rtl"
      >
        {/* Email Input */}
        <div className="flex flex-col gap-2">
          <label 
            htmlFor="email"
            className="text-right text-sm font-medium text-gray-900"
          >
            البريد الإلكتروني
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="أدخل بريدك الإلكتروني"
            className="w-full h-12 px-4 rounded-lg border border-gray-200 bg-white text-right text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#048F86] focus:border-transparent"
            dir="rtl"
          />
        </div>

        {/* Password Input */}
        <div className="flex flex-col gap-2">
          <label 
            htmlFor="password"
            className="text-right text-sm font-medium text-gray-900"
          >
            كلمة المرور
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="أدخل كلمة المرور"
            className="w-full h-12 px-4 rounded-lg border border-gray-200 bg-white text-right text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#048F86] focus:border-transparent"
            dir="rtl"
          />
        </div>

        {/* Login Button */}
        <button
          type="submit"
          className="w-full h-12 rounded-lg text-white font-medium text-sm shadow-sm transition-all duration-300 hover:brightness-110 active:scale-[0.98]"
          style={{
            background: 'linear-gradient(90deg, #048F86 -7%, #6DCDCD 100%)',
          }}
        >
          تسجيل الدخول
        </button>
      </form>
    </div>
  );
};

export default Login;