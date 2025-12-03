import { redirect } from 'next/navigation';

import { DEFAULT_SHOW_SLUG } from '@/shows';

export default function RootPage() {
  redirect(`/${DEFAULT_SHOW_SLUG}`);
}

