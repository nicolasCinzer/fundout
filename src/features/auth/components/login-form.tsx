import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowRight, MailCheck } from "lucide-react"
import { useTranslation } from "react-i18next"
import { BrandMark, FundoutSymbol } from "@/components/common/brand-mark"
import { LoginLeftPanel } from "@/features/auth/components/login-left-panel"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
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
  const { t } = useTranslation("auth")
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
    <div className="min-h-svh grid md:grid-cols-2 lg:grid-cols-[55fr_45fr] xl:grid-cols-[60fr_40fr]">
      <LoginLeftPanel />
      <div
        role="region"
        aria-label={t("login.signInRegion")}
        className="relative overflow-hidden flex flex-col items-center justify-center p-6 lg:p-10"
      >
        <FundoutSymbol
          className="pointer-events-none absolute -bottom-24 -right-24 size-180 -rotate-12 text-primary opacity-[0.30]"
        />
        <div className="md:hidden mb-6 flex justify-center">
          <BrandMark size="sm" />
        </div>
        <Card className="relative z-10 w-full max-w-md m-2 shadow-[0_0_20px_24px_var(--background)]">
          <CardHeader className="space-y-3">
            <div className="space-y-1">
              <CardTitle className="text-2xl">
                {sentTo ? t("login.checkInbox") : t("login.title")}
              </CardTitle>
              <CardDescription>
                {sentTo
                  ? t("login.checkInboxDescription", { email: sentTo })
                  : t("login.description")}
              </CardDescription>
            </div>
          </CardHeader>

          {sentTo ? (
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 rounded-md border bg-card p-4">
                <MailCheck className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <p className="text-sm text-muted-foreground">
                  {t("login.checkInboxHint")}
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
                {t("login.useDifferentEmail")}
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
                        <FormLabel>{t("login.emailLabel")}</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            autoComplete="email"
                            autoFocus
                            placeholder={t("login.emailPlaceholder")}
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
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={form.formState.isSubmitting}
                  >
                    {form.formState.isSubmitting
                      ? t("login.submitting")
                      : t("login.submit")}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </form>
            </Form>
          )}
        </Card>
      </div>
    </div>
  )
}
