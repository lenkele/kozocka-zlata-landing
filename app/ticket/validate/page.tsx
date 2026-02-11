import { Suspense } from 'react';

import TicketValidateClient from './ticket-validate-client';

export default function TicketValidatePage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-slate-100 text-slate-900 p-6">Загрузка...</main>}>
      <TicketValidateClient />
    </Suspense>
  );
}
