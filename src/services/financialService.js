import { supabase } from "../helpers/supabase";

// 1. دریافت لیست اسناد (دفتر روزنامه) - اصلاح شده
export const getFinancialDocuments = async () => {
    const { data, error } = await supabase
        .from('financial_documents')
        .select(`
            *,
            financial_entries (
                bed, bes, description,
                accounting_moein ( title, code ),
                accounting_tafsili ( title, code )
            )
        `)
        .order('doc_date', { ascending: false }) // جدیدترین تاریخ اول
        .order('id', { ascending: false });      // جدیدترین ثبت اول

    if (error) throw error;
    return data;
};

// ... بقیه توابع (getMoeinAccounts, getTafsiliAccounts, ...) بدون تغییر بمانند
export const getMoeinAccounts = async () => {
    const { data, error } = await supabase
        .from('accounting_moein')
        .select('id, code, title')
        .order('code', { ascending: true });

    if (error) throw error;
    return data;
};

export const getTafsiliAccounts = async () => {
    const { data, error } = await supabase
        .from('accounting_tafsili')
        .select('id, code, title, tafsili_type')
        .eq('is_active', true)
        .order('title', { ascending: true });

    if (error) throw error;
    return data;
};

export const createManualDocument = async (header, rows) => {
    // الف) ثبت هدر سند
    const { data: doc, error: docErr } = await supabase
        .from('financial_documents')
        .insert({
            doc_date: header.doc_date,
            manual_no: header.manual_no,
            description: header.description,
            doc_type: 'manual',
            status: 'final'
        })
        .select()
        .single();

    if (docErr) throw docErr;

    // ب) آماده‌سازی ردیف‌ها
    const entries = rows.map(row => ({
        doc_id: doc.id,
        moein_id: row.moein_id,
        tafsili_id: row.tafsili_id || null,
        bed: row.bed || 0,
        bes: row.bes || 0,
        description: row.description || header.description
    }));

    // ج) ثبت ردیف‌ها
    const { error: entryErr } = await supabase.from('financial_entries').insert(entries);

    if (entryErr) {
        await supabase.from('financial_documents').delete().eq('id', doc.id);
        throw entryErr;
    }

    return doc;
};

export const getCustomerBalances = async () => {
    const { data, error } = await supabase
        .from('accounting_tafsili')
        .select(`
            id, title, code, tafsili_type,
            financial_entries ( bed, bes )
        `);

    if (error) throw error;

    return data.map(Account => {
        const totalBed = Account.financial_entries.reduce((sum, item) => sum + (item.bed || 0), 0);
        const totalBes = Account.financial_entries.reduce((sum, item) => sum + (item.bes || 0), 0);
        return {
            ...Account,
            totalBed,
            totalBes,
            balance: totalBed - totalBes
        };
    }).filter(acc => acc.totalBed !== 0 || acc.totalBes !== 0);
};

// ... توابع قبلی ...

// 6. دریافت یک سند تکی برای ویرایش
export const getFinancialDocumentById = async (id) => {
    const { data, error } = await supabase
        .from('financial_documents')
        .select(`
            *,
            financial_entries (
                id, moein_id, tafsili_id, bed, bes, description,
                accounting_moein ( id, code, title ),
                accounting_tafsili ( id, code, title, tafsili_type )
            )
        `)
        .eq('id', id)
        .single();

    if (error) throw error;
    return data;
};

// 7. حذف سند (همراه با آرتیکل‌ها به دلیل Cascade)
export const deleteFinancialDocument = async (id) => {
    const { error } = await supabase
        .from('financial_documents')
        .delete()
        .eq('id', id);

    if (error) throw error;
};

// 8. ویرایش سند دستی
export const updateManualDocument = async (id, header, rows) => {
    // الف) آپدیت هدر
    const { error: headErr } = await supabase
        .from('financial_documents')
        .update({
            doc_date: header.doc_date,
            manual_no: header.manual_no,
            description: header.description
        })
        .eq('id', id);

    if (headErr) throw headErr;



    // 1. حذف قدیمی‌ها
    const { error: delErr } = await supabase
        .from('financial_entries')
        .delete()
        .eq('doc_id', id);

    if (delErr) throw delErr;

    // 2. درج جدیدها
    const entries = rows.map(row => ({
        doc_id: id,
        moein_id: row.moein_id,
        tafsili_id: row.tafsili_id || null,
        bed: row.bed || 0,
        bes: row.bes || 0,
        description: row.description || header.description
    }));

    const { error: insErr } = await supabase.from('financial_entries').insert(entries);
    if (insErr) throw insErr;
};