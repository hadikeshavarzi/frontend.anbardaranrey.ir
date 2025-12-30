import { supabase } from "../helpers/supabase";

/**
 * سرویس جامع مدیریت قراردادهای اجاره انبار
 * شامل: CRUD قرارداد، مدیریت فایل، محاسبات مالی و ثابت‌ها
 */

// ==================== 1. دریافت اطلاعات پایه ====================

/**
 * دریافت لیست مشتریان برای فرم اجاره
 * نکته فنی: اطلاعات (نام و موبایل) را از جدول customers می‌خوانیم چون جدول حسابداری موبایل ندارد.
 * اما ID بازگشتی را برابر tafsili_id قرار می‌دهیم تا سند حسابداری روی کد تفصیلی بخورد.
 */
export const getRentalCustomers = async () => {
    try {
        const { data, error } = await supabase
            .from('customers')
            .select('id, name, mobile, tafsili_id')
            .not('tafsili_id', 'is', null) // فقط مشتریانی که به حسابداری وصل هستند
            .order('name');

        if (error) throw error;

        return data.map(c => ({
            id: c.tafsili_id, // ⚠️ شناسه اصلی برای سیستم (تفصیلی)
            title: c.name,
            mobile: c.mobile,
            original_customer_id: c.id
        }));
    } catch (err) {
        console.error("Error fetching rental customers:", err);
        return [];
    }
};

// ==================== 2. عملیات اصلی قرارداد (CRUD) ====================

/**
 * ثبت قرارداد جدید (موقت یا دائم)
 * @param {Object} rentalData - داده‌های فرم
 */
export const createRental = async (rentalData) => {
    try {
        const status = rentalData.is_verified ? 'active' : 'draft';

        const { data, error } = await supabase
            .from('warehouse_rentals')
            .insert([{
                customer_id: rentalData.customer_id,
                start_date: rentalData.start_date,
                monthly_rent: Number(rentalData.monthly_rent) || 0,
                location_name: rentalData.location_name,
                rental_type: rentalData.rental_type,
                rental_details: rentalData.rental_details,
                description: rentalData.description,
                notification_config: rentalData.notification_config,
                billing_cycle: rentalData.billing_cycle,
                contract_file_url: rentalData.contract_file_url,
                status: status,
                // اگر فعال شد، تاریخ شروع به عنوان مبنای محاسبه بعدی ست می‌شود
                // اگر پیش‌نویس باشد، نال است
                last_invoiced_at: null,
                created_at: new Date().toISOString()
            }])
            .select()
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (err) {
        console.error("Create Rental Error:", err);
        return { success: false, error: err.message };
    }
};

/**
 * دریافت لیست قراردادها
 */
export const getRentals = async (filters = {}) => {
    try {
        // نکته: در اینجا موبایل را درخواست نمی‌کنیم تا ارور ندهد
        let query = supabase
            .from('warehouse_rentals')
            .select(`
                *,
                customer:accounting_tafsili(id, title)
            `)
            .order('created_at', { ascending: false });

        if (filters.status) query = query.eq('status', filters.status);
        if (filters.customerId) query = query.eq('customer_id', filters.customerId);

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    } catch (err) {
        console.error("Error fetching rentals:", err);
        return [];
    }
};

/**
 * ویرایش اطلاعات قرارداد
 */
export const updateRental = async (id, updates) => {
    try {
        const { error } = await supabase
            .from('warehouse_rentals')
            .update(updates)
            .eq('id', id);

        if (error) throw error;
        return { success: true };
    } catch (err) {
        return { success: false, error: err.message };
    }
};

/**
 * حذف کامل قرارداد
 */
export const deleteRental = async (id) => {
    try {
        const { error } = await supabase
            .from('warehouse_rentals')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return { success: true };
    } catch (err) {
        return { success: false, error: err.message };
    }
};

// ==================== 3. منطق محاسبات و فسخ ====================

/**
 * محاسبه مبلغ بدهی از آخرین سند تا تاریخ فسخ (روزشمار)
 */
/**
 * محاسبه مبلغ بدهی از آخرین سند تا تاریخ فسخ (روزشمار)
 */
export const calculateTerminationAmount = (rental, terminationDate) => {
    if (!rental || !terminationDate) return 0;

    // مبدا محاسبه: یا تاریخ آخرین سند، یا اگر سند نخورده، تاریخ شروع قرارداد
    const startDateStr = rental.last_invoiced_at || rental.start_date;

    // ۱. تبدیل تاریخ‌ها به آبجکت Date
    const start = new Date(startDateStr);
    const end = new Date(terminationDate);

    // ۲. صفر کردن ساعت‌ها برای مقایسه خالص روزها (مهم برای حل مشکل تایم‌زون)
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    // اگر تاریخ پایان قبل از شروع باشد، مبلغ صفر است
    if (end < start) return 0;

    // ۳. محاسبه اختلاف زمانی
    const diffTime = end.getTime() - start.getTime();

    // ۴. تبدیل میلی‌ثانیه به روز
    let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // ۵. اگر همان روز فسخ شده (اختلاف صفر)، حداقل ۱ روز محاسبه شود
    if (diffDays === 0) {
        diffDays = 1;
    }

    // فرمول: (اجاره ماهانه / ۳۰) * تعداد روز
    const dailyRent = (Number(rental.monthly_rent) || 0) / 30;

    return Math.floor(diffDays * dailyRent);
};
/**
 * فسخ نهایی قرارداد + صدور سند حسابداری (اختیاری)
 */
/**
 * فسخ نهایی قرارداد + صدور سند حسابداری
 */
/**
 * فسخ نهایی قرارداد + صدور سند حسابداری
 */
export const terminateRental = async (rentalId, terminationData) => {
    const {
        endDate,
        shouldGenerateInvoice,
        amount,
        customerId,
        description,      // شرح کلی سند (هدر)
        debitDescription, // ✅ شرح اختصاصی ردیف بدهکار
        creditDescription // ✅ شرح اختصاصی ردیف بستانکار (درآمد)
    } = terminationData;

    console.log("🚀 Starting Termination Process...", { rentalId, amount });

    try {
        // مرحله ۱: صدور سند (اگر تیک خورده باشد و مبلغ > 0)
        if (shouldGenerateInvoice && amount > 0) {

            // الف) ایجاد هدر سند (شماره سند خودکار توسط دیتابیس پر می‌شود)
            const { data: docData, error: docError } = await supabase
                .from('financial_documents')
                .insert([{
                    doc_date: endDate,
                    description: description || `سند تسویه نهایی قرارداد #${rentalId}`,
                    status: 'confirmed'
                }])
                .select()
                .single();

            if (docError) {
                console.error("❌ Doc Header Error:", docError);
                throw new Error("خطا در ساخت هدر سند: " + docError.message);
            }

            // ب) ایجاد ردیف‌های سند
            const entries = [
                // ردیف ۱: بدهکار (مشتری)
                {
                    doc_id: docData.id,
                    moein_id: 5,        // حساب‌های دریافتنی
                    tafsili_id: customerId,
                    bed: amount,
                    bes: 0,
                    // ✅ استفاده از شرح تولید شده در فرانت
                    description: debitDescription || 'بدهکار بابت تسویه اجاره انبار'
                },
                // ردیف ۲: بستانکار (درآمد)
                {
                    doc_id: docData.id,
                    moein_id: 10,       // درآمد انبارداری
                    tafsili_id: null,
                    bed: 0,
                    bes: amount,
                    // ✅ استفاده از شرح تولید شده در فرانت
                    description: creditDescription || 'بستانکار بابت درآمد اجاره'
                }
            ];

            const { error: entryError } = await supabase
                .from('financial_entries')
                .insert(entries);

            if (entryError) {
                console.error("❌ Doc Entries Error:", entryError);
                await supabase.from('financial_documents').delete().eq('id', docData.id);
                throw new Error("خطا در ثبت ردیف‌های سند: " + entryError.message);
            }
            console.log("✅ Entries Created Successfully.");
        }

        // مرحله ۲: آپدیت وضعیت قرارداد
        const { error: updateError } = await supabase
            .from('warehouse_rentals')
            .update({
                status: 'terminated',
                end_date: endDate,
                last_invoiced_at: shouldGenerateInvoice ? endDate : undefined
            })
            .eq('id', rentalId);

        if (updateError) throw updateError;

        return { success: true };

    } catch (err) {
        console.error("🔥 Termination Error:", err);
        return { success: false, error: err.message };
    }
};

const BUCKET_NAME = 'documents';

export const uploadContractFile = async (file) => {
    try {
        if (!file) throw new Error("فایلی انتخاب نشده است");
        const fileExt = file.name.split('.').pop();
        const fileName = `contracts/${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

        const { error } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(fileName, file, { upsert: false });

        if (error) throw error;
        return { success: true, path: fileName };
    } catch (err) {
        return { success: false, error: err.message };
    }
};

export const getContractUrl = (path) => {
    if (!path) return null;
    const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);
    return data.publicUrl;
};

// ==================== 5. ثابت‌های سیستم ====================

export const RENTAL_OPTIONS = {
    types: [
        { value: 'shed', label: 'سوله' },
        { value: 'open', label: 'محوطه باز' },
        { value: 'container', label: 'کانتینر' },
        { value: 'room', label: 'اتاق / دفتر' },
        { value: 'covered', label: 'محل مسقف' }
    ],
    billingCycles: [
        { value: 'monthly', label: 'ماهانه' },
        { value: 'quarterly', label: 'فصلی (۳ ماه)' },
        { value: '6month', label: 'شش ماهه' },
        { value: 'yearly', label: 'سالانه' }
    ],
    notifications: [
        { value: 'monthly', label: 'ماهانه' },
        { value: '3month', label: '۳ ماهه' },
        { value: '6month', label: '۶ ماهه' },
        { value: 'yearly', label: 'سالانه' }
    ]
};