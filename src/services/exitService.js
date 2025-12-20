import { supabase } from "../helpers/supabase";

// --- تابع کمکی: دریافت تاریخ‌های ورود بر اساس کالا ---
// این تابع در هر دو بخش (فرم و پرینت) استفاده می‌شود تا تاریخ‌ها همیشه درست باشند
const fetchProductEntryDates = async (items) => {
    const productIds = items.map(item => {
        // هندل کردن ساختار متفاوت در فرم اصلی و پرینت
        if (item.product_id) return item.product_id; // ساختار مستقیم
        const prod = item.loading_order_items?.products || item.products;
        return prod?.id;
    }).filter(Boolean);

    // حذف تکراری‌ها
    const uniqueIds = [...new Set(productIds)];
    const productReceiptDates = {};

    if (uniqueIds.length > 0) {
        const { data: receiptData } = await supabase.from("receipt_items")
            .select(`product_id, receipts ( doc_date )`)
            .in("product_id", uniqueIds)
            .order("created_at", { ascending: false }); // جدیدترین رسید

        if (receiptData) {
            receiptData.forEach(r => {
                // اگر برای این محصول هنوز تاریخی ست نشده، اولین (جدیدترین) را بردار
                if (!productReceiptDates[r.product_id]) {
                    productReceiptDates[r.product_id] = r.receipts?.doc_date;
                }
            });
        }
    }
    return productReceiptDates;
};

// --- 1. جستجو و آماده‌سازی داده‌ها (فرم اصلی) ---
export const findExitOrLoadingOrder = async (searchNo) => {
    if (!searchNo) throw new Error("شماره وارد نشده است.");

    let exitRecord = null;
    let loadingOrderRecord = null;

    // تعریف زیر-کوئری‌ها برای تمیزی کد
    const itemsSelectQuery = `
        batch_no, qty,
        products ( 
            id, name, national_title,
            effective_storage_cost, effective_loading_cost,
            product_categories!fk_prod_to_cat ( fee_type )
        ),
        clearance_items ( weight, created_at )
    `;

    const fullExitQuery = `
        *,
        loading_orders!inner ( id, order_no, driver_name, plate_number, clearances ( customers ( name ) ) ),
        warehouse_exit_items ( *, loading_order_items ( ${itemsSelectQuery} ) )
    `;

    // 1. جستجو در Loading Orders (سند جدید)
    const { data: loadingOrder } = await supabase.from("loading_orders")
        .select("id, order_no").eq("order_no", searchNo).maybeSingle();

    if (loadingOrder) {
        // چک کن آیا برای این بارگیری قبلاً خروج ثبت شده؟
        const { data: exitByLoad } = await supabase.from("warehouse_exits")
            .select(fullExitQuery).eq("loading_order_id", loadingOrder.id).maybeSingle();

        if (exitByLoad) exitRecord = exitByLoad;
        else loadingOrderRecord = loadingOrder;
    }

    // 2. جستجو مستقیم با ID خروج (ویرایش/مشاهده)
    if (!exitRecord && !loadingOrderRecord && !isNaN(searchNo)) {
        const { data: exitById } = await supabase.from("warehouse_exits")
            .select(fullExitQuery).eq("id", searchNo).maybeSingle();
        if (exitById) exitRecord = exitById;
    }

    if (!exitRecord && !loadingOrderRecord) throw new Error("سندی یافت نشد.");

    // --- تعیین لیست آیتم‌ها ---
    let targetItems = [];
    if (exitRecord) {
        targetItems = exitRecord.warehouse_exit_items;
    } else {
        // اگر سند جدید است، آیتم‌های لودینگ را فچ کن
        const { data: loadItems } = await supabase.from("loading_order_items")
            .select(`*, loading_orders!inner(id), products(id, name, effective_storage_cost, effective_loading_cost, product_categories!fk_prod_to_cat(fee_type)), clearance_items(weight, created_at)`)
            .eq("loading_order_id", loadingOrderRecord.id);
        targetItems = loadItems || [];
    }

    // --- دریافت تاریخ‌ها (با تابع کمکی) ---
    const productReceiptDates = await fetchProductEntryDates(targetItems);

    // --- تابع مپ کردن ---
    const mapItems = (sourceItems, isNew = false) => {
        return sourceItems.map(item => {
            const ref = isNew ? item : item.loading_order_items;
            if (!ref) return { item_id: null, product_name: "نامشخص" };

            const product = ref.products;
            const clearance = ref.clearance_items;

            // اولویت تاریخ: 1. رسید 2. کلیرانس 3. امروز
            const entryDate = productReceiptDates[product?.id] || clearance?.created_at || new Date().toISOString();

            const wFull = isNew ? 0 : (item.weight_full || 0);
            const wEmpty = isNew ? 0 : (item.weight_empty || 0);
            const wNet = (wFull >= wEmpty) ? (wFull - wEmpty) : 0;
            const feeType = product?.product_categories?.fee_type || 'weight';

            // اگر آیتم خروج است، qty خودش را دارد، اگر نه از لودینگ بگیر
            const qty = isNew ? (ref.qty || 0) : (item.qty || ref.qty || 0);
            const calcBase = feeType === 'quantity' ? Number(qty) : wNet;

            const sRate = Number(product?.effective_storage_cost) || 0;
            const lRate = Number(product?.effective_loading_cost) || 0;

            return {
                item_id: isNew ? item.id : item.loading_item_id,
                product_name: product?.name || "نامشخص",
                batch_no: ref.batch_no,
                qty: qty,
                entry_date: entryDate, // تاریخ محاسبه شده
                fee_type: feeType,
                base_storage_rate: sRate,
                base_loading_rate: lRate,
                cleared_weight: clearance?.weight || 0,
                weight_full: wFull,
                weight_empty: wEmpty,
                weight_net: wNet,
                row_storage_fee: isNew ? (calcBase * sRate) : (Number(item.final_fee) || 0),
                row_loading_fee: isNew ? (calcBase * lRate) : (Number(item.loading_fee) || 0),
            };
        });
    };

    if (exitRecord) {
        return {
            source: 'exit_record', is_processed: true, status: exitRecord.status,
            exit_id: exitRecord.id, loading_id: exitRecord.loading_order_id,
            order_no: exitRecord.loading_orders?.order_no,
            driver_name: exitRecord.loading_orders?.driver_name,
            plate_number: exitRecord.loading_orders?.plate_number,
            customer_name: exitRecord.loading_orders?.clearances?.customers?.name,
            driver_national_code: exitRecord.driver_national_code,
            weighbridge_fee: exitRecord.weighbridge_fee, extra_fee: exitRecord.extra_fee,
            extra_description: exitRecord.extra_description, payment_method: exitRecord.payment_method,
            reference_no: exitRecord.reference_no,
            exit_date: exitRecord.exit_date,
            items: mapItems(exitRecord.warehouse_exit_items, false)
        };
    } else {
        const info = targetItems[0];
        return {
            source: 'loading_order', is_processed: false,
            loading_id: info.loading_orders.id, order_no: info.loading_orders.order_no,
            driver_name: info.loading_orders.driver_name, plate_number: info.loading_orders.plate_number,
            customer_name: info.loading_orders.clearances?.customers?.name,
            items: mapItems(targetItems, true)
        };
    }
};

// --- 2. ثبت اطلاعات ---
export const createExitPermit = async (payload) => {
    const { data: header, error: headErr } = await supabase.from("warehouse_exits").insert({
        loading_order_id: payload.loading_order_id,
        exit_date: payload.exit_date,
        reference_no: payload.reference_no,
        driver_national_code: payload.driver_national_code,
        weighbridge_fee: payload.weighbridge_fee,
        extra_fee: payload.extra_fee,
        extra_description: payload.extra_description,
        vat_fee: payload.vat_fee,
        total_fee: payload.total_fee,
        total_loading_fee: payload.total_loading_fee,
        payment_method: payload.payment_method,
        status: payload.status,
        description: payload.status === 'draft' ? 'ثبت موقت' : 'ثبت نهایی'
    }).select().single();

    if (headErr) throw headErr;

    const itemsData = payload.items.map(item => ({
        warehouse_exit_id: header.id,
        loading_item_id: item.item_id,
        weight_full: item.weight_full,
        weight_empty: item.weight_empty,
        weight_net: item.weight_net,
        qty: item.qty,
        fee_type: item.fee_type,
        fee_price: item.base_storage_rate,
        loading_fee: item.row_loading_fee,
        final_fee: item.row_storage_fee
    }));

    const { error: itemsErr } = await supabase.from("warehouse_exit_items").insert(itemsData);
    if (itemsErr) {
        await supabase.from("warehouse_exits").delete().eq("id", header.id);
        throw itemsErr;
    }
    return header;
};

// --- 3. دریافت اطلاعات برای چاپ (Print View) ---
export const getExitDetailsForPrint = async (exitId) => {
    const { data, error } = await supabase
        .from("warehouse_exits")
        .select(`
            *,
            loading_orders (
                order_no, driver_name, plate_number,
                clearances ( customers ( name ) )
            ),
            warehouse_exit_items (
                *,
                loading_order_items (
                    batch_no, qty,
                    products ( id, name ), 
                    clearance_items ( created_at, weight )
                )
            )
        `)
        .eq("id", exitId)
        .single();

    if (error) throw error;

    // ✅ دریافت تاریخ‌ها برای پرینت
    // اینجا هم باید تاریخ‌ها را بگیریم تا در پرینت درست نمایش داده شوند
    const productReceiptDates = await fetchProductEntryDates(data.warehouse_exit_items);

    // مپ کردن آیتم‌ها برای دسترسی راحت‌تر در صفحه پرینت
    const formattedItems = data.warehouse_exit_items.map(item => {
        const product = item.loading_order_items?.products;
        const clearance = item.loading_order_items?.clearance_items;

        // محاسبه تاریخ برای پرینت
        const entryDate = productReceiptDates[product?.id] || clearance?.created_at || new Date().toISOString();

        // محاسبه مدت
        const start = new Date(entryDate);
        const end = new Date(data.exit_date); // تاریخ خروج هدر
        const diffTime = end - start;
        const diffDaysRaw = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const diffDays = diffDaysRaw >= 0 ? diffDaysRaw : 0;
        let months = 1;
        if (diffDays > 30) months = Math.ceil(diffDays / 30);

        return {
            ...item,
            product_name: product?.name || "نامشخص",
            batch_no: item.loading_order_items?.batch_no,
            entry_date: entryDate, // تاریخ ورود
            days_duration: diffDays, // تعداد روز
            months_duration: months // تعداد ماه
        };
    });

    return {
        ...data,
        driver_name: data.loading_orders?.driver_name,
        plate_number: data.loading_orders?.plate_number,
        customer_name: data.loading_orders?.clearances?.customers?.name,
        items: formattedItems
    };
};

// --- 4. دریافت لیست کل خروج‌ها ---
export const getExitsList = async () => {
    const { data, error } = await supabase
        .from("warehouse_exits")
        .select(`
            id, exit_date, status, created_at,
            total_fee, total_loading_fee, weighbridge_fee, extra_fee, vat_fee,
            loading_orders (
                order_no, driver_name, plate_number,
                clearances ( customers ( name ) )
            )
        `)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
};

// --- 5. حذف سند خروج ---
export const deleteExit = async (id) => {
    const { error: itemsErr } = await supabase.from("warehouse_exit_items").delete().eq("warehouse_exit_id", id);
    if (itemsErr) throw itemsErr;
    const { error: headErr } = await supabase.from("warehouse_exits").delete().eq("id", id);
    if (headErr) throw headErr;
};