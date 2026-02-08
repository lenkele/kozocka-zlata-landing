export default function PaymentSuccessPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-xl text-center space-y-3">
        <h1 className="text-2xl font-semibold">Payment received</h1>
        <p className="text-sm opacity-80">
          Thank you. We have received your payment request and are confirming it.
        </p>
      </div>
    </main>
  );
}
