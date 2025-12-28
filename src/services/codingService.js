import { supabase } from "../helpers/supabase";

// ============================================================
// helper: مدیریت خطای حذف (کنترل وابستگی‌ها)
// ============================================================
const handleDeleteError = (error) => {
    // کد خطای 23503 در پستگرس یعنی نقض کلید خارجی (Foreign Key Violation)
    // یعنی این رکورد در جای دیگری (مثلا سند حسابداری یا سطح پایین‌تر) استفاده شده است.
    if (error && error.code === '23503') {
        throw new Error("DEPENDENCY_ERROR");
    }
    throw error;
};

// ============================================================
// سطح 1: گروه (Group)
// ============================================================

export const getGroups = async () => {
    const { data, error } = await supabase.from('accounting_groups').select('*').order('code', { ascending: true });
    if (error) throw error;
    return data;
};

export const createGroup = async (group) => {
    const { data, error } = await supabase.from('accounting_groups').insert(group).select().single();
    if (error) throw error;
    return data;
};

export const updateGroup = async (id, group) => {
    const { error } = await supabase.from('accounting_groups')
        .update({
            title: group.title,
            nature: group.nature,
            category: group.category
        })
        .eq('id', id);
    if (error) throw error;
};

export const deleteGroup = async (id) => {
    const { error } = await supabase.from('accounting_groups').delete().eq('id', id);
    if (error) handleDeleteError(error);
};

// ============================================================
// سطح 2: کل (GL)
// ============================================================

export const getGLs = async () => {
    const { data, error } = await supabase
        .from('accounting_gl')
        .select('*, accounting_groups(title, code)')
        .order('code', { ascending: true });
    if (error) throw error;
    return data;
};

export const createGL = async (gl) => {
    const { data, error } = await supabase.from('accounting_gl').insert(gl).select().single();
    if (error) throw error;
    return data;
};

export const updateGL = async (id, gl) => {
    const { error } = await supabase.from('accounting_gl')
        .update({
            title: gl.title,
            code: gl.code,
            group_id: gl.group_id
        })
        .eq('id', id);
    if (error) throw error;
};

export const deleteGL = async (id) => {
    const { error } = await supabase.from('accounting_gl').delete().eq('id', id);
    if (error) handleDeleteError(error);
};

// ============================================================
// سطح 3: معین (Moein)
// ============================================================

export const getMoeins = async () => {
    const { data, error } = await supabase
        .from('accounting_moein')
        .select('*, accounting_gl(title, code)')
        .order('code', { ascending: true });
    if (error) throw error;
    return data;
};

export const createMoein = async (moein) => {
    const { data, error } = await supabase.from('accounting_moein').insert(moein).select().single();
    if (error) throw error;
    return data;
};

export const updateMoein = async (id, moein) => {
    const { error } = await supabase.from('accounting_moein')
        .update({
            title: moein.title,
            code: moein.code,
            gl_id: moein.gl_id
        })
        .eq('id', id);
    if (error) throw error;
};

export const deleteMoein = async (id) => {
    const { error } = await supabase.from('accounting_moein').delete().eq('id', id);
    if (error) handleDeleteError(error);
};

// ============================================================
// سطح 4: تفصیلی (Tafsili)
// ============================================================

export const getTafsilis = async () => {
    const { data, error } = await supabase.from('accounting_tafsili').select('*').order('code', { ascending: true });
    if (error) throw error;
    return data;
};

export const createTafsili = async (tafsili) => {
    const { data, error } = await supabase.from('accounting_tafsili').insert(tafsili).select().single();
    if (error) throw error;
    return data;
};

export const updateTafsili = async (id, tafsili) => {
    const { error } = await supabase.from('accounting_tafsili')
        .update({
            title: tafsili.title,
            code: tafsili.code,
            tafsili_type: tafsili.tafsili_type
        })
        .eq('id', id);
    if (error) throw error;
};

export const deleteTafsili = async (id) => {
    const { error } = await supabase.from('accounting_tafsili').delete().eq('id', id);
    if (error) handleDeleteError(error);
};

// ============================================================
// ✅ تابع تولید کد هوشمند (4 سطحی + خزانه‌داری)
// ============================================================
export const generateNextCode = async (level, parentIdOrType) => {
    let query;
    let parentCode = '';

    // ✅ منطق تولید کد برای خزانه‌داری (دریافت/پرداخت)
    if (level === 'treasury') {
        try {
            const prefix = parentIdOrType === 'receive' ? 'D' : 'P'; // D = دریافت، P = پرداخت
            const year = new Date().getFullYear().toString().slice(-2); // دو رقم آخر سال (مثلاً 25 برای 2025)

            // شمارش تعداد اسناد مالی با همین پیشوند در سال جاری
            const startOfYear = `${new Date().getFullYear()}-01-01`;
            const searchPattern = `${parentIdOrType === 'receive' ? 'دریافت' : 'پرداخت'} شماره ${prefix}${year}%`;

            const { count, error } = await supabase
                .from('financial_documents')
                .select('id', { count: 'exact', head: true })
                .ilike('description', searchPattern)
                .gte('doc_date', startOfYear);

            if (error) {
                console.error('Error counting treasury transactions:', error);
                // در صورت خطا، از روش جایگزین استفاده می‌کنیم
                return `${prefix}${year}001`;
            }

            const nextNumber = String((count || 0) + 1).padStart(4, '0');
            return `${prefix}${year}${nextNumber}`;

        } catch (error) {
            console.error('Error generating treasury code:', error);
            // Fallback: از timestamp استفاده کن
            const prefix = parentIdOrType === 'receive' ? 'D' : 'P';
            return `${prefix}${Date.now()}`;
        }
    }

    // 1. منطق دریافت کد والد برای ساخت پیشوند (برای حسابداری)
    if (level === 'gl' && parentIdOrType) {
        const { data } = await supabase.from('accounting_groups').select('code').eq('id', parentIdOrType).single();
        if (data) parentCode = data.code;
    }
    else if (level === 'moein' && parentIdOrType) {
        const { data } = await supabase.from('accounting_gl').select('code').eq('id', parentIdOrType).single();
        if (data) parentCode = data.code;
    }

    // 2. کوئری برای پیدا کردن آخرین کد در آن سطح و والد
    if (level === 'group') {
        query = supabase.from('accounting_groups').select('code').order('code', { ascending: false }).limit(1);
    }
    else if (level === 'gl') {
        if (!parentIdOrType) return '';
        query = supabase.from('accounting_gl').select('code').eq('group_id', parentIdOrType).order('code', { ascending: false }).limit(1);
    }
    else if (level === 'moein') {
        if (!parentIdOrType) return '';
        query = supabase.from('accounting_moein').select('code').eq('gl_id', parentIdOrType).order('code', { ascending: false }).limit(1);
    }
    else if (level === 'tafsili') {
        if (!parentIdOrType) return '';
        query = supabase.from('accounting_tafsili').select('code').eq('tafsili_type', parentIdOrType).order('code', { ascending: false }).limit(1);
    }

    const { data } = await query;

    // 3. محاسبه کد جدید
    if (data && data.length > 0) {
        const lastCode = data[0].code;
        const nextVal = parseInt(lastCode, 10) + 1;

        // اگر تفصیلی باشد، پدینگ صفر اضافه می‌کنیم
        if(level === 'tafsili') return String(nextVal).padStart(lastCode.length, '0');

        return String(nextVal);
    } else {
        // اگر اولین بار است:
        if (level === 'group') return '1';
        if (level === 'gl') return parentCode + '01';
        if (level === 'moein') return parentCode + '01';
        if (level === 'tafsili') return '0001';
    }
};