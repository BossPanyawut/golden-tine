export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 items-center justify-center bg-muted/40 p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Golden Tine
          </h1>
          <p className="text-sm text-muted-foreground">Life OS</p>
        </div>
        {children}
      </div>
    </div>
  );
}
