import { LoginForm } from "@/components/LoginForm";
import { dictionaries } from "@/lib/i18n/dictionary";
import { getLocale } from "@/lib/i18n/locale";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const locale = await getLocale();
  const dict = dictionaries[locale];

  return (
    <main className="min-h-screen w-full flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="font-serif text-2xl text-text">newsScrapperAI</h1>
          <p className="text-sm text-text-muted mt-1">{dict.login.subtitle}</p>
        </div>
        <LoginForm dict={dict.login} />
      </div>
    </main>
  );
}
