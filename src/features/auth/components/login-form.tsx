import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Mail, MailCheck, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/features/auth/api/auth-provider"
import {
  loginSchema,
  type LoginValues,
} from "@/features/auth/schemas/login-schema"

export function LoginForm() {
  const { signInWithEmail } = useAuth()
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "" },
  })

  const onSubmit = async (values: LoginValues) => {
    setSubmitError(null)
    const { error } = await signInWithEmail(values.email)
    if (error) {
      setSubmitError(error.message)
      return
    }
    setSentTo(values.email)
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-gradient-to-br from-background to-primary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <TrendingUp className="h-5 w-5" />
          </div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Propfirm tracker</p>
          <div className="space-y-1">
            <CardTitle className="text-2xl">
              {sentTo ? "Check your inbox" : "Sign in to Fundout"}
            </CardTitle>
            <CardDescription>
              {sentTo
                ? `We sent a magic link to ${sentTo}. Click it to sign in.`
                : "Enter your email and we'll send you a magic link. No password needed."}
            </CardDescription>
          </div>
        </CardHeader>

        {sentTo ? (
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 rounded-md border bg-card p-4">
              <MailCheck className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <p className="text-sm text-muted-foreground">
                Open the email and click the link to sign in. You can close this
                tab — the link will bring you back.
              </p>
            </div>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => {
                setSentTo(null)
                form.reset()
              }}
            >
              Use a different email
            </Button>
          </CardContent>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          autoComplete="email"
                          autoFocus
                          placeholder="you@example.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {submitError ? (
                  <p className="text-sm text-destructive">{submitError}</p>
                ) : null}
              </CardContent>
              <CardFooter>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={form.formState.isSubmitting}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  {form.formState.isSubmitting ? "Sending…" : "Send magic link"}
                </Button>
              </CardFooter>
            </form>
          </Form>
        )}
      </Card>
    </div>
  )
}
