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
import { registerSchema, type RegisterFormValues } from "@/lib/validations/auth";

export function RegisterPage() {
  const { user, isLoading, register: registerMutation } = useAuth();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
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

  const onSubmit = (values: RegisterFormValues) => {
    registerMutation.mutate(values);
  };

  return (
    <AuthLayout>
      <div className="flex min-h-screen items-start justify-center p-3 pt-8 sm:items-center sm:p-4 sm:pt-4">
        <AuthCard
          title="Create your account"
          description="Start managing your finances with confidence"
          footer={
            <span className="text-slate-600">
              Already have an account?{" "}
              <Link to={ROUTES.login} className="font-medium text-indigo-600 hover:underline">
                Sign in
              </Link>
            </span>
          }
        >
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your name" autoComplete="name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                        disabled={registerMutation.isPending}
                        showCounter
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
                disabled={!form.formState.isValid || registerMutation.isPending}
              >
                {registerMutation.isPending ? "Creating account..." : "Create account"}
              </Button>
            </form>
          </Form>
        </AuthCard>
      </div>
    </AuthLayout>
  );
}
