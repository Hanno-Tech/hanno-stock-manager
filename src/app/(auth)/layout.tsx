export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-[480px] flex-col justify-center px-6 py-10">
      {children}
    </div>
  );
}
