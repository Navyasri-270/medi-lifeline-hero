import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/i18n/I18nProvider';
import { MediSOSLogo } from '@/components/MediSOSLogo';
import { AlertCircle, Mail, Lock, User, UserX } from 'lucide-react';
import { z } from 'zod';

const emailSchema = z.string().email('Please enter a valid email');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

export default function Auth() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn, signUp, continueAsGuest } = useAuth();
  const { t } = useI18n();
  
  const [isLoading, setIsLoading] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateLogin = () => {
    const newErrors: Record<string, string> = {};
    
    try {
      emailSchema.parse(loginEmail);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.loginEmail = e.errors[0].message;
      }
    }
    
    try {
      passwordSchema.parse(loginPassword);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.loginPassword = e.errors[0].message;
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateSignup = () => {
    const newErrors: Record<string, string> = {};
    
    if (!signupName.trim()) {
      newErrors.signupName = 'Name is required';
    }
    
    try {
      emailSchema.parse(signupEmail);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.signupEmail = e.errors[0].message;
      }
    }
    
    try {
      passwordSchema.parse(signupPassword);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.signupPassword = e.errors[0].message;
      }
    }
    
    if (signupPassword !== signupConfirmPassword) {
      newErrors.signupConfirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateLogin()) return;
    
    setIsLoading(true);
    const { error } = await signIn(loginEmail, loginPassword);
    setIsLoading(false);
    
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Login failed',
        description: error.message,
      });
    } else {
      toast({ title: 'Welcome back!' });
      navigate('/home');
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateSignup()) return;
    
    setIsLoading(true);
    const { error } = await signUp(signupEmail, signupPassword, signupName);
    setIsLoading(false);
    
    if (error) {
      let message = error.message;
      if (error.message.includes('already registered')) {
        message = 'This email is already registered. Please log in instead.';
      }
      toast({
        variant: 'destructive',
        title: 'Sign up failed',
        description: message,
      });
    } else {
      toast({ 
        title: 'Account created!',
        description: 'You are now logged in.'
      });
      navigate('/home');
    }
  };

  const handleGuestMode = () => {
    continueAsGuest();
    toast({
      title: 'Guest Mode',
      description: 'You can use SOS features but cannot upload reports.',
    });
    navigate('/home');
  };

  return (
    <div className="min-h-dvh bg-ambient flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <MediSOSLogo className="mx-auto mb-4" />
          <h1 className="font-display text-2xl">{t('tagline')}</h1>
          <p className="text-muted-foreground text-sm mt-2">
            Your emergency medical assistant
          </p>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">{t('login')}</TabsTrigger>
            <TabsTrigger value="signup">{t('signup')}</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>{t('login')}</CardTitle>
                <CardDescription>
                  Access your medical profile and emergency contacts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">{t('email')}</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="you@example.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    {errors.loginEmail && (
                      <p className="text-destructive text-xs flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {errors.loginEmail}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password">{t('password')}</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-password"
                        type="password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    {errors.loginPassword && (
                      <p className="text-destructive text-xs flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {errors.loginPassword}
                      </p>
                    )}
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? t('loading') : t('login')}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="signup">
            <Card>
              <CardHeader>
                <CardTitle>{t('createAccount')}</CardTitle>
                <CardDescription>
                  Create your medical profile for emergency situations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">{t('name')}</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-name"
                        placeholder="Your name"
                        value={signupName}
                        onChange={(e) => setSignupName(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    {errors.signupName && (
                      <p className="text-destructive text-xs flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {errors.signupName}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">{t('email')}</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="you@example.com"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    {errors.signupEmail && (
                      <p className="text-destructive text-xs flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {errors.signupEmail}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">{t('password')}</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        type="password"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    {errors.signupPassword && (
                      <p className="text-destructive text-xs flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {errors.signupPassword}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm">{t('confirmPassword')}</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-confirm"
                        type="password"
                        value={signupConfirmPassword}
                        onChange={(e) => setSignupConfirmPassword(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    {errors.signupConfirmPassword && (
                      <p className="text-destructive text-xs flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {errors.signupConfirmPassword}
                      </p>
                    )}
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? t('loading') : t('createAccount')}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or</span>
          </div>
        </div>

        <Button
          variant="outline"
          className="w-full"
          onClick={handleGuestMode}
        >
          <UserX className="h-4 w-4 mr-2" />
          {t('guestMode')}
        </Button>
        <p className="text-xs text-center text-muted-foreground">
          {t('guestModeDesc')}
        </p>
      </div>
    </div>
  );
}
