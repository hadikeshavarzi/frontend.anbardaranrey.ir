import { supabase } from "../helpers/supabase";

/**
 * دریافت لیست کاربران زیرمجموعه (مخصوص پنل ممبر)
 * این تابع فقط کاربرانی را برمی‌گرداند که توسط کاربر جاری ساخته شده‌اند.
 */
export const getMySystemUsers = async () => {
    // ۱. گرفتن ID کاربر لاگین شده در سوپابیس
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // ۲. پیدا کردن ID عددی ممبر متناظر با این یوزر
    const { data: member } = await supabase
        .from('members')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

    if (!member) return [];

    // ۳. گرفتن تمام اعضایی که owner_id آن‌ها برابر با ID من است (زیرمجموعه‌های من)
    const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('owner_id', member.id)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
};

/**
 * ایجاد کاربر سیستم جدید توسط ممبر
 */
export const createSystemUser = async (userData) => {
    try {
        // ۱. گرفتن ID خود کاربر جاری (صاحب کارمند)
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, error: "کاربر لاگین نیست" };

        const { data: ownerMember } = await supabase
            .from('members')
            .select('id')
            .eq('auth_user_id', user.id)
            .single();

        if (!ownerMember) return { success: false, error: "شناسه والد یافت نشد" };

        // ۲. ثبت در دیتابیس (owner_id را ست می‌کنیم)
        const { data, error } = await supabase
            .from('members')
            .insert([{
                ...userData,
                owner_id: ownerMember.id, // ✅ اتصال به والد
                role: 'employee',         // نقش پیش‌فرض کارمندان
                member_status: 'active',
                permissions: []           // لیست دسترسی خالی (بعداً پر می‌شود)
            }])
            .select();

        if (error) throw error;
        return { success: true, data };

    } catch (error) {
        return { success: false, error: error.message };
    }
};