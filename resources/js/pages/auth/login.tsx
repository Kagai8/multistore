import AuthenticatedSessionController from '@/actions/App/Http/Controllers/Auth/AuthenticatedSessionController';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, Head } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { LoaderCircle, Eye, EyeOff, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
}

export default function Login({ status, canResetPassword }: LoginProps) {
    const [showPassword, setShowPassword] = useState(false);
    const emailRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);

    // Force input styling after mount to prevent browser autofill override
    useEffect(() => {
        const styleInputs = () => {
            const inputs = [emailRef.current, passwordRef.current];
            inputs.forEach(input => {
                if (input) {
                    input.style.backgroundColor = '#ffffff';
                    input.style.color = '#111827';
                }
            });
        };

        // Run immediately and after a short delay (for autofill)
        styleInputs();
        const timer = setTimeout(styleInputs, 100);
        return () => clearTimeout(timer);
    }, []);

    return (
        <>
            <Head title="Log in" />

            <div className="min-h-screen bg-white flex items-center justify-center p-4 sm:p-6 lg:p-8">
                <div className="w-full max-w-5xl flex flex-col lg:flex-row gap-8">
                    {/* Left: Login Form */}
                    <motion.div
                        initial={{ opacity: 0, x: -100 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                        className="lg:w-1/2"
                    >
                        <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 border border-gray-100">
                            <div className="text-center mb-8">
                                <h1 className="text-3xl font-bold text-gray-900">Welcome back</h1>
                                <p className="text-gray-600 mt-2">Sign in to manage your multi-store inventory</p>
                            </div>

                            <Form
                                {...AuthenticatedSessionController.store.form()}
                                resetOnSuccess={['password']}
                                className="space-y-6"
                            >
                                {({ processing, errors }) => (
                                    <>
                                        <div className="space-y-4">
                                            {/* Email */}
                                            <div className="space-y-2">
                                                <Label htmlFor="email" className="text-gray-800">Email</Label>
                                                <div className="relative">
                                                    <Input
                                                        ref={emailRef}
                                                        id="email"
                                                        type="email"
                                                        name="email"
                                                        required
                                                        autoFocus
                                                        tabIndex={1}
                                                        autoComplete="email"
                                                        placeholder="you@company.com"
                                                        className="h-12 pr-4 bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                                    />
                                                </div>
                                                <InputError message={errors.email} />
                                            </div>

                                            {/* Password */}
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <Label htmlFor="password" className="text-gray-800">Password</Label>
                                                    {canResetPassword && (
                                                        <TextLink
                                                            href={route('password.request')}
                                                            className="text-sm font-medium text-orange-600 hover:text-orange-700"
                                                            tabIndex={5}
                                                        >
                                                            Forgot password?
                                                        </TextLink>
                                                    )}
                                                </div>
                                                <div className="relative">
                                                    <Input
                                                        ref={passwordRef}
                                                        id="password"
                                                        type={showPassword ? "text" : "password"}
                                                        name="password"
                                                        required
                                                        tabIndex={2}
                                                        autoComplete="current-password"
                                                        placeholder="••••••••"
                                                        className="h-12 pr-10 bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none"
                                                        tabIndex={3}
                                                    >
                                                        {showPassword ? (
                                                            <EyeOff className="h-5 w-5" />
                                                        ) : (
                                                            <Eye className="h-5 w-5" />
                                                        )}
                                                    </button>
                                                </div>
                                                <InputError message={errors.password} />
                                            </div>

                                            {/* Remember Me */}
                                            <div className="flex items-center space-x-2">
                                                <Checkbox id="remember" name="remember" tabIndex={4} />
                                                <Label htmlFor="remember" className="text-sm text-gray-700">
                                                    Remember me
                                                </Label>
                                            </div>

                                            {/* Submit Button */}
                                            <Button
                                                type="submit"
                                                className="w-full h-12 text-base bg-orange-600 hover:bg-orange-700 text-white"
                                                disabled={processing}
                                            >
                                                {processing ? (
                                                    <>
                                                        <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                                        Signing in...
                                                    </>
                                                ) : (
                                                    'Sign in'
                                                )}
                                            </Button>
                                        </div>

                                        <div className="text-center text-sm text-gray-600">
                                            Don't have an account?{' '}
                                            <TextLink
                                                href={route('register')}
                                                className="font-medium text-orange-600 hover:text-orange-700"
                                            >
                                                Sign up
                                            </TextLink>
                                        </div>
                                    </>
                                )}
                            </Form>

                            <AnimatePresence>
                                {status && (
                                    <div className="mt-4 text-center text-sm font-medium text-green-600">
                                        {status}
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>

                    {/* Right: Branding Panel */}
                    <motion.div
                        initial={{ opacity: 0, x: 100 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="hidden lg:block lg:w-1/2"
                    >
                        <div className="bg-orange-50 rounded-xl p-8 h-full flex flex-col justify-center items-center text-center border border-orange-100">
                            <div className="bg-orange-600 p-4 rounded-full text-white mb-6">
                                <Package className="h-10 w-10" />
                            </div>

                            <h2 className="text-2xl font-bold text-gray-900 mb-4">Unified Inventory Control</h2>
                            <p className="text-gray-700 mb-6">
                                Manage stock across all your stores, track transfers, and oversee operations from one dashboard.
                            </p>

                            <div className="grid grid-cols-3 gap-4 mt-8">
                                <div className="flex flex-col items-center">
                                    <span className="text-2xl text-orange-600">🛒</span>
                                    <span className="text-xs text-gray-700">Multi-Store</span>
                                </div>
                                <div className="flex flex-col items-center">
                                    <span className="text-2xl text-orange-600">👥</span>
                                    <span className="text-xs text-gray-700">Team Access</span>
                                </div>
                                <div className="flex flex-col items-center">
                                    <span className="text-2xl text-orange-600">⏱️</span>
                                    <span className="text-xs text-gray-700">Real-Time</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </>
    );
}
