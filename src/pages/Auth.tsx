import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/i18n/I18nProvider';
import { MediSOSLogo } from '@/components/MediSOSLogo';
import { AlertCircle, Mail, Lock, User, UserX, Phone, ArrowLeft } from 'lucide-react';
import { z } from 'zod';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

const emailSchema = z.string().email('Please enter a valid email');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');
const phoneSchema = z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit phone number');

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { signIn, signUp, continueAsGuest, user, isGuest, loading } = useAuth();
  const { t } = useI18n();
  
  const initialTab = searchParams.get('tab') === 'signup' ? 'signup' : 'login';
  
  const [isLoading, setIsLoading] = useState(false);
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  
  // Email auth states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  
  // Phone auth states
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpTimer, setOtpTimer] = useState(0);
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && (user || isGuest)) {
      navigate('/home');
    }
  }, [user, isGuest, loading, navigate]);

  // OTP timer countdown
  useEffect(() => {
    if (otpTimer > 0) {
      const timer = setTimeout(() => setOtpTimer(otpTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpTimer]);

  const validateLogin = () => {
    const newErrors: Record<string, string> = {};
    
    if (authMethod === 'email') {
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
    } else {
      try {
        phoneSchema.parse(phoneNumber);
      } catch (e) {
        if (e instanceof z.ZodError) {
          newErrors.phone = e.errors[0].message;
        }
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
    
    if (authMethod === 'email') {
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
    } else {
      try {
        phoneSchema.parse(phoneNumber);
      } catch (e) {
        if (e instanceof z.ZodError) {
          newErrors.phone = e.errors[0].message;
        }
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSendOTP = () => {
    if (!validateLogin() && !validateSignup()) return;
    
    // Simulate OTP sending
    setOtpSent(true);
    setOtpTimer(30);
    toast({
      title: 'OTP Sent',
      description: `Verification code sent to +91 ${phoneNumber}`,
    });
  };

  const handleVerifyOTP = () => {
    if (otp.length !== 6) {
      setErrors({ otp: 'Please enter 6-digit OTP' });
      return;
    }
    
    // Simulate OTP verification (demo: any 6-digit code works)
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast({ title: 'Phone verified!', description: 'Welcome to MediSOS' });
      // For demo, continue as guest with phone auth simulation
      continueAsGuest();
      navigate('/home');
    }, 1000);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateLogin()) return;
    
    if (authMethod === 'phone') {
      handleSendOTP();
      return;
    }
    
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
    
    if (authMethod === 'phone') {
      handleSendOTP();
      return;
    }
    
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

  if (loading) {
    return (
      <div className="min-h-dvh bg-ambient flex items-center justify-center">
        <div className="animate-pulse">
          <MediSOSLogo />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-ambient flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        {/* Back button */}
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/')}
          className="mb-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>

        <div className="text-center">
          <MediSOSLogo className="mx-auto mb-4" />
          <h1 className="font-display text-2xl">{t('tagline')}</h1>
          <p className="text-muted-foreground text-sm mt-2">
            Your emergency medical assistant
          </p>
        </div>

        {/* Auth method toggle */}
        <div className="flex justify-center gap-2 p-1 bg-muted rounded-lg">
          <Button 
            variant={authMethod === 'phone' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => { setAuthMethod('phone'); setOtpSent(false); setErrors({}); }}
            className="flex-1"
          >
            <Phone className="h-4 w-4 mr-2" /> Phone
          </Button>
          <Button 
            variant={authMethod === 'email' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => { setAuthMethod('email'); setOtpSent(false); setErrors({}); }}
            className="flex-1"
          >
            <Mail className="h-4 w-4 mr-2" /> Email
          </Button>
        </div>

        <Tabs defaultValue={initialTab} className="w-full">
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
                {otpSent && authMethod === 'phone' ? (
                  <div className="space-y-4">
                    <p className="text-sm text-center text-muted-foreground">
                      Enter the 6-digit code sent to +91 {phoneNumber}
                    </p>
                    <div className="flex justify-center">
                      <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                    {errors.otp && (
                      <p className="text-destructive text-xs text-center flex items-center justify-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {errors.otp}
                      </p>
                    )}
                    <Button 
                      onClick={handleVerifyOTP} 
                      className="w-full" 
                      disabled={isLoading}
                    >
                      {isLoading ? t('loading') : 'Verify OTP'}
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="w-full" 
                      onClick={handleSendOTP}
                      disabled={otpTimer > 0}
                    >
                      {otpTimer > 0 ? `Resend in ${otpTimer}s` : 'Resend OTP'}
                    </Button>
                    <Button 
                      variant="link" 
                      className="w-full" 
                      onClick={() => setOtpSent(false)}
                    >
                      Change phone number
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleLogin} className="space-y-4">
                    {authMethod === 'phone' ? (
                      <div className="space-y-2">
                        <Label htmlFor="login-phone">{t('phone')}</Label>
                        <div className="relative flex gap-2">
                          <div className="flex items-center px-3 bg-muted border rounded-md text-sm">
                            +91
                          </div>
                          <Input
                            id="login-phone"
                            type="tel"
                            placeholder="9876543210"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                            className="flex-1"
                          />
                        </div>
                        {errors.phone && (
                          <p className="text-destructive text-xs flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" /> {errors.phone}
                          </p>
                        )}
                      </div>
                    ) : (
                      <>
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
                      </>
                    )}

                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? t('loading') : authMethod === 'phone' ? 'Send OTP' : t('login')}
                    </Button>
                  </form>
                )}
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
                {otpSent && authMethod === 'phone' ? (
                  <div className="space-y-4">
                    <p className="text-sm text-center text-muted-foreground">
                      Enter the 6-digit code sent to +91 {phoneNumber}
                    </p>
                    <div className="flex justify-center">
                      <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                    {errors.otp && (
                      <p className="text-destructive text-xs text-center flex items-center justify-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {errors.otp}
                      </p>
                    )}
                    <Button 
                      onClick={handleVerifyOTP} 
                      className="w-full" 
                      disabled={isLoading}
                    >
                      {isLoading ? t('loading') : 'Verify & Create Account'}
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="w-full" 
                      onClick={handleSendOTP}
                      disabled={otpTimer > 0}
                    >
                      {otpTimer > 0 ? `Resend in ${otpTimer}s` : 'Resend OTP'}
                    </Button>
                    <Button 
                      variant="link" 
                      className="w-full" 
                      onClick={() => setOtpSent(false)}
                    >
                      Change phone number
                    </Button>
                  </div>
                ) : (
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

                    {authMethod === 'phone' ? (
                      <div className="space-y-2">
                        <Label htmlFor="signup-phone">{t('phone')}</Label>
                        <div className="relative flex gap-2">
                          <div className="flex items-center px-3 bg-muted border rounded-md text-sm">
                            +91
                          </div>
                          <Input
                            id="signup-phone"
                            type="tel"
                            placeholder="9876543210"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                            className="flex-1"
                          />
                        </div>
                        {errors.phone && (
                          <p className="text-destructive text-xs flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" /> {errors.phone}
                          </p>
                        )}
                      </div>
                    ) : (
                      <>
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
                      </>
                    )}

                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? t('loading') : authMethod === 'phone' ? 'Send OTP' : t('createAccount')}
                    </Button>
                  </form>
                )}
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
