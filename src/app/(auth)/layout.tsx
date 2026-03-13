import BackgroundAnimation from '@/components/BackgroundAnimation';

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <BackgroundAnimation />
      <div className="flex min-h-screen items-center justify-center bg-black px-4 py-8 relative z-10">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </>
  );
}
