'use server';

import { createClient } from '@/utils/supabase/server';

export async function updatePassword(formData: FormData) {
  const newPassword = formData.get('newPassword') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (newPassword !== confirmPassword) {
    return { error: 'Konfirmasi password tidak cocok.' };
  }

  if (newPassword.length < 6) {
    return { error: 'Password minimal 6 karakter.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}
