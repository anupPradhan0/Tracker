import { Link, Navigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AuthLayout } from "@/layouts/AuthLayout";
import { AuthCard } from "@/components/auth/AuthCard";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageLoader } from "@/components/ui/spinner";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ROUTES } from "@/constants/auth";
import { useAuth } from "@/providers/AuthProvider";
import { loginSchema, type LoginFormValues } from "@/lib/validations/auth";

export function LoginPage() {
  const { user, isLoading, login } = useAuth();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  if (isLoading) {
    return <PageLoader />;
  }

  if (user) {
    return <Navigate to={ROUTES.dashboard} replace />;
  }

  const onSubmit = (values: LoginFormValues) => {
    login.mutate(values);
  };

  return (
    <AuthLayout>
      <div className="flex min-h-screen items-start justify-center p-3 pt-8 sm:items-center sm:p-4 sm:pt-4">
        <AuthCard
          title="Welcome back"
          description="Sign in to your finance workspace"
          footer={
            <span className="text-slate-600">
              Don&apos;t have an account?{" "}
              <Link to={ROUTES.register} className="font-medium text-indigo-600 hover:underline">
                Create one
              </Link>
            </span>
          }
        >
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        autoComplete="email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <PasswordInput
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        disabled={login.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={!form.formState.isValid || login.isPending}
              >
                {login.isPending ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          </Form>
        </AuthCard>
      </div>
    </AuthLayout>
  );
}
