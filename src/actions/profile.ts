'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function addSavedAddress(addressData: any) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) throw new Error('Unauthorized');

  const { data: profile } = await supabase
    .from('profiles')
    .select('saved_addresses')
    .eq('id', userData.user.id)
    .single();

  const currentAddresses = profile?.saved_addresses || [];
  const newAddress = { ...addressData, id: crypto.randomUUID() };
  const updatedAddresses = [...currentAddresses, newAddress];

  const { error } = await supabase
    .from('profiles')
    .update({ saved_addresses: updatedAddresses })
    .eq('id', userData.user.id);

  if (error) throw new Error(error.message);

  revalidatePath('/account/profile');
  return { success: true, addressId: newAddress.id };
}

export async function removeSavedAddress(addressId: string) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) throw new Error('Unauthorized');

  const { data: profile } = await supabase
    .from('profiles')
    .select('saved_addresses')
    .eq('id', userData.user.id)
    .single();

  const currentAddresses = profile?.saved_addresses || [];
  const updatedAddresses = currentAddresses.filter((a: any) => a.id !== addressId);

  const { error } = await supabase
    .from('profiles')
    .update({ saved_addresses: updatedAddresses })
    .eq('id', userData.user.id);

  if (error) throw new Error(error.message);

  revalidatePath('/account/profile');
  return { success: true };
}
