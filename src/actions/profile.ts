'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/dal/session';
import { parseOrThrow, uuid } from '@/lib/validation/common';
import { addressSchema } from '@/lib/validation/customer';

const MAX_SAVED_ADDRESSES = 20;

type SavedAddress = { id: string } & Record<string, unknown>;

export async function addSavedAddress(addressData: unknown) {
  const user = await requireUser();
  const address = parseOrThrow(addressSchema, addressData, 'Please check the address');
  const supabase = await createClient();

  const { data: profile, error: readErr } = await supabase
    .from('profiles')
    .select('saved_addresses')
    .eq('id', user.id)
    .single();
  if (readErr) throw new Error('Could not load your addresses');

  const currentAddresses: SavedAddress[] = Array.isArray(profile?.saved_addresses) ? profile.saved_addresses : [];
  if (currentAddresses.length >= MAX_SAVED_ADDRESSES) {
    throw new Error(`You can save up to ${MAX_SAVED_ADDRESSES} addresses`);
  }
  const newAddress = { ...address, id: crypto.randomUUID() };

  const { error } = await supabase
    .from('profiles')
    .update({ saved_addresses: [...currentAddresses, newAddress] })
    .eq('id', user.id);

  if (error) throw new Error('Could not save the address');

  revalidatePath('/account/profile');
  return { success: true, addressId: newAddress.id };
}

export async function removeSavedAddress(addressId: string) {
  const user = await requireUser();
  const id = parseOrThrow(uuid, addressId, 'Invalid address');
  const supabase = await createClient();

  const { data: profile, error: readErr } = await supabase
    .from('profiles')
    .select('saved_addresses')
    .eq('id', user.id)
    .single();
  if (readErr) throw new Error('Could not load your addresses');

  const currentAddresses: SavedAddress[] = Array.isArray(profile?.saved_addresses) ? profile.saved_addresses : [];
  const updatedAddresses = currentAddresses.filter((a) => a.id !== id);

  const { error } = await supabase
    .from('profiles')
    .update({ saved_addresses: updatedAddresses })
    .eq('id', user.id);

  if (error) throw new Error('Could not remove the address');

  revalidatePath('/account/profile');
  return { success: true };
}
