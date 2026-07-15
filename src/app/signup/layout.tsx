import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function SignupLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  
  if (userData?.user) {
    redirect('/account');
  }

  return <>{children}</>;
}
