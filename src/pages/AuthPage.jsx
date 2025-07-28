
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
      description: "Modern interface with clean, responsive design",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-green-500/10 to-orange-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
      </div>

      <div
        className={`w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 items-center transition-opacity duration-500 ${isLoaded ? "opacity-100" : "opacity-0"}`}
      >
        {/* Left Side - Features */}
        <div className="hidden lg:block space-y-8">
          {/* Header */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Aura Finance
              </h1>
            </div>
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white leading-tight">
              Take Control of Your
              <span className="text-blue-600 dark:text-blue-400 block">
                Financial Future
              </span>
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
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
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Features Highlight */}
          <div className="grid grid-cols-3 gap-4 pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gradient">Secure</div>
              <div className="text-sm text-muted-gray">Data Protection</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gradient">Fast</div>
              <div className="text-sm text-muted-gray">Real-time Sync</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gradient">Free</div>
              <div className="text-sm text-muted-gray">No Hidden Costs</div>
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
              {isLogin ? (
                <div className="transition-all duration-500 ease-in-out">
                  <LoginForm onSwitchToRegister={() => setIsLogin(false)} />
                </div>
              ) : (
                <div className="transition-all duration-500 ease-in-out">
                  <RegisterForm onSwitchToLogin={() => setIsLogin(true)} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 text-center">
        <p className="text-xs text-muted-gray">© 2024 Aura Finance</p>
      </div>
    </div>
  );
};

export default AuthPage;
