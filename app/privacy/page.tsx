import { PRIVACY_DOCUMENT_TEXT } from '@/app/legal-content';

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 px-4 py-10">
      <div className="max-w-4xl mx-auto space-y-4">
        <h1 className="text-2xl font-semibold">Политика конфиденциальности</h1>
        <article className="rounded-xl border border-slate-700 bg-slate-900 p-4 md:p-6 text-sm text-slate-200 leading-7 whitespace-pre-line">
          {PRIVACY_DOCUMENT_TEXT}
        </article>
      </div>
    </main>
  );
}
