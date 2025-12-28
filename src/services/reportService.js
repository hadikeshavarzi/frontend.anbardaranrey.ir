import { supabase } from "../helpers/supabase";

// ==========================================
// 1. گزارش دفتر روزنامه (Journal Ledger)
// ==========================================
export const getJournalReport = async (startDate, endDate) => {
    let query = supabase
        .from('financial_documents')
        .select(`
            id,
            doc_date,
            description,
            manual_no,
            financial_entries (
                id,
                description,
                bed,
                bes,
                moein:accounting_moein ( title, code ),
                tafsili:accounting_tafsili ( title, code )
            )
        `)
        .order('doc_date', { ascending: true })
        .order('id', { ascending: true });

    // ✅ فیلتر تاریخ با فرمت صحیح YYYY-MM-DD
    if (startDate) {
        const formattedStart = startDate.length === 10 ? startDate : startDate.slice(0, 10);
        query = query.gte('doc_date', formattedStart);
    }
    if (endDate) {
        const formattedEnd = endDate.length === 10 ? endDate : endDate.slice(0, 10);
        query = query.lte('doc_date', formattedEnd);
    }

    const { data, error } = await query;
    if (error) {
        console.error("Error fetching journal report:", error);
        throw error;
    }
    return data;
};

// ==========================================
// 2. گزارش تراز آزمایشی (Trial Balance)
// ==========================================
export const getTrialBalance = async () => {
    const { data, error } = await supabase
        .from('financial_entries')
        .select(`
            bed, bes,
            moein:accounting_moein ( id, code, title )
        `);

    if (error) {
        console.error("Error fetching trial balance:", error);
        throw error;
    }

    const summary = {};

    data.forEach(entry => {
        const key = entry.moein?.code;
        if (!key) return;

        if (!summary[key]) {
            summary[key] = {
                id: entry.moein.id,
                code: key,
                title: entry.moein.title,
                totalBed: 0,
                totalBes: 0,
                balance: 0
            };
        }

        summary[key].totalBed += Number(entry.bed || 0);
        summary[key].totalBes += Number(entry.bes || 0);
    });

    return Object.values(summary).map(item => ({
        ...item,
        balance: item.totalBed - item.totalBes
    })).sort((a, b) => a.code.localeCompare(b.code));
};

// ==========================================
// 3. دفتر تفصیلی / ریز گردش حساب
// ==========================================
export const getTafsiliLedger = async (tafsiliId) => {
    if (!tafsiliId) return [];

    // ✅ ابتدا چک کن این تفصیلی مربوط به بانک هست یا نه
    const { data: bankInfo } = await supabase
        .from('treasury_banks')
        .select('id, tafsili_id')
        .eq('tafsili_id', tafsiliId)
        .maybeSingle();

    let allTafsiliIds = [tafsiliId];

    // ✅ اگر بانک بود، تفصیلی‌های POS های متصل رو هم بگیر
    if (bankInfo) {
        const { data: posDevices } = await supabase
            .from('treasury_pos')
            .select('tafsili_id')
            .eq('bank_id', bankInfo.id);

        if (posDevices && posDevices.length > 0) {
            const posTafsiliIds = posDevices.map(p => p.tafsili_id).filter(Boolean);
            allTafsiliIds = [...allTafsiliIds, ...posTafsiliIds];
        }
    }

    // ✅ دریافت گردش همه تفصیلی‌ها (بانک + POS های متصل)
    const { data, error } = await supabase
        .from('financial_entries')
        .select(`
            id,
            description,
            bed,
            bes,
            tafsili_id,
            created_at,
            document:financial_documents ( id, doc_date, manual_no, description ),
            tafsili:accounting_tafsili ( title )
        `)
        .in('tafsili_id', allTafsiliIds);

    if (error) {
        console.error("Error fetching ledger:", error);
        throw error;
    }

    // مرتب‌سازی بر اساس تاریخ
    return data.sort((a, b) => {
        const dateA = new Date(a.document?.doc_date || 0);
        const dateB = new Date(b.document?.doc_date || 0);

        if (dateA < dateB) return -1;
        if (dateA > dateB) return 1;
        return (a.document?.id || 0) - (b.document?.id || 0);
    });
};

// ==========================================
// 4. لیست مشتریان و مانده حساب
// ==========================================
export const getCustomerBalances = async () => {
    try {
        const { data: people, error: pError } = await supabase
            .from('accounting_tafsili')
            .select('id, code, title, tafsili_type')
            .eq('is_active', true)
            .eq('tafsili_type', 'customer'); // ✅ فقط مشتریان

        if (pError) throw pError;

        const { data: entries, error: eError } = await supabase
            .from('financial_entries')
            .select('tafsili_id, bed, bes');

        if (eError) throw eError;

        const report = people.map(person => {
            const personEntries = entries.filter(e => e.tafsili_id === person.id);
            const totalBed = personEntries.reduce((sum, e) => sum + (Number(e.bed) || 0), 0);
            const totalBes = personEntries.reduce((sum, e) => sum + (Number(e.bes) || 0), 0);
            const balance = totalBed - totalBes;

            return {
                ...person,
                totalBed,
                totalBes,
                balance,
                status: balance > 0 ? 'بدهکار' : balance < 0 ? 'بستانکار' : 'تسویه'
            };
        });

        return report;

    } catch (error) {
        console.error("Error calculating customer balances:", error);
        throw error;
    }
};

// ==========================================
// 5. گزارش جامع مرور حساب‌ها
// ==========================================
export const getComprehensiveLedger = async ({ startDate, endDate, moeinId, tafsiliId }) => {
    // ✅ اگر تفصیلی بانک انتخاب شده، POS های متصل رو هم بیار
    let allTafsiliIds = tafsiliId ? [tafsiliId] : null;

    if (tafsiliId) {
        const { data: bankInfo } = await supabase
            .from('treasury_banks')
            .select('id')
            .eq('tafsili_id', tafsiliId)
            .maybeSingle();

        if (bankInfo) {
            const { data: posDevices } = await supabase
                .from('treasury_pos')
                .select('tafsili_id')
                .eq('bank_id', bankInfo.id);

            if (posDevices && posDevices.length > 0) {
                const posTafsiliIds = posDevices.map(p => p.tafsili_id).filter(Boolean);
                allTafsiliIds = [tafsiliId, ...posTafsiliIds];
            }
        }
    }

    // ✅ ابتدا لیست doc_id های مربوط به بازه تاریخی رو بگیر
    let docIds = null;
    if (startDate || endDate) {
        let docQuery = supabase.from('financial_documents').select('id');

        if (startDate) {
            const formattedStart = startDate.length === 10 ? startDate : startDate.slice(0, 10);
            docQuery = docQuery.gte('doc_date', formattedStart);
        }
        if (endDate) {
            const formattedEnd = endDate.length === 10 ? endDate : endDate.slice(0, 10);
            docQuery = docQuery.lte('doc_date', formattedEnd);
        }

        const { data: docs } = await docQuery;
        docIds = (docs || []).map(d => d.id);

        // اگر هیچ سندی در این بازه نبود، آرایه خالی برگردون
        if (docIds.length === 0) {
            return [];
        }
    }

    let query = supabase
        .from('financial_entries')
        .select(`
            id, description, bed, bes, tafsili_id, doc_id,
            document:financial_documents ( id, doc_date, manual_no ),
            moein:accounting_moein ( id, code, title ),
            tafsili:accounting_tafsili ( id, code, title )
        `);

    // فیلتر معین
    if (moeinId) {
        query = query.eq('moein_id', moeinId);
    }

    // ✅ فیلتر تفصیلی (شامل POS های متصل)
    if (allTafsiliIds && allTafsiliIds.length > 0) {
        query = query.in('tafsili_id', allTafsiliIds);
    }

    // ✅ فیلتر تاریخ با doc_id
    if (docIds && docIds.length > 0) {
        query = query.in('doc_id', docIds);
    }

    const { data, error } = await query;
    if (error) {
        console.error("Error in getComprehensiveLedger:", error);
        throw error;
    }

    return (data || []).sort((a, b) => {
        const dateA = new Date(a.document?.doc_date || 0);
        const dateB = new Date(b.document?.doc_date || 0);
        if (dateA < dateB) return -1;
        if (dateA > dateB) return 1;
        return (a.document?.id || 0) - (b.document?.id || 0);
    });
};

// ==========================================
// 6. گزارش موجودی بانک‌ها و POS (با ترکیب)
// ==========================================
export const getBankBalances = async () => {
    try {
        // ۱. دریافت لیست بانک‌ها
        const { data: banks, error: bankErr } = await supabase
            .from('treasury_banks')
            .select('id, bank_name, account_no, tafsili_id')
            .order('bank_name');

        if (bankErr) throw bankErr;

        // ۲. دریافت دستگاه‌های POS با بانک متصل
        const { data: posDevices, error: posErr } = await supabase
            .from('treasury_pos')
            .select('id, title, terminal_id, tafsili_id, bank_id, treasury_banks(bank_name)')
            .order('title');

        if (posErr) throw posErr;

        // ۳. جمع‌آوری tafsili_id ها
        const bankTafsiliIds = (banks || []).map(b => b.tafsili_id).filter(Boolean);
        const posTafsiliIds = (posDevices || []).map(p => p.tafsili_id).filter(Boolean);
        const allTafsiliIds = [...new Set([...bankTafsiliIds, ...posTafsiliIds])];

        // ۴. محاسبه موجودی
        let balances = {};
        if (allTafsiliIds.length > 0) {
            const { data: entries, error: entryErr } = await supabase
                .from('financial_entries')
                .select('tafsili_id, bed, bes')
                .in('tafsili_id', allTafsiliIds);

            if (entryErr) throw entryErr;

            (entries || []).forEach(entry => {
                const tid = entry.tafsili_id;
                if (!balances[tid]) balances[tid] = { totalBed: 0, totalBes: 0 };
                balances[tid].totalBed += Number(entry.bed) || 0;
                balances[tid].totalBes += Number(entry.bes) || 0;
            });
        }

        // ۵. ساخت گزارش بانک‌ها (شامل POS های متصل)
        const bankReport = (banks || []).map(bank => {
            // موجودی خود بانک
            const bankBal = balances[bank.tafsili_id] || { totalBed: 0, totalBes: 0 };

            // ✅ پیدا کردن POS های متصل به این بانک و جمع موجودی
            const connectedPos = (posDevices || []).filter(p => p.bank_id === bank.id);
            let posTotalBed = 0;
            let posTotalBes = 0;

            connectedPos.forEach(pos => {
                const posBal = balances[pos.tafsili_id] || { totalBed: 0, totalBes: 0 };
                posTotalBed += posBal.totalBed;
                posTotalBes += posBal.totalBes;
            });

            return {
                id: bank.id,
                type: 'bank',
                name: bank.bank_name,
                account_no: bank.account_no,
                tafsili_id: bank.tafsili_id,
                // موجودی خود بانک
                bankBed: bankBal.totalBed,
                bankBes: bankBal.totalBes,
                bankBalance: bankBal.totalBed - bankBal.totalBes,
                // موجودی POS های متصل
                posBed: posTotalBed,
                posBes: posTotalBes,
                posBalance: posTotalBed - posTotalBes,
                // ✅ موجودی کل (بانک + POS)
                totalBed: bankBal.totalBed + posTotalBed,
                totalBes: bankBal.totalBes + posTotalBes,
                balance: (bankBal.totalBed + posTotalBed) - (bankBal.totalBes + posTotalBes),
                // تعداد POS های متصل
                posCount: connectedPos.length
            };
        });

        // ۶. گزارش POS ها (جداگانه)
        const posReport = (posDevices || []).map(pos => {
            const bal = balances[pos.tafsili_id] || { totalBed: 0, totalBes: 0 };
            return {
                id: pos.id,
                type: 'pos',
                name: pos.title || `POS - ${pos.terminal_id}`,
                terminal_id: pos.terminal_id,
                bank_id: pos.bank_id,
                bank_name: pos.treasury_banks?.bank_name || '-',
                tafsili_id: pos.tafsili_id,
                totalBed: bal.totalBed,
                totalBes: bal.totalBes,
                balance: bal.totalBed - bal.totalBes
            };
        });

        return {
            banks: bankReport,
            posDevices: posReport,
            summary: {
                // جمع موجودی بانک‌ها (بدون POS)
                totalBankOnlyBalance: bankReport.reduce((sum, b) => sum + b.bankBalance, 0),
                // جمع موجودی POS ها
                totalPosBalance: posReport.reduce((sum, p) => sum + p.balance, 0),
                // ✅ جمع کل (بانک + POS)
                totalBankBalance: bankReport.reduce((sum, b) => sum + b.balance, 0),
                grandTotal: bankReport.reduce((sum, b) => sum + b.balance, 0)
            }
        };

    } catch (error) {
        console.error("Error fetching bank balances:", error);
        throw error;
    }
};

// ==========================================
// 7. گزارش موجودی صندوق‌ها
// ==========================================
export const getCashBalances = async () => {
    try {
        const { data: cashes, error: cashErr } = await supabase
            .from('treasury_cashes')
            .select('id, title, tafsili_id')
            .order('title');

        if (cashErr) throw cashErr;

        const cashTafsiliIds = (cashes || []).map(c => c.tafsili_id).filter(Boolean);

        let balances = {};
        if (cashTafsiliIds.length > 0) {
            const { data: entries, error: entryErr } = await supabase
                .from('financial_entries')
                .select('tafsili_id, bed, bes')
                .in('tafsili_id', cashTafsiliIds);

            if (entryErr) throw entryErr;

            (entries || []).forEach(entry => {
                const tid = entry.tafsili_id;
                if (!balances[tid]) balances[tid] = { totalBed: 0, totalBes: 0 };
                balances[tid].totalBed += Number(entry.bed) || 0;
                balances[tid].totalBes += Number(entry.bes) || 0;
            });
        }

        const cashReport = (cashes || []).map(cash => {
            const bal = balances[cash.tafsili_id] || { totalBed: 0, totalBes: 0 };
            return {
                id: cash.id,
                name: cash.title,
                tafsili_id: cash.tafsili_id,
                totalBed: bal.totalBed,
                totalBes: bal.totalBes,
                balance: bal.totalBed - bal.totalBes
            };
        });

        return {
            cashes: cashReport,
            summary: {
                totalCashBalance: cashReport.reduce((sum, c) => sum + c.balance, 0)
            }
        };

    } catch (error) {
        console.error("Error fetching cash balances:", error);
        throw error;
    }
};

// ==========================================
// 8. گزارش کلی خزانه‌داری
// ==========================================
export const getTreasuryOverview = async () => {
    try {
        const [bankData, cashData] = await Promise.all([
            getBankBalances(),
            getCashBalances()
        ]);

        return {
            banks: bankData.banks,
            posDevices: bankData.posDevices,
            cashes: cashData.cashes,
            summary: {
                totalBankBalance: bankData.summary.totalBankBalance,
                totalPosBalance: bankData.summary.totalPosBalance,
                totalCashBalance: cashData.summary.totalCashBalance,
                grandTotal: bankData.summary.grandTotal + cashData.summary.totalCashBalance
            }
        };

    } catch (error) {
        console.error("Error fetching treasury overview:", error);
        throw error;
    }
};

// ==========================================
// 9. ریز گردش خزانه (با ترکیب بانک و POS)
// ==========================================
export const getTreasuryLedger = async (tafsiliId, startDate, endDate) => {
    if (!tafsiliId) return [];

    // ✅ چک کن آیا این تفصیلی مربوط به بانک هست
    const { data: bankInfo } = await supabase
        .from('treasury_banks')
        .select('id')
        .eq('tafsili_id', tafsiliId)
        .maybeSingle();

    let allTafsiliIds = [tafsiliId];

    // ✅ اگر بانک بود، POS های متصل رو هم بگیر
    if (bankInfo) {
        const { data: posDevices } = await supabase
            .from('treasury_pos')
            .select('tafsili_id')
            .eq('bank_id', bankInfo.id);

        if (posDevices && posDevices.length > 0) {
            const posTafsiliIds = posDevices.map(p => p.tafsili_id).filter(Boolean);
            allTafsiliIds = [...allTafsiliIds, ...posTafsiliIds];
        }
    }

    // دریافت گردش همه تفصیلی‌ها
    const { data, error } = await supabase
        .from('financial_entries')
        .select(`
            id,
            description,
            bed,
            bes,
            tafsili_id,
            created_at,
            document:financial_documents ( id, doc_no, doc_date, description ),
            tafsili:accounting_tafsili ( title )
        `)
        .in('tafsili_id', allTafsiliIds);

    if (error) throw error;

    // فیلتر تاریخ
    let filtered = data;
    if (startDate || endDate) {
        const formattedStart = startDate ? (startDate.length === 10 ? startDate : startDate.slice(0, 10)) : null;
        const formattedEnd = endDate ? (endDate.length === 10 ? endDate : endDate.slice(0, 10)) : null;

        filtered = data.filter(entry => {
            const docDate = entry.document?.doc_date;
            if (!docDate) return false;
            if (formattedStart && docDate < formattedStart) return false;
            if (formattedEnd && docDate > formattedEnd) return false;
            return true;
        });
    }

    // مرتب‌سازی
    const sorted = filtered.sort((a, b) => {
        const dateA = new Date(a.document?.doc_date || 0);
        const dateB = new Date(b.document?.doc_date || 0);
        if (dateA < dateB) return -1;
        if (dateA > dateB) return 1;
        return (a.document?.id || 0) - (b.document?.id || 0);
    });

    // محاسبه مانده تجمعی
    let runningBalance = 0;
    return sorted.map(entry => {
        runningBalance += (Number(entry.bed) || 0) - (Number(entry.bes) || 0);
        return {
            ...entry,
            runningBalance,
            // ✅ نمایش منبع (بانک یا POS)
            source: entry.tafsili?.title || '-'
        };
    });
};

// ==========================================
// 10. دریافت لیست تفصیلی‌های اشخاص
// ==========================================
export const getPeopleTafsilis = async () => {
    const { data, error } = await supabase
        .from('accounting_tafsili')
        .select('id, code, title')
        .eq('tafsili_type', 'customer')
        .eq('is_active', true)
        .order('code');

    if (error) throw error;
    return data || [];
};