import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import {
  Home,
  Lock,
  Mail,
  User,
  Shield,
  Stethoscope,
  Package,
  Building2,
  Calculator,
  ShoppingCart 
} from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const { signIn, user } = useAuth();
  const navigate = useNavigate();

  // Redirect after successful login
  useEffect(() => {
    if (user) {
      console.log('User logged in, redirecting based on role:', user.role);
      if (user.role === 'farm_worker') {
        navigate('/worker-dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('يرجى إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('Attempting login with:', { email, password });
      await signIn(email, password);
      console.log('Login successful');
      toast({
        title: 'تم تسجيل الدخول بنجاح',
        description: 'مرحباً بك في نظام إدارة المزرعة',
      });
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message || 'حدث خطأ أثناء تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  const demoAccounts = [
    {
      email: 'admin@farm.com',
      password: 'demo123',
      role: 'مدير المزرعة',
      icon: Shield,
      color: 'text-red-600',
      permissions: 'جميع الصلاحيات'
    },
    {
      email: 'manager@farm.com',
      password: 'demo123',
      role: 'مدير العمليات',
      icon: User,
      color: 'text-blue-600',
      permissions: 'الحيوانات، الحظائر، التغذية، المخزون'
    },
    {
      email: 'vet@farm.com',
      password: 'demo123',
      role: 'الطبيب البيطري',
      icon: Stethoscope,
      color: 'text-green-600',
      permissions: 'الحيوانات، الصحة، التقارير'
    },
    {
      email: 'inventory@farm.com',
      password: 'demo123',
      role: 'مسؤول المخزون',
      icon: Package,
      color: 'text-purple-600',
      permissions: 'المخزون، التغذية، التقارير'
    },
    {
      email: 'worker@farm.com',
      password: 'demo123',
      role: 'عامل المزرعة',
      icon: Home,
      color: 'text-orange-600',
      permissions: 'التغذية، الأدوية، الحيوانات (تسجيل أساسي)'
    }
  ];

  const quickLogin = (demoEmail: string, demoPassword: string) => {
    console.log('Setting demo account data:', { demoEmail, demoPassword });
    setEmail(demoEmail);
    setPassword(demoPassword);
    setSelectedAccount(demoEmail);
    setError(''); // Clear any previous errors
    
    // Show success message that data has been filled
    toast({
      title: 'تم ملء البيانات',
      description: 'اضغط على "تسجيل الدخول" للمتابعة',
      variant: "default"
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-farm-100 to-farm-200 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-6">
        {/* Login Form */}
        <Card className="w-full">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 bg-farm-600 rounded-full flex items-center justify-center">
                <Home className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-farm-800">
              نظام إدارة المزرعة
            </CardTitle>
            <CardDescription>
              نظام شامل لإدارة مزارع الأغنام بتقنيات حديثة
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Alert className="mb-4">
              <AlertDescription>
                <strong>وضع التجريب:</strong> النظام يعمل حالياً بوضع تجريبي مع بيانات وهمية. استخدم أي من الحسابات التجريبية أدناه بكلمة المرور: demo123
              </AlertDescription>
            </Alert>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <div className="relative">
                  <Mail className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setSelectedAccount(''); // Reset selection when typing manually
                    }}
                    placeholder="admin@farm.com"
                    className="pr-10"
                    dir="ltr"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="password">كلمة المرور</Label>
                <div className="relative">
                  <Lock className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setSelectedAccount(''); // Reset selection when typing manually
                    }}
                    placeholder="••••••••"
                    className="pr-10"
                    dir="ltr"
                  />
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button 
                type="submit" 
                className={`w-full ${selectedAccount ? 'bg-farm-600 hover:bg-farm-700 shadow-lg' : ''}`}
                disabled={loading}
              >
                {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
              </Button>
              
              {selectedAccount && (
                <p className="text-sm text-center text-farm-600 font-medium">
                  ✓ تم ملء البيانات - جاهز لتسجيل الدخول
                </p>
              )}
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                نظام إدارة شامل للمزارع مع تتبع دقيق للحيوانات والتغذية والمخزون
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Demo Accounts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">حسابات تجريبية</CardTitle>
            <CardDescription>
              اختر أحد الحسابات لملء البيانات، ثم اضغط "تسجيل الدخول"
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {demoAccounts.map((account, index) => {
              const IconComponent = account.icon;
              return (
                <div
                  key={index}
                  className={`p-4 border rounded-lg hover:bg-accent transition-colors cursor-pointer ${
                    selectedAccount === account.email 
                      ? 'border-farm-600 bg-farm-50 shadow-md' 
                      : 'border-gray-200'
                  }`}
                  onClick={() => quickLogin(account.email, account.password)}
                >
                  <div className="flex items-start space-x-3 space-x-reverse">
                    <div className={`h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center ${account.color}`}>
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{account.role}</h4>
                        <Badge variant="outline" className="text-xs">
                          تجريبي
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {account.email}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        الصلاحيات: {account.permissions}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}

            <Separator className="my-4" />

            <div className="space-y-2">
              <h4 className="font-medium text-sm">مميزات النظام:</h4>
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div className="flex items-center">
                  <Home className="h-3 w-3 ml-1" />
                  إدارة الحيوانات
                </div>
                <div className="flex items-center">
                  <Building2 className="h-3 w-3 ml-1" />
                  إدارة الحظائر
                </div>
                <div className="flex items-center">
                  <Package className="h-3 w-3 ml-1" />
                  إدارة المخزون
                </div>
                <div className="flex items-center">
                  <Calculator className="h-3 w-3 ml-1" />
                  حسابات الكفاءة
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
