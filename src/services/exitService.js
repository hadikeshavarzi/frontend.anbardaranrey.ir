import { supabase } from "../helpers/supabase";

// --- تابع کمکی: دریافت تاریخ‌های ورود بر اساس کالا ---
const fetchProductEntryDates = async (items) => {
    const productIds = items.map(item => {
        if (item.product_id) return item.product_id;
        const prod = item.loading_order_items?.products || item.products;
        return prod?.id;
    }).filter(Boolean);

    const uniqueIds = [...new Set(productIds)];
    const productReceiptDates = {};

    if (uniqueIds.length > 0) {
        const { data: receiptData } = await supabase.from("receipt_items")
            .select(`product_id, receipts ( doc_date )`)
            .in("product_id", uniqueIds)
            .order("created_at", { ascending: false });

        if (receiptData) {
            receiptData.forEach(r => {
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

    // تعریف زیر-کوئری آیتم‌ها
    const itemsSelectQuery = `
        batch_no, qty,
        products ( 
            id, name, national_title,
            effective_storage_cost, effective_loading_cost,
            product_categories!fk_prod_to_cat ( fee_type )
        ),
        clearance_items ( weight, created_at )
    `;

    // اصلاح کوئری خروج: دریافت customer_id از طریق ترخیص
    const fullExitQuery = `
        *,
        loading_orders!inner ( 
            id, order_no, driver_name, plate_number, 
            clearances ( customer_id, customers ( id, name ) ) 
        ),
        warehouse_exit_items ( *, loading_order_items ( ${itemsSelectQuery} ) )
    `;

    // 1. جستجو در Loading Orders (سند جدید)
    // ✅ اصلاح مهم: اینجا باید clearances و customers را صدا بزنیم تا owner_id را بگیریم
    const { data: loadingOrder } = await supabase.from("loading_orders")
        .select(`
            id, order_no, driver_name, plate_number,
            clearances (
                customer_id,
                customers ( id, name )
            )
        `)
        .eq("order_no", searchNo)
        .maybeSingle();

    if (loadingOrder) {
        // چک کن آیا قبلاً خروج خورده؟
        const { data: exitByLoad } = await supabase.from("warehouse_exits")
            .select(fullExitQuery).eq("loading_order_id", loadingOrder.id).maybeSingle();

        if (exitByLoad) exitRecord = exitByLoad;
        else loadingOrderRecord = loadingOrder;
    }

    // 2. جستجو مستقیم با ID خروج
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
        const { data: loadItems } = await supabase.from("loading_order_items")
            .select(`*, loading_orders!inner(id), products(id, name, effective_storage_cost, effective_loading_cost, product_categories!fk_prod_to_cat(fee_type)), clearance_items(weight, created_at)`)
            .eq("loading_order_id", loadingOrderRecord.id);
        targetItems = loadItems || [];
    }

    // --- دریافت تاریخ‌ها ---
    const productReceiptDates = await fetchProductEntryDates(targetItems);

    // --- مپ کردن آیتم‌ها ---
    const mapItems = (sourceItems, isNew = false) => {
        return sourceItems.map(item => {
            const ref = isNew ? item : item.loading_order_items;
            if (!ref) return { item_id: null, product_name: "نامشخص" };

            const product = ref.products;
            const clearance = ref.clearance_items;
            const entryDate = productReceiptDates[product?.id] || clearance?.created_at || new Date().toISOString();

            const wFull = isNew ? 0 : (item.weight_full || 0);
            const wEmpty = isNew ? 0 : (item.weight_empty || 0);
            const wNet = (wFull >= wEmpty) ? (wFull - wEmpty) : 0;
            const feeType = product?.product_categories?.fee_type || 'weight';
            const qty = isNew ? (ref.qty || 0) : (item.qty || ref.qty || 0);
            const calcBase = feeType === 'quantity' ? Number(qty) : wNet;
            const sRate = Number(product?.effective_storage_cost) || 0;
            const lRate = Number(product?.effective_loading_cost) || 0;

            return {
                item_id: isNew ? item.id : item.loading_item_id,
                product_name: product?.name || "نامشخص",
                batch_no: ref.batch_no,
                qty: qty,
                entry_date: entryDate,
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

    // --- ساخت خروجی ---
    if (exitRecord) {
        // نام و آیدی مشتری را از ریلیشن‌ها می‌کشیم
        const relCustomer = exitRecord.loading_orders?.clearances?.customers;
        const relClearance = exitRecord.loading_orders?.clearances;

        return {
            source: 'exit_record', is_processed: true, status: exitRecord.status,
            exit_id: exitRecord.id, loading_id: exitRecord.loading_order_id,
            order_no: exitRecord.loading_orders?.order_no,
            driver_name: exitRecord.driver_name || exitRecord.loading_orders?.driver_name,
            plate_number: exitRecord.plate_number || exitRecord.loading_orders?.plate_number,

            // ✅ اصلاح: دریافت نام و آیدی مشتری
            customer_name: relCustomer?.name || "نامشخص",
            customer_id: exitRecord.owner_id || relClearance?.customer_id,

            driver_national_code: exitRecord.driver_national_code,
            weighbridge_fee: exitRecord.weighbridge_fee, extra_fee: exitRecord.extra_fee,
            extra_description: exitRecord.extra_description, payment_method: exitRecord.payment_method,
            reference_no: exitRecord.reference_no,
            exit_date: exitRecord.exit_date,
            items: mapItems(exitRecord.warehouse_exit_items, false)
        };
    } else {
        // حالت بارگیری جدید
        const relCustomer = loadingOrderRecord.clearances?.customers;
        const relClearance = loadingOrderRecord.clearances;

        return {
            source: 'loading_order', is_processed: false,
            loading_id: loadingOrderRecord.id,
            order_no: loadingOrderRecord.order_no,
            driver_name: loadingOrderRecord.driver_name,
            plate_number: loadingOrderRecord.plate_number,

            // ✅ اصلاح: دریافت نام و آیدی مشتری برای فرانت
            customer_name: relCustomer?.name || "نامشخص",
            customer_id: relClearance?.customer_id,

            items: mapItems(targetItems, true)
        };
    }
};

// --- 2. ثبت اطلاعات ---

export const createExitPermit = async (payload) => {
    console.log("🛠 Service received payload:", payload);

    // ۱. ثبت هدر خروج
    const { data: header, error: headErr } = await supabase.from("warehouse_exits").insert({
        loading_order_id: payload.loading_order_id,
        owner_id: payload.owner_id,
        driver_name: payload.driver_name,
        plate_number: payload.plate_number,
        exit_date: payload.exit_date,
        reference_no: payload.reference_no,
        driver_national_code: payload.driver_national_code,
        weighbridge_fee: Number(payload.weighbridge_fee) || 0,
        extra_fee: Number(payload.extra_fee) || 0,
        extra_description: payload.extra_description,
        vat_fee: Number(payload.vat_fee) || 0,
        total_fee: Number(payload.total_fee) || 0,
        total_loading_fee: Number(payload.total_loading_fee) || 0,
        payment_method: payload.payment_method,

        // ✅ فیلد حیاتی برای حسابداری: ذخیره آی‌دی بانک یا صندوق
        financial_account_id: payload.financial_account_id ? Number(payload.financial_account_id) : null,

        status: payload.status,
        description: payload.status === 'draft' ? 'ثبت موقت' : 'ثبت نهایی'
    }).select().single();

    if (headErr) {
        console.error("❌ Database Error (Header):", headErr);
        throw headErr;
    }

    // ۲. آماده‌سازی و ثبت آیتم‌ها
    const itemsData = payload.items.map(item => ({
        warehouse_exit_id: header.id,
        loading_item_id: item.item_id,
        weight_full: Number(item.weight_full) || 0,
        weight_empty: Number(item.weight_empty) || 0,
        weight_net: Number(item.weight_net) || 0,
        qty: Number(item.qty) || 0,
        fee_type: item.fee_type,
        fee_price: Number(item.base_storage_rate) || 0,
        loading_fee: Number(item.row_loading_fee) || 0,
        final_fee: Number(item.row_storage_fee) || 0
    }));

    const { error: itemsErr } = await supabase.from("warehouse_exit_items").insert(itemsData);

    if (itemsErr) {
        console.error("❌ Database Error (Items):", itemsErr);
        // Rollback دستی: اگر آیتم‌ها ثبت نشدند، هدر را پاک کن
        await supabase.from("warehouse_exits").delete().eq("id", header.id);
        throw itemsErr;
    }

    return header;
};// --- 3. دریافت اطلاعات برای چاپ (Print View) ---
export const getExitDetailsForPrint = async (exitId) => {
    const { data, error } = await supabase
        .from("warehouse_exits")
        .select(`
            *,
            customers ( name ),
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

    const productReceiptDates = await fetchProductEntryDates(data.warehouse_exit_items);

    const formattedItems = data.warehouse_exit_items.map(item => {
        const product = item.loading_order_items?.products;
        const clearance = item.loading_order_items?.clearance_items;
        const entryDate = productReceiptDates[product?.id] || clearance?.created_at || new Date().toISOString();

        const start = new Date(entryDate);
        const end = new Date(data.exit_date);
        const diffTime = end - start;
        const diffDaysRaw = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const diffDays = diffDaysRaw >= 0 ? diffDaysRaw : 0;
        let months = 1;
        if (diffDays > 30) months = Math.ceil(diffDays / 30);

        return {
            ...item,
            product_name: product?.name || "نامشخص",
            batch_no: item.loading_order_items?.batch_no,
            entry_date: entryDate,
            days_duration: diffDays,
            months_duration: months
        };
    });

    return {
        ...data,
        driver_name: data.driver_name || data.loading_orders?.driver_name,
        plate_number: data.plate_number || data.loading_orders?.plate_number,
        // اولویت با owner_id است، اگر نبود از ترخیص بخوان
        customer_name: data.customers?.name || data.loading_orders?.clearances?.customers?.name,
        items: formattedItems
    };
};

// --- 4. لیست خروج ---
export const getExitsList = async () => {
    const { data, error } = await supabase
        .from("warehouse_exits")
        .select(`
            id, exit_date, status, created_at,
            total_fee, total_loading_fee, weighbridge_fee, extra_fee, vat_fee,
            customers ( name ),
            loading_orders (
                order_no, driver_name, plate_number
            )
        `)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
};

// --- 5. حذف ---
export const deleteExit = async (id) => {
    const { error: itemsErr } = await supabase.from("warehouse_exit_items").delete().eq("warehouse_exit_id", id);
    if (itemsErr) throw itemsErr;
    const { error: headErr } = await supabase.from("warehouse_exits").delete().eq("id", id);
    if (headErr) throw headErr;
};