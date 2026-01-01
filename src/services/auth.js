import { supabase } from "../helpers/supabase";

/**
 * درخواست ارسال کد OTP (جایگزین requestOtp قبلی)
 */
export const signInWithMobile = async (mobile) => {
  try {
    // تبدیل شماره موبایل ایران به فرمت استاندارد جهانی
    // مثلا 0912 تبدیل میشه به +98912
    const formattedMobile = mobile.startsWith('0')
        ? mobile.replace('0', '+98')
        : mobile;

    // ارسال درخواست به سوپابیس
    const { data, error } = await supabase.auth.signInWithOtp({
      phone: formattedMobile
    });

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error("Auth Error:", error);
    return { success: false, error: error.message };
  }
};

/**
 * تایید کد OTP و دریافت توکن (جایگزین verifyOtp قبلی)
 */
export const verifyMobileLogin = async (mobile, token) => {
  try {
    const formattedMobile = mobile.startsWith('0')
        ? mobile.replace('0', '+98')
        : mobile;

    // تایید کد توسط سوپابیس
    const { data, error } = await supabase.auth.verifyOtp({
      phone: formattedMobile,
      token: token,
      type: 'sms'
    });

    if (error) throw error;

    // نکته: سوپابیس خودش توکن را در LocalStorage ذخیره می‌کند
    // نیازی به ذخیره دستی نیست.

    return { success: true, session: data.session, user: data.user };
  } catch (error) {
    console.error("Verify Error:", error);
    return { success: false, error: error.message };
  }
};

/**
 * دریافت اطلاعات کاربر لاگین شده (جایگزین getMe)
 */
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

/**
 * خروج از سیستم
 */
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) return { success: false, error: error.message };
  return { success: true };
};

// نگاشت توابع قدیمی به جدید (برای اینکه اگر جایی از نام‌های قبلی استفاده کردید کد نشکند)
export const requestOtp = signInWithMobile;
export const verifyOtp = verifyMobileLogin;
export const getMe = getCurrentUser;