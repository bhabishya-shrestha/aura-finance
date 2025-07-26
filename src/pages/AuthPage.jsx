import React, { useState, useEffect } from "react";
import { Sparkles, Shield, TrendingUp } from "lucide-react";
import LoginForm from "../components/auth/LoginForm";
import RegisterForm from "../components/auth/RegisterForm";

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Add a small delay for smooth animation
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const features = [
    {
      icon: Shield,
      title: "Secure & Private",
      description: "Your financial data is encrypted and stored securely",
    },
    {
      icon: TrendingUp,
      title: "Smart Analytics",
      description: "Get insights into your spending patterns and trends",
    },
    {
      icon: Sparkles,
      title: "Beautiful Design",
      description:
        "Modern interface inspired by Apple&apos;s latest design language",
    },
  ];

  return (
    <div className="min-h-screen bg-dark-charcoal flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-apple-blue/20 to-apple-purple/20 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-apple-green/20 to-apple-orange/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
      </div>

      <div
        className={`w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 items-center transition-opacity duration-500 ${isLoaded ? "opacity-100" : "opacity-0"}`}
      >
        {/* Left Side - Features */}
        <div className="hidden lg:block space-y-8">
          {/* Header */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-apple-blue to-apple-purple rounded-apple-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gradient">Aura Finance</h1>
            </div>
            <h2 className="text-4xl font-bold text-soft-white leading-tight">
              Take Control of Your
              <span className="text-gradient block">Financial Future</span>
            </h2>
            <p className="text-lg text-muted-gray leading-relaxed">
              A modern, secure, and beautiful way to manage your personal
              finances. Track expenses, analyze spending patterns, and achieve
              your financial goals.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-6">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="flex items-start gap-4 animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-12 h-12 bg-apple-glass-200/50 rounded-apple-lg flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-6 h-6 text-apple-blue" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-soft-white mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-muted-gray leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gradient">10K+</div>
              <div className="text-sm text-muted-gray">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gradient">$2M+</div>
              <div className="text-sm text-muted-gray">Tracked Assets</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gradient">99.9%</div>
              <div className="text-sm text-muted-gray">Uptime</div>
            </div>
          </div>
        </div>

        {/* Right Side - Auth Forms */}
        <div className="flex items-center justify-center">
          <div className="w-full max-w-md">
            {/* Mobile Header */}
            <div className="lg:hidden text-center mb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-apple-blue to-apple-purple rounded-apple-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-gradient">
                  Aura Finance
                </h1>
              </div>
              <h2 className="text-2xl font-bold text-soft-white mb-2">
                {isLogin ? "Welcome Back" : "Join Us"}
              </h2>
              <p className="text-muted-gray">
                {isLogin
                  ? "Sign in to continue managing your finances"
                  : "Create your account to get started"}
              </p>
            </div>

            {/* Auth Forms */}
            <div className="relative">
              <div
                className={`transition-all duration-500 ease-in-out ${isLogin ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4 absolute inset-0"}`}
              >
                <LoginForm onSwitchToRegister={() => setIsLogin(false)} />
              </div>
              <div
                className={`transition-all duration-500 ease-in-out ${!isLogin ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4 absolute inset-0"}`}
              >
                <RegisterForm onSwitchToLogin={() => setIsLogin(true)} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 text-center">
        <p className="text-xs text-muted-gray">
          © 2024 Aura Finance. Built with modern web technologies.
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
