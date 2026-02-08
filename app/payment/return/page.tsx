export default function PaymentReturnPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-xl text-center space-y-3">
        <h1 className="text-2xl font-semibold">Payment flow completed</h1>
        <p className="text-sm opacity-80">
          If the payment was successful, your ticket will be sent to your email shortly.
        </p>
      </div>
    </main>
  );
}
