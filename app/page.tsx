import { redirect } from 'next/navigation';

export default function RootPage() {
  // proxy.ts negotiates the language before rendering; keep a safe fallback.
  redirect('/ru');
}
