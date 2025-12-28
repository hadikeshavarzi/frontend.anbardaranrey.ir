import { supabase } from "../helpers/supabase";

// ============================================================
// 1. توابع کمکی و زیرساختی (Helpers - Internal)
// ============================================================

/**
 * تولید کد بعدی (برای شماره سند و کد تفصیلی)
 */
export const generateNextCode = async (type, subtype = null) => {
    try {
        const { data, error } = await supabase.rpc('generate_next_code', {
            p_type: type,
            p_subtype: subtype
        });
        if (error) throw error;
        return data;
    } catch (err) {
        return Math.floor(100000 + Math.random() * 900000);
    }
};

/**
 * دریافت آیدی معین بر اساس کد کل
 */
const getMoeinIdByCode = async (code) => {
    const { data } = await supabase
        .from('accounting_moein')
        .select('id')
        .eq('code', code)
        .maybeSingle();
    return data ? data.id : null;
};

/**
 * یافتن آیدی تفصیلی بر اساس رفرنس (مثلاً آیدی مشتری)
 */
export const findTafsiliByRefId = async (refId) => {
    const { data } = await supabase
        .from('accounting_tafsili')
        .select('id')
        .eq('ref_id', refId)
        .maybeSingle();
    return data ? data.id : null;
};

/**
 * ⭐️ تابع اصلی ثبت سند حسابداری (هدر + آرتیکل‌ها)
 */
export const createManualDocument = async (headerData, entries) => {
    // 1. ثبت هدر سند
    const { data: doc, error: docError } = await supabase
        .from('financial_documents')
        .insert({
            doc_date: headerData.doc_date,
            doc_type: headerData.doc_type || 'system',
            status: 'confirmed',
            manual_no: headerData.manual_no || '',
            description: headerData.description,
            reference_id: headerData.reference_id,
            reference_type: headerData.reference_type
        })
        .select()
        .single();

    if (docError) {
        throw docError;
    }

    // 2. آماده‌سازی آرتیکل‌ها
    const formattedEntries = entries.map(entry => ({
        doc_id: doc.id,
        moein_id: entry.moein_id,
        tafsili_id: entry.tafsili_id,
        description: entry.description,
        bed: entry.bed,
        bes: entry.bes
    }));

    // 3. ثبت آرتیکل‌ها
    const { error: entryError } = await supabase
        .from('financial_entries')
        .insert(formattedEntries);

    if (entryError) {
        // رول‌بک دستی
        await supabase.from('financial_documents').delete().eq('id', doc.id);
        throw entryError;
    }

    return doc;
};

// ============================================================
// 2. اطلاعات پایه (بانک‌های مرجع)
// ============================================================

export const getBaseBanks = async () => {
    const { data, error } = await supabase.from('base_banks').select('*').order('id', { ascending: true });
    if (error) throw error;
    return data;
};

// ============================================================
// 3. مدیریت بانک‌ها (Banks CRUD)
// ============================================================

export const getBanks = async () => {
    const { data, error } = await supabase
        .from('treasury_banks')
        .select('*, accounting_tafsili(id, code, title)')
        .order('id', { ascending: false });
    if (error) throw error;
    return data;
};

export const createBank = async (bankData) => {
    const tafsiliTitle = `${bankData.bank_name} - ${bankData.account_no}`;
    const code = await generateNextCode('tafsili', 'bank_account');

    const { data: tafsili, error: tErr } = await supabase.from('accounting_tafsili')
        .insert({ title: tafsiliTitle, code: code, tafsili_type: 'bank_account', ref_id: -1, is_active: true })
        .select().single();
    if (tErr) throw tErr;

    const { data: bank, error: bErr } = await supabase.from('treasury_banks')
        .insert({ ...bankData, tafsili_id: tafsili.id }).select().single();

    if (bErr) {
        await supabase.from('accounting_tafsili').delete().eq('id', tafsili.id);
        throw bErr;
    }
    await supabase.from('accounting_tafsili').update({ ref_id: bank.id }).eq('id', tafsili.id);
    return bank;
};

export const updateBank = async (id, bankData) => {
    const { data: bank, error } = await supabase.from('treasury_banks')
        .update({
            bank_name: bankData.bank_name,
            branch_name: bankData.branch_name,
            account_no: bankData.account_no,
            card_no: bankData.card_no,
            sheba_no: bankData.sheba_no
        })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;

    if (bank.tafsili_id) {
        const newTitle = `${bank.bank_name} - ${bank.account_no}`;
        await supabase.from('accounting_tafsili').update({ title: newTitle }).eq('id', bank.tafsili_id);
    }
    return bank;
};

export const deleteBank = async (id) => {
    const { error } = await supabase.from('treasury_banks').delete().eq('id', id);
    if (error) throw error;
};

// ============================================================
// 4. مدیریت صندوق‌ها (Cashes CRUD)
// ============================================================

export const getCashes = async () => {
    const { data, error } = await supabase
        .from('treasury_cashes')
        .select('*, accounting_tafsili(id, code, title)')
        .order('id', { ascending: false });
    if (error) throw error;
    return data;
};

export const createCash = async (cashData) => {
    const code = await generateNextCode('tafsili', 'cash');
    const { data: tafsili, error: tErr } = await supabase.from('accounting_tafsili')
        .insert({ title: cashData.title, code: code, tafsili_type: 'cash', ref_id: -1, is_active: true })
        .select().single();
    if (tErr) throw tErr;

    const { data: cash, error: cErr } = await supabase.from('treasury_cashes')
        .insert({ ...cashData, tafsili_id: tafsili.id }).select().single();

    if (cErr) {
        await supabase.from('accounting_tafsili').delete().eq('id', tafsili.id);
        throw cErr;
    }
    await supabase.from('accounting_tafsili').update({ ref_id: cash.id }).eq('id', tafsili.id);
    return cash;
};

export const updateCash = async (id, cashData) => {
    const { data: cash, error } = await supabase.from('treasury_cashes')
        .update({ title: cashData.title, keeper_name: cashData.keeper_name })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;

    if (cash.tafsili_id) {
        await supabase.from('accounting_tafsili').update({ title: cashData.title }).eq('id', cash.tafsili_id);
    }
    return cash;
};

// ============================================================
// 5. مدیریت چک و دسته‌چک و POS
// ============================================================

export const getCheckbooks = async () => {
    const { data, error } = await supabase
        .from('treasury_checkbooks')
        .select('*, treasury_banks(bank_name, account_no)')
        .order('id', { ascending: false });
    if (error) throw error;
    return data;
};

export const createCheckbook = async (checkData) => {
    const { data, error } = await supabase.from('treasury_checkbooks').insert(checkData).select().single();
    if (error) throw error;
    return data;
};

export const getActiveCheckbooks = async () => {
    const { data, error } = await supabase
        .from('treasury_checkbooks')
        .select(`id, bank_id, serial_start, serial_end, current_serial, status, treasury_banks (id, bank_name, account_no, branch_name)`)
        .eq('status', 'active')
        .order('id', { ascending: false });
    if (error) throw error;
    return data;
};

export const getChecksInSafe = async () => {
    const { data, error } = await supabase
        .from('treasury_checks')
        .select(`*, owner:accounting_tafsili!owner_id(title)`)
        .eq('type', 'receive')
        .eq('status', 'pending');
    if (error) throw error;
    return data;
};

export const getPos = async () => {
    const { data, error } = await supabase
        .from('treasury_pos')
        .select('*, treasury_banks(bank_name, account_no), accounting_tafsili(id, code, title)')
        .order('id', { ascending: false });
    if (error) throw error;
    return data;
};

export const createPos = async (posData) => {
    const code = await generateNextCode('tafsili', 'bank_account');
    const { data: tafsili, error: tErr } = await supabase.from('accounting_tafsili')
        .insert({ title: posData.title, code: code, tafsili_type: 'bank_account', ref_id: 4, is_active: true }) // ref_id=4 برای معین POS
        .select().single();
    if (tErr) throw tErr;

    const { data: pos, error: pErr } = await supabase.from('treasury_pos')
        .insert({ ...posData, tafsili_id: tafsili.id }).select().single();
    if (pErr) {
        await supabase.from('accounting_tafsili').delete().eq('id', tafsili.id);
        throw pErr;
    }
    return pos;
};

// ============================================================
// 6. دریافت، پرداخت و صدور سند اتوماتیک (General Treasury)
// ============================================================

export const getPeopleTafsilis = async () => {
    const { data, error } = await supabase.from('accounting_tafsili')
        .select('id, code, title, tafsili_type')
        .not('tafsili_type', 'in', '("bank_account","cash")')
        .eq('is_active', true);
    if (error) throw error;
    return data;
};

export const saveTreasuryTransaction = async (formData) => {
    const MOEIN_CASH = await getMoeinIdByCode('10101');
    const MOEIN_BANK = await getMoeinIdByCode('10103');
    const MOEIN_POS = await getMoeinIdByCode('10104');
    const MOEIN_CHEQUE_REC = await getMoeinIdByCode('10302');
    const MOEIN_CHEQUE_PAY = await getMoeinIdByCode('30102');
    const MOEIN_PERSON = await getMoeinIdByCode('10301');
    const MOEIN_FEE = await getMoeinIdByCode('80205');

    if (!MOEIN_CASH || !MOEIN_BANK || !MOEIN_PERSON) {
        throw new Error("کدهای معین استاندارد یافت نشدند.");
    }

    let entries = [];
    const isReceive = formData.type === 'receive';
    let totalAmount = 0;

    // شماره دریافت/پرداخت اتوماتیک
    const transactionNo = await generateNextCode('treasury', isReceive ? 'receive' : 'payment');

    for (const item of formData.items) {
        const amount = Number(item.amount);
        if (amount <= 0) continue;
        totalAmount += amount;

        const fee = Number(item.fee) || 0;
        let moeinId, tafsiliId, desc = "";

        if (item.method === 'cash') {
            moeinId = MOEIN_CASH;
            const { data } = await supabase.from('treasury_cashes').select('tafsili_id').eq('id', item.ref_id).single();
            tafsiliId = data?.tafsili_id;
            desc = `نقد (صندوق)`;
        } else if (item.method === 'bank_transfer') {
            moeinId = MOEIN_BANK;
            const { data } = await supabase.from('treasury_banks').select('tafsili_id').eq('id', item.ref_id).single();
            tafsiliId = data?.tafsili_id;
            desc = `فیش/حواله - ${item.tracking_no || ''}`;

            // ثبت کارمزد
            if (fee > 0 && MOEIN_FEE) {
                entries.push({ moein_id: MOEIN_FEE, description: `کارمزد انتقال`, bed: fee, bes: 0 });
                entries.push({ moein_id: MOEIN_BANK, tafsili_id: tafsiliId, description: `کارمزد بانکی`, bed: 0, bes: fee });
            }
        } else if (item.method === 'pos') {
            moeinId = MOEIN_POS || MOEIN_BANK;
            const { data } = await supabase.from('treasury_pos').select('tafsili_id').eq('id', item.ref_id).single();
            tafsiliId = data?.tafsili_id;
            desc = `کارتخوان - ${item.tracking_no || ''}`;
        } else if (item.method === 'cheque') {
            if (isReceive) {
                moeinId = MOEIN_CHEQUE_REC;
                desc = `چک صیادی ${item.cheque_no}`;
                await supabase.from('treasury_checks').insert({
                    type: 'receive', amount, status: 'pending', owner_id: formData.person_id,
                    cheque_no: item.cheque_no, due_date: item.due_date, bank_name: item.bank_name,
                    sayadi_code: item.sayadi_code, branch_name: item.branch_name, account_holder: item.account_holder,
                    description: item.description, endorsement: item.endorsement
                });
            } else if (item.cheque_type === 'issue_ours') {
                moeinId = MOEIN_CHEQUE_PAY;
                desc = `صدور چک ${item.cheque_no}`;
                const { data: newCheck } = await supabase.from('treasury_checks').insert({
                    type: 'issue', amount, cheque_no: item.cheque_no, checkbook_id: item.checkbook_id,
                    due_date: item.due_date, receiver_id: formData.person_id, status: 'pending',
                    description: item.description
                }).select().single();

                if (item.checkbook_id && newCheck) {
                    await supabase.from('treasury_check_details').update({ status: 'used', check_id: newCheck.id })
                        .eq('checkbook_id', item.checkbook_id).eq('serial_no', item.cheque_no);
                }
            } else if (item.cheque_type === 'spend_customer') {
                moeinId = MOEIN_CHEQUE_REC;
                desc = `خرج چک ${item.cheque_no}`;
                await supabase.from('treasury_checks').update({ status: 'spent', receiver_id: formData.person_id }).eq('id', item.check_id);
            }
        }

        entries.push({
            moein_id: moeinId,
            tafsili_id: tafsiliId,
            description: desc,
            bed: isReceive ? amount : 0,
            bes: isReceive ? 0 : amount
        });
    }

    // طرف حساب (شخص)
    entries.push({
        moein_id: MOEIN_PERSON,
        tafsili_id: formData.person_id,
        description: formData.description || 'تسویه حساب',
        bed: isReceive ? 0 : totalAmount,
        bes: isReceive ? totalAmount : 0
    });

    return await createManualDocument({
        doc_date: formData.date,
        manual_no: formData.manual_no,
        description: `${isReceive ? 'دریافت' : 'پرداخت'} شماره ${transactionNo} - ${formData.description || ''}`
    }, entries);
};

// ============================================================
// 7. کارتابل عملیات چک (Lifecycle)
// ============================================================

export const performCheckOperation = async (opData) => {
    const { data: check } = await supabase.from('treasury_checks').select('*').eq('id', opData.checkId).single();
    if (!check) throw new Error("چک یافت نشد");

    const MOEIN_BANK = await getMoeinIdByCode('10103');
    const MOEIN_ASNAD_REC = await getMoeinIdByCode('10302');
    const MOEIN_ASNAD_COL = await getMoeinIdByCode('10303');
    const MOEIN_ASNAD_PAY = await getMoeinIdByCode('30102');
    const MOEIN_PERSON = await getMoeinIdByCode('10301');

    let entries = [], updateData = {}, docDesc = "";

    // چک‌های دریافتی
    if (check.type === 'receive') {
        if (opData.operation === 'deposit') {
            const { data: bank } = await supabase.from('treasury_banks').select('tafsili_id, bank_name').eq('id', opData.targetId).single();
            entries.push({ moein_id: MOEIN_ASNAD_REC, bed: 0, bes: check.amount, description: `خروج چک ${check.cheque_no}` });
            entries.push({ moein_id: MOEIN_ASNAD_COL, tafsili_id: bank.tafsili_id, bed: check.amount, bes: 0, description: `واگذاری به بانک ${bank.bank_name}` });
            updateData = { status: 'deposited', target_bank_id: opData.targetId };
            docDesc = `واگذاری چک ${check.cheque_no}`;
        } else if (opData.operation === 'clear') {
            const { data: bank } = await supabase.from('treasury_banks').select('tafsili_id').eq('id', opData.targetId).single();
            const sourceMoein = check.status === 'deposited' ? MOEIN_ASNAD_COL : MOEIN_ASNAD_REC;
            entries.push({ moein_id: sourceMoein, tafsili_id: bank.tafsili_id, bed: 0, bes: check.amount, description: `وصول چک ${check.cheque_no}` });
            entries.push({ moein_id: MOEIN_BANK, tafsili_id: bank.tafsili_id, bed: check.amount, bes: 0, description: `واریز به حساب` });
            updateData = { status: 'cleared' };
            docDesc = `وصول چک ${check.cheque_no}`;
        } else if (opData.operation === 'spend') {
            entries.push({ moein_id: MOEIN_ASNAD_REC, bed: 0, bes: check.amount, description: `خرج چک ${check.cheque_no}` });
            entries.push({ moein_id: MOEIN_PERSON, tafsili_id: opData.targetId, bed: check.amount, bes: 0, description: `واگذاری چک به شخص` });
            updateData = { status: 'spent', receiver_id: opData.targetId };
            docDesc = `خرج چک ${check.cheque_no}`;
        } else if (opData.operation === 'bounce') {
            const sourceMoein = check.status === 'deposited' ? MOEIN_ASNAD_COL : MOEIN_ASNAD_REC;
            entries.push({ moein_id: sourceMoein, bed: 0, bes: check.amount, description: `برگشت چک ${check.cheque_no}` });
            entries.push({ moein_id: MOEIN_PERSON, tafsili_id: check.owner_id, bed: check.amount, bes: 0, description: `برگشت چک مشتری` });
            updateData = { status: 'bounced' };
            docDesc = `برگشت چک ${check.cheque_no}`;
        }
    }
    // چک‌های پرداختی
    else if (check.type === 'issue') {
        if (opData.operation === 'clear') {
            const { data: book } = await supabase.from('treasury_checkbooks').select('bank_id').eq('id', check.checkbook_id).single();
            const { data: bank } = await supabase.from('treasury_banks').select('tafsili_id').eq('id', book.bank_id).single();
            entries.push({ moein_id: MOEIN_BANK, tafsili_id: bank.tafsili_id, bed: 0, bes: check.amount, description: `پاس شدن چک صادره ${check.cheque_no}` });
            entries.push({ moein_id: MOEIN_ASNAD_PAY, bed: check.amount, bes: 0, description: `وصول اسناد پرداختنی` });
            updateData = { status: 'cleared' };
            docDesc = `وصول چک صادره ${check.cheque_no}`;
        } else if (opData.operation === 'bounce') {
            const { data: book } = await supabase.from('treasury_checkbooks').select('bank_id').eq('id', check.checkbook_id).single();
            const { data: bank } = await supabase.from('treasury_banks').select('tafsili_id').eq('id', book.bank_id).single();
            entries.push({ moein_id: MOEIN_ASNAD_PAY, bed: 0, bes: check.amount, description: `برگشت چک صادره ${check.cheque_no}` });
            entries.push({ moein_id: MOEIN_BANK, tafsili_id: bank.tafsili_id, bed: check.amount, bes: 0, description: `برگشت از حساب بانک` });
            updateData = { status: 'bounced' };
            docDesc = `برگشت چک صادره ${check.cheque_no}`;
        }
    }

    if (entries.length > 0) {
        await createManualDocument({
            doc_date: opData.date,
            manual_no: "",
            description: docDesc
        }, entries);
    }
    await supabase.from('treasury_checks').update(updateData).eq('id', opData.checkId);
};

// ============================================================
// 8. لیست و مدیریت اسناد (List, Delete, Update)
// ============================================================

export const getTreasuryDocuments = async () => {
    const { data, error } = await supabase
        .from('financial_documents')
        .select(`id, doc_date, description, manual_no, created_at, financial_entries ( bed, bes )`)
        .or('description.ilike.%دریافت%,description.ilike.%پرداخت%,description.ilike.%چک%,description.ilike.%رسید%')
        .order('id', { ascending: false });

    if (error) throw error;

    return data?.map(doc => {
        const total = doc.financial_entries?.reduce((sum, e) => sum + (Number(e.bed) || 0), 0) || 0;
        return { ...doc, total_amount: total };
    }) || [];
};

export const deleteTreasuryDocument = async (id) => {
    await supabase.from('financial_entries').delete().eq('doc_id', id);
    await supabase.from('financial_documents').delete().eq('id', id);
};

export const updateTreasuryDocument = async (id, updates) => {
    const { error } = await supabase
        .from('financial_documents')
        .update({
            doc_date: updates.date,
            description: updates.description,
            manual_no: updates.manual_no
        })
        .eq('id', id);
    if (error) throw error;
};

// ============================================================
// 9. ✅ ثبت سند رسید انبار (سند مرکب: درآمدها + پرداخت)
// ============================================================

export const registerReceiptFinancialDoc = async ({
                                                      costs,           // آبجکت شامل ریز هزینه‌ها
                                                      paymentAmount,   // مبلغی که از بانک/صندوق پرداخت شده (پس‌کرایه)
                                                      date,
                                                      customerId,
                                                      sourceId,
                                                      receiptId,
                                                      receiptNo,
                                                      description
                                                  }) => {

    // 1. دریافت آیدی معین‌های مورد نیاز (بر اساس دیتابیس شما)
    const MOEIN_CUSTOMER = await getMoeinIdByCode('10301'); // حساب‌های دریافتنی (مشتریان)

    const MOEIN_INCOME_WAREHOUSE = await getMoeinIdByCode('60101'); // درآمد انبارداری
    const MOEIN_INCOME_LOAD_UNLOAD = await getMoeinIdByCode('60102'); // درآمد تخلیه و بارگیری
    const MOEIN_INCOME_BASKOL = await getMoeinIdByCode('60103'); // درآمد باسکول
    const MOEIN_INCOME_OTHER = await getMoeinIdByCode('60104'); // سایر درآمدهای عملیاتی

    // تشخیص نوع منبع (بانک یا صندوق)
    let MOEIN_BANK_CASH = await getMoeinIdByCode('10101'); // پیش‌فرض صندوق (10101)
    if (sourceId) {
        const { data: sourceTafsili } = await supabase
            .from('accounting_tafsili')
            .select('tafsili_type')
            .eq('id', sourceId)
            .single();
        if (sourceTafsili?.tafsili_type === 'bank_account') {
            MOEIN_BANK_CASH = await getMoeinIdByCode('10103'); // بانک (10103)
        }
    }

    if (!MOEIN_CUSTOMER) throw new Error("کد معین مشتری (10301) یافت نشد.");

    // 2. محاسبه جمع کل بدهی مشتری
    const totalIncome =
        (Number(costs.loadCost) || 0) +
        (Number(costs.unloadCost) || 0) +
        (Number(costs.warehouseCost) || 0) +
        (Number(costs.loadingFee) || 0) +
        (Number(costs.miscCost) || 0) +
        (Number(costs.tax) || 0);

    const totalDebt = totalIncome + (Number(paymentAmount) || 0);

    if (totalDebt === 0) return; // سندی با مبلغ صفر ثبت نکن

    // 3. ساخت آرتیکل‌ها (Entries)
    const entries = [];

    // --- الف) طرف بدهکار: مشتری (کل مبلغ) ---
    entries.push({
        moein_id: MOEIN_CUSTOMER,
        tafsili_id: customerId,
        description: description || `هزینه‌های رسید انبار ${receiptNo}`,
        bed: totalDebt,
        bes: 0
    });

    // --- ب) طرف بستانکار: درآمدها (تفکیک شده طبق کدهای شما) ---

    // 1. درآمد بارگیری و تخلیه (کد 60102)
    const loadUnloadTotal = (Number(costs.loadCost) || 0) + (Number(costs.unloadCost) || 0);
    if (loadUnloadTotal > 0) {
        entries.push({
            moein_id: MOEIN_INCOME_LOAD_UNLOAD || MOEIN_INCOME_OTHER,
            description: `درآمد تخلیه و بارگیری - رسید ${receiptNo}`,
            bed: 0,
            bes: loadUnloadTotal
        });
    }

    // 2. درآمد انبارداری (کد 60101)
    if (Number(costs.warehouseCost) > 0) {
        entries.push({
            moein_id: MOEIN_INCOME_WAREHOUSE || MOEIN_INCOME_OTHER,
            description: `درآمد انبارداری - رسید ${receiptNo}`,
            bed: 0,
            bes: Number(costs.warehouseCost)
        });
    }

    // 3. درآمد بارچینی (چون کد اختصاصی نداشت، میزنیم به سایر 60104 یا تخلیه بارگیری)
    if (Number(costs.loadingFee) > 0) {
        entries.push({
            moein_id: MOEIN_INCOME_OTHER,
            description: `درآمد بارچینی - رسید ${receiptNo}`,
            bed: 0,
            bes: Number(costs.loadingFee)
        });
    }

    // 4. سایر درآمدها و مالیات (کد 60104)
    const otherIncomes = (Number(costs.miscCost) || 0) + (Number(costs.tax) || 0);
    if (otherIncomes > 0) {
        entries.push({
            moein_id: MOEIN_INCOME_OTHER,
            description: `سایر خدمات/متفرقه - رسید ${receiptNo}`,
            bed: 0,
            bes: otherIncomes
        });
    }

    // --- ج) طرف بستانکار: بانک/صندوق (بابت پس‌کرایه) ---
    if (Number(paymentAmount) > 0) {
        if (!sourceId) throw new Error("منبع پرداخت (بانک/صندوق) انتخاب نشده است.");

        entries.push({
            moein_id: MOEIN_BANK_CASH,
            tafsili_id: sourceId,
            description: `پرداخت پس‌کرایه/هزینه جانبی رسید ${receiptNo}`,
            bed: 0,
            bes: Number(paymentAmount)
        });
    }

    // 4. ثبت نهایی سند
    return await createManualDocument({
        doc_date: date,
        manual_no: "",
        description: `سند خدمات و هزینه‌های رسید انبار ${receiptNo}`,
        reference_id: receiptId,
        reference_type: 'receipt'
    }, entries);
};

// ============================================================
// 10. ✅ ثبت سند حسابداری خروج کالا (با پشتیبانی POS و صندوق)
// ============================================================

/**
 * ثبت سند حسابداری برای حواله خروج
 * این تابع از RPC دیتابیس استفاده می‌کند
 * @param {number} exitId - شناسه یکتای جدول warehouse_exits
 */
export const registerExitDoc = async (exitId) => {
    try {

        // ✅ ارسال به RPC دیتابیس
        const { data, error } = await supabase.rpc('register_exit_financial_doc', {
            p_payload: { exit_id: exitId }
        });

        if (error) {
            throw error;
        }

        return data;
    } catch (err) {
        throw err;
    }
};

// ============================================================
// 11. توابع کمکی برای فرم خروج
// ============================================================

/**
 * دریافت لیست دستگاه‌های POS (با بانک متصل)
 */
export const getPosDevicesForExit = async () => {
    const { data, error } = await supabase
        .from('treasury_pos')
        .select(`
            id, 
            title, 
            terminal_id,
            treasury_banks (id, bank_name, account_no),
            accounting_tafsili (id, code, title)
        `)
        .order('id', { ascending: false });

    if (error) throw error;

    // تبدیل به فرمت مناسب برای dropdown
    return (data || []).map(pos => ({
        id: pos.accounting_tafsili?.id, // آی‌دی تفصیلی (برای ثبت در سند)
        title: pos.title || `${pos.treasury_banks?.bank_name} - پایانه ${pos.terminal_id}`,
        code: pos.accounting_tafsili?.code,
        pos_id: pos.id,
        bank_name: pos.treasury_banks?.bank_name,
        terminal_id: pos.terminal_id
    })).filter(p => p.id); // فقط اونایی که تفصیلی دارن
};

/**
 * دریافت لیست صندوق‌ها
 */
export const getCashRegistersForExit = async () => {
    const { data, error } = await supabase
        .from('treasury_cashes')
        .select(`
            id, 
            title, 
            keeper_name,
            accounting_tafsili (id, code, title)
        `)
        .order('id', { ascending: false });

    if (error) throw error;

    // تبدیل به فرمت مناسب برای dropdown
    return (data || []).map(cash => ({
        id: cash.accounting_tafsili?.id, // آی‌دی تفصیلی (برای ثبت در سند)
        title: cash.title,
        code: cash.accounting_tafsili?.code,
        cash_id: cash.id,
        keeper_name: cash.keeper_name
    })).filter(c => c.id); // فقط اونایی که تفصیلی دارن
};

/**
 * دریافت مانده حساب مشتری
 * @param {number} customerId - شناسه مشتری (از جدول customers)
 */
export const getCustomerBalance = async (customerId) => {
    try {
        // پیدا کردن تفصیلی مشتری
        const { data: tafsili } = await supabase
            .from('accounting_tafsili')
            .select('id')
            .eq('tafsili_type', 'customer')
            .eq('ref_id', customerId)
            .maybeSingle();

        if (!tafsili) return { balance: 0, type: 'neutral' };

        // محاسبه مانده از آرتیکل‌ها
        const { data: articles } = await supabase
            .from('financial_entries')
            .select('bed, bes')
            .eq('tafsili_id', tafsili.id);

        if (!articles || articles.length === 0) return { balance: 0, type: 'neutral' };

        const totalBed = articles.reduce((sum, a) => sum + (Number(a.bed) || 0), 0);
        const totalBes = articles.reduce((sum, a) => sum + (Number(a.bes) || 0), 0);
        const balance = totalBed - totalBes;

        return {
            balance: Math.abs(balance),
            type: balance > 0 ? 'debtor' : balance < 0 ? 'creditor' : 'neutral',
            formatted: Math.abs(balance).toLocaleString('fa-IR') + ' ریال'
        };
    } catch (err) {
        return { balance: 0, type: 'neutral' };
    }
};

/**
 * دریافت گردش حساب مشتری
 * @param {number} customerId - شناسه مشتری
 */
export const getCustomerLedger = async (customerId) => {
    try {
        // پیدا کردن تفصیلی مشتری
        const { data: tafsili } = await supabase
            .from('accounting_tafsili')
            .select('id, title')
            .eq('tafsili_type', 'customer')
            .eq('ref_id', customerId)
            .maybeSingle();

        if (!tafsili) return { entries: [], balance: 0 };

        // دریافت آرتیکل‌ها با اطلاعات سند
        const { data: entries, error } = await supabase
            .from('financial_entries')
            .select(`
                id, bed, bes, description,
                financial_documents (id, doc_date, description)
            `)
            .eq('tafsili_id', tafsili.id)
            .order('id', { ascending: true });

        if (error) throw error;

        // محاسبه مانده تجمیعی
        let runningBalance = 0;
        const ledgerEntries = (entries || []).map(entry => {
            runningBalance += (Number(entry.bed) || 0) - (Number(entry.bes) || 0);
            return {
                ...entry,
                doc_date: entry.financial_documents?.doc_date,
                doc_description: entry.financial_documents?.description,
                running_balance: runningBalance
            };
        });

        return {
            tafsili_title: tafsili.title,
            entries: ledgerEntries,
            final_balance: runningBalance,
            balance_type: runningBalance > 0 ? 'بدهکار' : runningBalance < 0 ? 'بستانکار' : 'تسویه'
        };
    } catch (err) {
        throw err;
    }
};