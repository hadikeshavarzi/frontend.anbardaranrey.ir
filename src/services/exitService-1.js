import { supabase } from "../helpers/supabase";

export const findExitOrLoadingOrder = async (searchNo) => {
    console.log("Searching for:", searchNo);
    if (!searchNo) throw new Error("شماره وارد نشده است.");

    let exitRecord = null;
    let loadingOrderRecord = null;

    // --- کوئری نهایی برای دریافت نرخ‌ها از دسته‌بندی ---
    // ما نرخ انبارداری و بارگیری را از جدول product_categories می‌خوانیم
    const itemsSelectQuery = `
        batch_no, qty,
        products ( 
            name, national_title,
            product_categories!simple_cat_link (
                id, fee_type, storage_cost, loading_cost
            )
        ),
        clearance_items ( weight )
    `;

    const fullQuery = `
        *,
        loading_orders!inner ( id, order_no, driver_name, plate_number, clearances ( customers ( name ) ) ),
        warehouse_exit_items (
            *,
            loading_order_items ( ${itemsSelectQuery} )
        )
    `;

    // 1. جستجو در بارگیری
    const { data: loadingOrder } = await supabase
        .from("loading_orders")
        .select("id, order_no")
        .eq("order_no", searchNo)
        .maybeSingle();

    if (loadingOrder) {
        // چک کنیم آیا قبلاً برای این بارگیری خروج ثبت شده؟
        const { data: exitByLoadingId } = await supabase
            .from("warehouse_exits")
            .select(fullQuery)
            .eq("loading_order_id", loadingOrder.id)
            .maybeSingle();

        if (exitByLoadingId) exitRecord = exitByLoadingId;
        else loadingOrderRecord = loadingOrder;
    }

    // 2. جستجو در خروجی (اگر با شماره بارگیری پیدا نشد)
    if (!exitRecord && !loadingOrderRecord && !isNaN(searchNo)) {
        const { data: exitById } = await supabase
            .from("warehouse_exits")
            .select(fullQuery)
            .eq("id", searchNo)
            .maybeSingle();

        if (exitById) exitRecord = exitById;
    }

    // --- تابع محاسبه‌گر قیمت و مپ کردن داده‌ها ---
    const mapItems = (sourceItems, isNew = false) => {
        return sourceItems.map(item => {
            const refItem = isNew ? item : item.loading_order_items;

            if (!refItem) return { item_id: null, product_name: "نامشخص" };

            const product = refItem.products;
            const category = product?.product_categories;
            const clearance = refItem.clearance_items;

            // 1. استخراج نرخ‌ها از دسته‌بندی
            // اگر نرخی ثبت نشده بود، پیش‌فرض 0 در نظر می‌گیریم
            const baseStorageRate = category ? Number(category.storage_cost) : 0;
            const baseLoadingRate = category ? Number(category.loading_cost) : 0;
            const feeType = category?.fee_type || 'weight'; // پیش‌فرض وزنی

            // 2. مقادیر اولیه برای باسکول (اگر سند جدید است صفر، وگرنه مقادیر ذخیره شده)
            const weightFull = isNew ? 0 : (item.weight_full || 0);
            const weightEmpty = isNew ? 0 : (item.weight_empty || 0);

            // محاسبه وزن خالص
            const weightNet = (weightFull >= weightEmpty) ? (weightFull - weightEmpty) : 0;

            // 3. محاسبه هزینه نهایی این ردیف
            // اگر سند جدید است، باید همین الان محاسبه کنیم تا در جدول نمایش داده شود
            // اگر سند قدیمی است، مبلغ ذخیره شده را می‌خوانیم
            let rowStorageFee = 0;
            let rowLoadingFee = 0;

            if (isNew) {
                // منطق محاسبه: اگر وزنی است ضرب در وزن خالص، اگر تعدادی است ضرب در تعداد
                const calculationBase = feeType === 'quantity' ? (refItem.qty || 0) : weightNet;

                rowStorageFee = calculationBase * baseStorageRate;
                rowLoadingFee = calculationBase * baseLoadingRate;
            } else {
                rowStorageFee = Number(item.final_fee) || 0;
                rowLoadingFee = Number(item.loading_fee) || 0;
            }

            return {
                item_id: isNew ? item.id : item.loading_item_id,
                product_name: product?.name || "نامشخص",
                batch_no: refItem.batch_no,
                qty: refItem.qty,

                // اطلاعات نرخ و نوع محاسبه
                fee_type: feeType,
                base_storage_rate: baseStorageRate, // نرخ واحد انبارداری
                base_loading_rate: baseLoadingRate, // نرخ واحد بارگیری

                cleared_weight: clearance?.weight || 0,

                weight_full: weightFull,
                weight_empty: weightEmpty,
                weight_net: weightNet,

                // هزینه‌های نهایی محاسبه شده برای این ردیف
                row_storage_fee: rowStorageFee,
                row_loading_fee: rowLoadingFee
            };
        });
    };

    if (exitRecord) {
        return {
            source: 'exit_record',
            is_processed: true,
            status: exitRecord.status,
            exit_id: exitRecord.id,
            loading_id: exitRecord.loading_order_id,
            order_no: exitRecord.loading_orders?.order_no,
            driver_name: exitRecord.loading_orders?.driver_name,
            plate_number: exitRecord.loading_orders?.plate_number,
            customer_name: exitRecord.loading_orders?.clearances?.customers?.name,
            driver_national_code: exitRecord.driver_national_code,
            weighbridge_fee: exitRecord.weighbridge_fee,
            extra_fee: exitRecord.extra_fee,
            extra_description: exitRecord.extra_description,
            payment_method: exitRecord.payment_method,
            vat_fee: exitRecord.vat_fee,
            items: mapItems(exitRecord.warehouse_exit_items, false)
        };
    }

    if (loadingOrderRecord) {
        const { data: loadItems, error: itemsError } = await supabase
            .from("loading_order_items")
            .select(`
                *,
                loading_orders!inner ( id, order_no, driver_name, plate_number, clearances!inner ( id, customers ( name ) ) ),
                products ( 
                    name, national_title,
                    product_categories!simple_cat_link (
                        id, fee_type, storage_cost, loading_cost
                    )
                ),
                clearance_items ( weight )
            `)
            .eq("loading_order_id", loadingOrderRecord.id);

        if (itemsError) throw itemsError;

        if (loadItems && loadItems.length > 0) {
            const info = loadItems[0];
            return {
                source: 'loading_order',
                is_processed: false,
                loading_id: info.loading_orders.id,
                order_no: info.loading_orders.order_no,
                driver_name: info.loading_orders.driver_name,
                plate_number: info.loading_orders.plate_number,
                customer_name: info.loading_orders.clearances?.customers?.name,
                items: mapItems(loadItems, true)
            };
        }
    }

    throw new Error("سندی یافت نشد");
};

// ... createExitPermit و getExitDetailsForPrint بدون تغییر ...
export const createExitPermit = async (payload) => {
    const { data: header, error: headErr } = await supabase
        .from("warehouse_exits")
        .insert({
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
            status: payload.status || 'final',
            description: payload.status === 'draft' ? 'ثبت موقت' : 'ثبت نهایی'
        })
        .select()
        .single();

    if (headErr) throw headErr;

    const itemsData = payload.items.map(item => ({
        warehouse_exit_id: header.id,
        loading_item_id: item.item_id,
        weight_full: item.weight_full,
        weight_empty: item.weight_empty,
        weight_net: item.weight_net,
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

export const getExitDetailsForPrint = async (exitId) => {
    const { data, error } = await supabase
        .from("warehouse_exits")
        // در اینجا qty اضافه شد 👇
        .select(`*, loading_orders(order_no, driver_name, plate_number, clearances(customers(name))), warehouse_exit_items(*, loading_order_items(batch_no, qty, products(name)))`)
        .eq("id", exitId)
        .single();
    if (error) throw error;
    return { ...data, customer_name: data.loading_orders?.clearances?.customers?.name, items: data.warehouse_exit_items };
};



// دریافت لیست تمام خروج‌ها (با جزئیات راننده و مشتری)
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
        .order('created_at', { ascending: false }); // جدیدترین‌ها بالا

    if (error) throw error;
    return data;
};

// حذف یک سند خروج
export const deleteExit = async (id) => {
    // ابتدا آیتم‌های خروج پاک می‌شوند (اگر Cascade تنظیم نباشد)
    await supabase.from("warehouse_exit_items").delete().eq("warehouse_exit_id", id);
    
    // سپس خود هدر پاک می‌شود
    const { error } = await supabase.from("warehouse_exits").delete().eq("id", id);
    
    if (error) throw error;
};
