import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="scan-shell flex min-h-full flex-1 items-center justify-center bg-[#121212] px-4 py-10">
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        forceRedirectUrl="/"
        appearance={{
          elements: {
            rootBox: "mx-auto w-full max-w-md",
            card: "rounded-[1.5rem] border-0 bg-white shadow-xl",
            headerTitle: "font-[family-name:var(--font-display)] text-[var(--ink)]",
            formButtonPrimary:
              "rounded-xl bg-[var(--coral)] hover:bg-[var(--coral)] text-sm font-bold",
          },
        }}
      />
    </div>
  );
}
