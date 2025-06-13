
export default function AuthLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { [key: string]: string | string[] | undefined }; // Reverted to a more general type
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-primary p-4">
      {children}
    </div>
  );
}
