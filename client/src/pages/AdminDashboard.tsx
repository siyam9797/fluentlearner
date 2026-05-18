import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import { FormEvent, useState } from "react";
import {
  BookOpen,
  Trophy,
  ArrowRight,
  Home,
  LogOut,
  CreditCard,
  Layers,
  ClipboardList,
  AlertCircle,
  HelpCircle,
  BarChart3,
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  Shield,
  Settings,
} from "lucide-react";

export default function AdminDashboard() {
  const { user, loading, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const utils = trpc.useUtils();
  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: async (loggedInUser) => {
      utils.auth.me.setData(undefined, loggedInUser);
      await utils.auth.me.invalidate();
    },
  });

  // Fetch enrollment stats for the dashboard
  const { data: enrollmentStats } = trpc.enrollments.stats.useQuery(undefined, {
    enabled: !!user && user.role === "admin",
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-4 border-brand-red border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500 text-sm">লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      await loginMutation.mutateAsync({
        email,
        password,
      });
    };

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardContent className="p-8">
            <div className="w-16 h-16 bg-brand-red/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-brand-red" />
            </div>
            <h1 className="text-2xl font-bold mb-2 text-gray-900 text-center">অ্যাডমিন প্যানেল</h1>
            <p className="text-gray-500 mb-6 text-center">
              FluentLearner অ্যাডমিন প্যানেলে প্রবেশ করতে ইমেইল ও পাসওয়ার্ড দিন।
            </p>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="admin-email">ইমেইল</Label>
                <Input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  required
                  placeholder="admin@example.com"
                />
              </div>
              <div>
                <Label htmlFor="admin-password">পাসওয়ার্ড</Label>
                <Input
                  id="admin-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  required
                  placeholder="আপনার পাসওয়ার্ড"
                />
              </div>
              {loginMutation.error && (
                <p className="text-sm text-red-600">{loginMutation.error.message}</p>
              )}
              <Button
                type="submit"
                disabled={loginMutation.isPending}
                className="bg-brand-red hover:bg-brand-red-dark text-white w-full text-base py-3"
              >
                {loginMutation.isPending ? "লগইন হচ্ছে..." : "লগইন করুন"}
              </Button>
            </form>
            <p className="text-xs text-gray-400 mt-4 text-center">
              শুধুমাত্র অনুমোদিত অ্যাডমিনরা প্রবেশ করতে পারবেন
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold mb-2 text-red-600">অ্যাক্সেস নেই</h1>
            <p className="text-gray-500 mb-2">
              আপনার অ্যাকাউন্টে অ্যাডমিন অনুমতি নেই।
            </p>
            <p className="text-sm text-gray-400 mb-6">
              লগইন করা ইমেইল: <span className="font-medium text-gray-600">{user.email}</span>
            </p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setLocation("/")}>
                <Home className="h-4 w-4 mr-2" /> হোম পেজ
              </Button>
              <Button variant="outline" className="flex-1" onClick={logout}>
                <LogOut className="h-4 w-4 mr-2" /> অন্য অ্যাকাউন্ট
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalEnrollments = enrollmentStats
    ? (enrollmentStats.pending || 0) + (enrollmentStats.verified || 0) + (enrollmentStats.rejected || 0)
    : 0;

  const menuCards = [
    {
      title: "ভর্তি ম্যানেজমেন্ট",
      description: "নতুন আবেদন দেখুন ও যাচাই করুন",
      helpText: "শিক্ষার্থীরা ভর্তি ফর্ম পূরণ করলে এখানে দেখা যাবে। আপনি Approve বা Reject করতে পারবেন।",
      icon: ClipboardList,
      path: "/admin/enrollments",
      color: "bg-amber-500",
      badge: enrollmentStats?.pending ? `${enrollmentStats.pending} নতুন` : undefined,
    },
    {
      title: "কোর্স ম্যানেজমেন্ট",
      description: "কোর্স তৈরি ও সম্পাদনা করুন",
      helpText: "নতুন কোর্স যোগ করুন, দাম পরিবর্তন করুন, কোর্স Active/Inactive করুন।",
      icon: BookOpen,
      path: "/admin/courses",
      color: "bg-blue-500",
    },
    {
      title: "পেমেন্ট সেটিংস",
      description: "bKash, Nagad নম্বর ও নির্দেশনা",
      helpText: "শিক্ষার্থীরা কোন নম্বরে টাকা পাঠাবে সেটি এখান থেকে সেট করুন।",
      icon: CreditCard,
      path: "/admin/payment-settings",
      color: "bg-purple-500",
    },
    {
      title: "ব্যাচ ম্যানেজমেন্ট",
      description: "ব্যাচ তৈরি ও সময়সূচি",
      helpText: "নতুন ব্যাচ তৈরি করুন, শুরু ও শেষ তারিখ সেট করুন, ভর্তি সংখ্যা নির্ধারণ করুন।",
      icon: Layers,
      path: "/admin/batches",
      color: "bg-teal-500",
    },
    {
      title: "সাফল্যের গল্প",
      description: "ছবি ও গল্প আপলোড করুন",
      helpText: "শিক্ষার্থীদের IELTS স্কোর, ভিসা সাফল্য ইত্যাদির ছবি ও গল্প যোগ করুন।",
      icon: Trophy,
      path: "/admin/success-stories",
      color: "bg-green-500",
    },
    {
      title: "সাইট সেটিংস",
      description: "ওয়েবসাইটের কন্টেন্ট পরিবর্তন করুন",
      helpText: "হিরো, About, যোগাযোগ, ফুটার — সব কন্টেন্ট এখান থেকে পরিবর্তন করুন।",
      icon: Settings,
      path: "/admin/site-settings",
      color: "bg-indigo-500",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-red rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">অ্যাডমিন ড্যাশবোর্ড</h1>
              <p className="text-xs text-gray-500">
                স্বাগতম, <span className="font-medium">{user.name || "Admin"}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setLocation("/")}>
              <Home className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">সাইট দেখুন</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={logout} className="text-gray-500">
              <LogOut className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">লগআউট</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Pending Enrollment Alert */}
        {enrollmentStats && enrollmentStats.pending > 0 && (
          <div
            className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 flex items-center justify-between cursor-pointer hover:bg-amber-100 transition-colors"
            onClick={() => setLocation("/admin/enrollments")}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center animate-pulse">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-bold text-amber-800 text-lg">
                  {enrollmentStats.pending}টি নতুন ভর্তি আবেদন অপেক্ষমাণ!
                </p>
                <p className="text-sm text-amber-600">এখানে ক্লিক করে দেখুন এবং যাচাই করুন →</p>
              </div>
            </div>
            <ArrowRight className="w-6 h-6 text-amber-600 hidden sm:block" />
          </div>
        )}

        {/* Quick Stats Row */}
        {enrollmentStats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white rounded-xl p-4 border">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-blue-500" />
                <span className="text-xs text-gray-500">মোট আবেদন</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{totalEnrollments}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-amber-500" />
                <span className="text-xs text-gray-500">অপেক্ষমাণ</span>
              </div>
              <p className="text-2xl font-bold text-amber-600">{enrollmentStats.pending || 0}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span className="text-xs text-gray-500">অনুমোদিত</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{enrollmentStats.verified || 0}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border">
              <div className="flex items-center gap-2 mb-1">
                <XCircle className="w-4 h-4 text-red-500" />
                <span className="text-xs text-gray-500">বাতিল</span>
              </div>
              <p className="text-2xl font-bold text-red-600">{enrollmentStats.rejected || 0}</p>
            </div>
          </div>
        )}

        {/* Section Title */}
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-gray-800">ম্যানেজমেন্ট মেনু</h2>
          <div className="group relative">
            <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
            <div className="absolute left-0 top-6 bg-gray-900 text-white text-xs rounded-lg p-3 w-64 hidden group-hover:block z-50 shadow-xl">
              প্রতিটি কার্ডে ক্লিক করে সেই বিভাগে যান। কার্ডের নিচে ছোট বর্ণনা দেওয়া আছে কী করা যাবে।
            </div>
          </div>
        </div>

        {/* Menu Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {menuCards.map((card) => (
            <Card
              key={card.path}
              className="cursor-pointer hover:shadow-xl transition-all hover:-translate-y-0.5 group relative border-2 border-transparent hover:border-brand-red/20"
              onClick={() => setLocation(card.path)}
            >
              {card.badge && (
                <span className="absolute -top-2.5 -right-2.5 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full z-10 shadow-lg animate-pulse">
                  {card.badge}
                </span>
              )}
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${card.color} text-white flex-shrink-0 shadow-md`}>
                    <card.icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-gray-900 group-hover:text-brand-red transition-colors">
                      {card.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-0.5">{card.description}</p>
                    {card.helpText && (
                      <p className="text-xs text-gray-400 mt-2 leading-relaxed border-t pt-2">
                        💡 {card.helpText}
                      </p>
                    )}
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-300 group-hover:text-brand-red transition-colors mt-1 flex-shrink-0" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Help Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mt-6">
          <h3 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
            <HelpCircle className="w-5 h-5" />
            দ্রুত সাহায্য
          </h3>
          <div className="grid sm:grid-cols-2 gap-3 text-sm text-blue-700">
            <div className="flex items-start gap-2">
              <span className="font-bold text-blue-500 mt-0.5">১.</span>
              <p>প্রথমে <strong>পেমেন্ট সেটিংস</strong>-এ গিয়ে bKash/Nagad নম্বর যোগ করুন</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold text-blue-500 mt-0.5">২.</span>
              <p><strong>কোর্স ম্যানেজমেন্ট</strong>-এ কোর্সের দাম ও বিবরণ আপডেট করুন</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold text-blue-500 mt-0.5">৩.</span>
              <p><strong>ব্যাচ ম্যানেজমেন্ট</strong>-এ নতুন ব্যাচ তৈরি করুন</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold text-blue-500 mt-0.5">৪.</span>
              <p>শিক্ষার্থী ভর্তি হলে <strong>ভর্তি ম্যানেজমেন্ট</strong>-এ যাচাই করুন</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
