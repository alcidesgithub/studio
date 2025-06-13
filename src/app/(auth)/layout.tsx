
export default function AuthLayout({
  children,
  params, // Explicitly acknowledge params prop
}: {
  children: React.ReactNode;
  params: {}; // Changed to empty object for static routes
}) {
  // While this layout is for static routes (so params would be {}),
  // acknowledging it here. The error "params are being enumerated"
  // usually happens if code attempts Object.keys(params) or JSON.stringify(params)
  // on the params proxy in a Server Component.
  // Accessing specific properties like params.someKey is fine.
  // Passing params to a Client Component is also fine, as it gets serialized.
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-primary p-4">
      {children}
    </div>
  );
}

