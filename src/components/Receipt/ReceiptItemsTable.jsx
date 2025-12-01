// src/components/Receipt/ReceiptItemsTable.jsx

import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Row, Col, Button, Input, Table } from "reactstrap";
import {
    useReactTable,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    flexRender,
} from "@tanstack/react-table";

import ColumnManagerModal from "./ColumnManagerModal";

/* -------------------------------------------------------------
 *   لیبل ستون‌ها
 * ------------------------------------------------------------- */
const COLUMN_LABELS = {
    nationalProductId: "شناسه کالا ملی",
    productDescription: "شرح کالا",
    group: "گروه کالا",
    description: "نام کالا",
    count: "تعداد",
    unit: "واحد",
    productionType: "نوع تولید",
    isUsed: "مستعمل",
    isDefective: "معیوب",
    fullWeight: "وزن پر",
    emptyWeight: "وزن خالی",
    netWeight: "وزن خالص",
    originWeight: "وزن مبدأ",
    weightDiff: "اختلاف",
    length: "طول",
    width: "عرض",
    thickness: "ضخامت",
    heatNumber: "Heat No",
    bundleNo: "شماره بسته",
    brand: "برند / کارخانه",
    orderNo: "شماره سفارش",
    depoLocation: "محل دپو",
    descriptionNotes: "توضیحات",
    row: "ردیف",
};

/* -------------------------------------------------------------
 *   نمایش پیش‌فرض ستون‌ها
 * ------------------------------------------------------------- */
const DEFAULT_VISIBILITY = {
    nationalProductId: true,
    productDescription: true,
    group: true,
    description: true,
    count: true,
    unit: true,
    productionType: true,
    isUsed: true,
    isDefective: true,
    fullWeight: true,
    emptyWeight: true,
    netWeight: true,
    originWeight: true,
    weightDiff: true,
    length: true,
    width: true,
    thickness: true,
    heatNumber: true,
    bundleNo: true,
    brand: true,
    orderNo: true,
    depoLocation: true,
    descriptionNotes: true,
    row: true,
};

/* ------------------------------------------------------------- */
const ReceiptItemsTable = ({ onItemsChange, initialItems }) => {
    /* -------------------------------------------------------------
     * ۱) داده‌ها
     * ------------------------------------------------------------- */

    const [data, setData] = useState([]);
    const [categories, setCategories] = useState([]);
    const [productsByCat, setProductsByCat] = useState({});
    const [columnVisibility, setColumnVisibility] = useState(() => {
        try {
            const saved = localStorage.getItem("receiptColumns");
            return saved ? JSON.parse(saved) : DEFAULT_VISIBILITY;
        } catch {
            return DEFAULT_VISIBILITY;
        }
    });

    const [sorting, setSorting] = useState([]);
    const [globalFilter, setGlobalFilter] = useState("");
    const [showColumnModal, setShowColumnModal] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(false);

    const tableRef = useRef(null);

    /* -------------------------------------------------------------
     * ۲) لود گروه‌ها از Payload
     * ------------------------------------------------------------- */

    useEffect(() => {
        const loadCats = async () => {
            try {
                const res = await fetch("https://portal.anbardaranrey.ir/api/product-categories?limit=500");
                const json = await res.json();
                
                if (json?.docs && Array.isArray(json.docs)) {
                    setCategories(json.docs);
                }
            } catch (err) {
                console.error("Error loading categories:", err);
                setCategories([]);
            }
        };
        loadCats();
    }, []);

    /* -------------------------------------------------------------
     * ۳) لود آیتم‌های اولیه (برای ویرایش)
     * ------------------------------------------------------------- */
    useEffect(() => {
        console.log("🔍 useEffect initialItems triggered");
        console.log("📦 initialItems:", initialItems);
        console.log("📦 initialItems length:", initialItems?.length);
        console.log("📦 data length:", data.length);
        
        // ⭐ فقط لود کن اگر initialItems پر باشه و data خالی باشه
        if (initialItems && initialItems.length > 0 && data.length === 0) {
            console.log("✅ شروع لود initialItems در ReceiptItemsTable");
            console.log("📥 تعداد آیتم‌ها:", initialItems.length);
            
            const loadItemsAsync = async () => {
                const formattedRows = [];
                
                for (let index = 0; index < initialItems.length; index++) {
                    const item = initialItems[index];
                    console.log(`🔄 Processing item ${index + 1}:`, item);
                    
                    // ⭐ اگر آیتم محصول دارد و گروه نداره، باید گروهش را پیدا کنیم
                    let categoryId = item.group;
                    
                    if (item.description && !categoryId) {
                        try {
                            console.log(`🔍 Finding category for product ${item.description}`);
                            const res = await fetch(
                                `https://portal.anbardaranrey.ir/api/products/${item.description}`
                            );
                            const product = await res.json();
                            
                            if (product?.category) {
                                categoryId = typeof product.category === 'object' 
                                    ? product.category.id 
                                    : product.category;
                                
                                console.log(`📂 گروه محصول ${item.description}: ${categoryId}`);
                            }
                        } catch (err) {
                            console.error("Error finding group for product:", err);
                        }
                    }
                    
                    // ⭐ لود محصولات این گروه
                    if (categoryId) {
                        console.log(`📦 Loading products for category ${categoryId}`);
                        await loadProductsForCategory(categoryId);
                    }

                    const formattedItem = {
                        id: index + 1, // شماره ردیف برای UI
                        itemId: item.itemId, // ⭐ ID واقعی از database (حفظ می‌شود)
                        nationalProductId: item.nationalProductId || "",
                        productDescription: item.productDescription || "",
                        group: categoryId || "", // گروه کالا
                        description: item.description || "", // ⭐ ID محصول (حفظ می‌شود)
                        count: item.count || "",
                        unit: item.unit || "",
                        productionType: item.productionType || "",
                        isUsed: item.isUsed || false,
                        isDefective: item.isDefective || false,
                        fullWeight: item.fullWeight || "",
                        emptyWeight: item.emptyWeight || "",
                        netWeight: item.netWeight || 0,
                        originWeight: item.originWeight || "",
                        weightDiff: item.weightDiff || 0,
                        length: item.length || "",
                        width: item.width || "",
                        thickness: item.thickness || "",
                        heatNumber: item.heatNumber || "",
                        bundleNo: item.bundleNo || "",
                        brand: item.brand || "",
                        orderNo: item.orderNo || "",
                        depoLocation: item.depoLocation || "",
                        descriptionNotes: item.descriptionNotes || "",
                        row: item.row || "",
                    };
                    
                    console.log(`✅ Item ${index + 1} formatted:`, {
                        id: formattedItem.id,
                        itemId: formattedItem.itemId,
                        description: formattedItem.description,
                        group: formattedItem.group
                    });
                    
                    formattedRows.push(formattedItem);
                }

                console.log("✅ All rows formatted:", formattedRows.length);
                console.log("📊 First row sample:", formattedRows[0]);
                
                setData(formattedRows);
                setIsInitialLoad(true);
                
                console.log("✅ data state به‌روزرسانی شد");
            };
            
            loadItemsAsync();
        } else {
            if (!initialItems) {
                console.log("⚠️ initialItems is null/undefined");
            } else if (initialItems.length === 0) {
                console.log("⚠️ initialItems is empty array");
            } else if (data.length > 0) {
                console.log("⚠️ data already has items (data.length = " + data.length + ")");
            }
        }
    }, [initialItems]); // ⭐ فقط به initialItems وابسته باشد

    /* -------------------------------------------------------------
     * ۴) لود کالاها بر اساس گروه
     * ------------------------------------------------------------- */
    const loadProductsForCategory = async (catId) => {
        if (!catId) return;
        if (productsByCat[catId]) return; // کش

        try {
            const res = await fetch(
                `https://portal.anbardaranrey.ir/api/products?where[category][equals]=${catId}&limit=500`
            );

            const json = await res.json();

            if (json?.docs && Array.isArray(json.docs)) {
                setProductsByCat((prev) => ({
                    ...prev,
                    [catId]: json.docs,
                }));
            }
        } catch (err) {
            console.error("Error loading products:", err);
            setProductsByCat((prev) => ({
                ...prev,
                [catId]: [],
            }));
        }
    };

    /* -------------------------------------------------------------
     * ۵) ایجاد ردیف خالی
     * ------------------------------------------------------------- */
    const createEmptyRow = (id) => ({
        id, // شماره ردیف برای UI
        itemId: null, // ⭐ آیتم جدید itemId ندارد
        nationalProductId: "",
        productDescription: "",
        group: "",
        description: "",
        count: "",
        unit: "",
        productionType: "",
        isUsed: false,
        isDefective: false,
        fullWeight: "",
        emptyWeight: "",
        netWeight: 0,
        originWeight: "",
        weightDiff: 0,
        length: "",
        width: "",
        thickness: "",
        heatNumber: "",
        bundleNo: "",
        brand: "",
        orderNo: "",
        depoLocation: "",
        descriptionNotes: "",
        row: "",
    });

    /* -------------------------------------------------------------
     * ۶) افزودن ردیف
     * ------------------------------------------------------------- */
    const addRow = () => {
        setData((prev) => [...prev, createEmptyRow(prev.length + 1)]);
    };

    const deleteRow = (rowId) => {
        setData((prev) => {
            const filtered = prev.filter((r) => r.id !== rowId);
            
            // ⭐ مهم: فقط id (شماره ردیف UI) را دوباره شماره‌گذاری می‌کنیم
            // itemId (ID واقعی database) تغییر نمی‌کند
            return filtered.map((row, index) => ({
                ...row,
                id: index + 1, // فقط شماره ردیف UI
                // itemId همان می‌ماند
            }));
        });
    };

    /* -------------------------------------------------------------
     * ۷) اعلام تغییرات آیتم‌ها به فرم پدر
     * ------------------------------------------------------------- */
    useEffect(() => {
        console.log("📢 useEffect onItemsChange triggered");
        console.log("📊 data length:", data.length);
        
        // ⭐ فقط اگر data پر باشه و onItemsChange موجود باشه
        if (onItemsChange && data.length > 0) {
            console.log("✅ ارسال data به parent");
            console.log("📦 data sample:", data[0]);
            onItemsChange(data);
        } else {
            if (!onItemsChange) {
                console.log("⚠️ onItemsChange is not defined");
            } else if (data.length === 0) {
                console.log("⚠️ data is empty, not sending to parent");
            }
        }
    }, [data, onItemsChange]);

    /* -------------------------------------------------------------
     * ۸) ناوبری با Enter
     * ------------------------------------------------------------- */
    const handleNavigate = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            const inputs = [...document.querySelectorAll("[data-col]")];
            const index = inputs.indexOf(e.target);
            const next = inputs[index + 1];
            next?.focus();
        }
    };

    /* -------------------------------------------------------------
     * ۹) تعریف ستون‌ها (۳۳ ستون کامل)
     * ------------------------------------------------------------- */
    const columns = useMemo(() => [
        {
            id: "id",
            header: "#",
            accessorKey: "id",
            enableHiding: false,
            cell: ({ row }) => (
                <div>
                    <b>{row.original.id}</b>
                    {row.original.itemId && (
                        <div style={{ fontSize: "10px", color: "#999" }}>
                            ID: {row.original.itemId}
                        </div>
                    )}
                </div>
            ),
        },

        // شناسه ملی کالا
        {
            id: "nationalProductId",
            accessorKey: "nationalProductId",
            header: COLUMN_LABELS.nationalProductId,
            cell: ({ row, table }) => (
                <Input
                    bsSize="sm"
                    type="text"
                    value={row.original.nationalProductId || ""}
                    onChange={(e) =>
                        table.options.meta.updateData(row.index, "nationalProductId", e.target.value)
                    }
                    data-row={row.index}
                    data-col="nationalProductId"
                    onKeyDown={handleNavigate}
                />
            ),
        },

        // شرح کالا
        {
            id: "productDescription",
            accessorKey: "productDescription",
            header: COLUMN_LABELS.productDescription,
            cell: ({ row, table }) => (
                <Input
                    bsSize="sm"
                    type="text"
                    value={row.original.productDescription || ""}
                    onChange={(e) =>
                        table.options.meta.updateData(row.index, "productDescription", e.target.value)
                    }
                    data-row={row.index}
                    data-col="productDescription"
                    onKeyDown={handleNavigate}
                />
            ),
        },

        // گروه کالا – داینامیک
        {
            id: "group",
            accessorKey: "group",
            header: COLUMN_LABELS.group,
            cell: ({ row, table }) => {
                const groupValue = row.original.group;

                return (
                    <Input
                        type="select"
                        bsSize="sm"
                        value={groupValue || ""}
                        onChange={async (e) => {
                            const catId = e.target.value;

                            table.options.meta.updateData(row.index, "group", catId);
                            table.options.meta.updateData(row.index, "description", "");

                            await loadProductsForCategory(catId);
                        }}
                        data-row={row.index}
                        data-col="group"
                        onKeyDown={handleNavigate}
                    >
                        <option value="">انتخاب</option>
                        {Array.isArray(categories) && categories.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.name}
                            </option>
                        ))}
                    </Input>
                );
            },
        },

        // نام کالا – داینامیک
        {
            id: "description",
            accessorKey: "description",
            header: COLUMN_LABELS.description,
            cell: ({ row, table }) => {
                const catId = row.original.group;
                const value = row.original.description;
                const items = productsByCat[catId] || [];

                return (
                    <Input
                        type="select"
                        bsSize="sm"
                        disabled={!catId}
                        value={value || ""}
                        onChange={(e) =>
                            table.options.meta.updateData(row.index, "description", e.target.value)
                        }
                        data-row={row.index}
                        data-col="description"
                        onKeyDown={handleNavigate}
                    >
                        <option value="">{catId ? "انتخاب" : "-"}</option>

                        {Array.isArray(items) && items.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.name}
                            </option>
                        ))}
                    </Input>
                );
            },
        },

        // تعداد
        {
            id: "count",
            accessorKey: "count",
            header: COLUMN_LABELS.count,
            cell: ({ row, table }) => (
                <Input
                    type="number"
                    bsSize="sm"
                    value={row.original.count || ""}
                    onChange={(e) =>
                        table.options.meta.updateData(row.index, "count", e.target.value)
                    }
                    data-row={row.index}
                    data-col="count"
                    onKeyDown={handleNavigate}
                />
            ),
        },

        // واحد
        {
            id: "unit",
            accessorKey: "unit",
            header: COLUMN_LABELS.unit,
            cell: ({ row, table }) => (
                <Input
                    type="select"
                    bsSize="sm"
                    value={row.original.unit || ""}
                    onChange={(e) =>
                        table.options.meta.updateData(row.index, "unit", e.target.value)
                    }
                    data-row={row.index}
                    data-col="unit"
                    onKeyDown={handleNavigate}
                >
                    <option value="">انتخاب</option>
                    <option value="kg">کیلو</option>
                    <option value="ton">تن</option>
                    <option value="num">عدد</option>
                    <option value="m">متر</option>
                </Input>
            ),
        },

        // نوع تولید
        {
            id: "productionType",
            accessorKey: "productionType",
            header: COLUMN_LABELS.productionType,
            cell: ({ row, table }) => (
                <Input
                    type="select"
                    bsSize="sm"
                    value={row.original.productionType || ""}
                    onChange={(e) =>
                        table.options.meta.updateData(row.index, "productionType", e.target.value)
                    }
                    data-row={row.index}
                    data-col="productionType"
                    onKeyDown={handleNavigate}
                >
                    <option value="">انتخاب</option>
                    <option value="domestic">داخلی</option>
                    <option value="import">وارداتی</option>
                </Input>
            ),
        },

        // مستعمل
        {
            id: "isUsed",
            accessorKey: "isUsed",
            header: COLUMN_LABELS.isUsed,
            cell: ({ row, table }) => (
                <Input
                    type="checkbox"
                    checked={row.original.isUsed || false}
                    onChange={(e) =>
                        table.options.meta.updateData(row.index, "isUsed", e.target.checked)
                    }
                    data-row={row.index}
                    data-col="isUsed"
                    onKeyDown={handleNavigate}
                />
            ),
        },

        // معیوب
        {
            id: "isDefective",
            accessorKey: "isDefective",
            header: COLUMN_LABELS.isDefective,
            cell: ({ row, table }) => (
                <Input
                    type="checkbox"
                    checked={row.original.isDefective || false}
                    onChange={(e) =>
                        table.options.meta.updateData(row.index, "isDefective", e.target.checked)
                    }
                    data-row={row.index}
                    data-col="isDefective"
                    onKeyDown={handleNavigate}
                />
            ),
        },

        // وزن پر
        {
            id: "fullWeight",
            accessorKey: "fullWeight",
            header: COLUMN_LABELS.fullWeight,
            cell: ({ row, table }) => (
                <Input
                    type="number"
                    bsSize="sm"
                    value={row.original.fullWeight || ""}
                    onChange={(e) => {
                        table.options.meta.updateData(row.index, "fullWeight", e.target.value);
                        const full = parseFloat(e.target.value) || 0;
                        const empty = parseFloat(row.original.emptyWeight) || 0;
                        const origin = parseFloat(row.original.originWeight) || 0;
                        const net = full - empty;
                        table.options.meta.updateData(row.index, "netWeight", net);
                        table.options.meta.updateData(row.index, "weightDiff", net - origin);
                    }}
                    data-row={row.index}
                    data-col="fullWeight"
                    onKeyDown={handleNavigate}
                />
            ),
        },

        // وزن خالی
        {
            id: "emptyWeight",
            accessorKey: "emptyWeight",
            header: COLUMN_LABELS.emptyWeight,
            cell: ({ row, table }) => (
                <Input
                    type="number"
                    bsSize="sm"
                    value={row.original.emptyWeight || ""}
                    onChange={(e) => {
                        table.options.meta.updateData(row.index, "emptyWeight", e.target.value);
                        const empty = parseFloat(e.target.value) || 0;
                        const full = parseFloat(row.original.fullWeight) || 0;
                        const origin = parseFloat(row.original.originWeight) || 0;
                        const net = full - empty;
                        table.options.meta.updateData(row.index, "netWeight", net);
                        table.options.meta.updateData(row.index, "weightDiff", net - origin);
                    }}
                    data-row={row.index}
                    data-col="emptyWeight"
                    onKeyDown={handleNavigate}
                />
            ),
        },

        // وزن خالص
        {
            id: "netWeight",
            accessorKey: "netWeight",
            header: COLUMN_LABELS.netWeight,
            cell: ({ row }) => (
                <b className="text-primary">
                    {(row.original.netWeight || 0).toLocaleString("fa-IR")}
                </b>
            ),
        },

        // وزن مبدا
        {
            id: "originWeight",
            accessorKey: "originWeight",
            header: COLUMN_LABELS.originWeight,
            cell: ({ row, table }) => (
                <Input
                    type="number"
                    bsSize="sm"
                    value={row.original.originWeight || ""}
                    onChange={(e) => {
                        table.options.meta.updateData(row.index, "originWeight", e.target.value);

                        const origin = parseFloat(e.target.value) || 0;
                        const net = parseFloat(row.original.netWeight) || 0;

                        table.options.meta.updateData(row.index, "weightDiff", net - origin);
                    }}
                    data-row={row.index}
                    data-col="originWeight"
                    onKeyDown={handleNavigate}
                />
            ),
        },

        // اختلاف وزن
        {
            id: "weightDiff",
            accessorKey: "weightDiff",
            header: COLUMN_LABELS.weightDiff,
            cell: ({ row }) => (
                <b
                    className={
                        row.original.weightDiff > 0
                            ? "text-danger"
                            : "text-success"
                    }
                >
                    {(row.original.weightDiff || 0).toLocaleString("fa-IR")}
                </b>
            ),
        },

        // طول
        {
            id: "length",
            accessorKey: "length",
            header: COLUMN_LABELS.length,
            cell: ({ row, table }) => (
                <Input
                    type="number"
                    bsSize="sm"
                    value={row.original.length || ""}
                    onChange={(e) =>
                        table.options.meta.updateData(row.index, "length", e.target.value)
                    }
                    data-row={row.index}
                    data-col="length"
                    onKeyDown={handleNavigate}
                />
            ),
        },

        // عرض
        {
            id: "width",
            accessorKey: "width",
            header: COLUMN_LABELS.width,
            cell: ({ row, table }) => (
                <Input
                    type="number"
                    bsSize="sm"
                    value={row.original.width || ""}
                    onChange={(e) =>
                        table.options.meta.updateData(row.index, "width", e.target.value)
                    }
                    data-row={row.index}
                    data-col="width"
                    onKeyDown={handleNavigate}
                />
            ),
        },

        // ضخامت
        {
            id: "thickness",
            accessorKey: "thickness",
            header: COLUMN_LABELS.thickness,
            cell: ({ row, table }) => (
                <Input
                    type="number"
                    bsSize="sm"
                    value={row.original.thickness || ""}
                    onChange={(e) =>
                        table.options.meta.updateData(row.index, "thickness", e.target.value)
                    }
                    data-row={row.index}
                    data-col="thickness"
                    onKeyDown={handleNavigate}
                />
            ),
        },

        // Heat No
        {
            id: "heatNumber",
            accessorKey: "heatNumber",
            header: COLUMN_LABELS.heatNumber,
            cell: ({ row, table }) => (
                <Input
                    type="text"
                    bsSize="sm"
                    value={row.original.heatNumber || ""}
                    onChange={(e) =>
                        table.options.meta.updateData(row.index, "heatNumber", e.target.value)
                    }
                    data-row={row.index}
                    data-col="heatNumber"
                    onKeyDown={handleNavigate}
                />
            ),
        },

        // شماره بسته
        {
            id: "bundleNo",
            accessorKey: "bundleNo",
            header: COLUMN_LABELS.bundleNo,
            cell: ({ row, table }) => (
                <Input
                    type="text"
                    bsSize="sm"
                    value={row.original.bundleNo || ""}
                    onChange={(e) =>
                        table.options.meta.updateData(row.index, "bundleNo", e.target.value)
                    }
                    data-row={row.index}
                    data-col="bundleNo"
                    onKeyDown={handleNavigate}
                />
            ),
        },

        // برند
        {
            id: "brand",
            accessorKey: "brand",
            header: COLUMN_LABELS.brand,
            cell: ({ row, table }) => (
                <Input
                    type="text"
                    bsSize="sm"
                    value={row.original.brand || ""}
                    onChange={(e) =>
                        table.options.meta.updateData(row.index, "brand", e.target.value)
                    }
                    data-row={row.index}
                    data-col="brand"
                    onKeyDown={handleNavigate}
                />
            ),
        },

        // شماره سفارش
        {
            id: "orderNo",
            accessorKey: "orderNo",
            header: COLUMN_LABELS.orderNo,
            cell: ({ row, table }) => (
                <Input
                    type="text"
                    bsSize="sm"
                    value={row.original.orderNo || ""}
                    onChange={(e) =>
                        table.options.meta.updateData(row.index, "orderNo", e.target.value)
                    }
                    data-row={row.index}
                    data-col="orderNo"
                    onKeyDown={handleNavigate}
                />
            ),
        },

        // محل دپو
        {
            id: "depoLocation",
            accessorKey: "depoLocation",
            header: COLUMN_LABELS.depoLocation,
            cell: ({ row, table }) => (
                <Input
                    type="text"
                    bsSize="sm"
                    value={row.original.depoLocation || ""}
                    onChange={(e) =>
                        table.options.meta.updateData(row.index, "depoLocation", e.target.value)
                    }
                    data-row={row.index}
                    data-col="depoLocation"
                    onKeyDown={handleNavigate}
                />
            ),
        },

        // توضیحات
        {
            id: "descriptionNotes",
            accessorKey: "descriptionNotes",
            header: COLUMN_LABELS.descriptionNotes,
            cell: ({ row, table }) => (
                <Input
                    type="text"
                    bsSize="sm"
                    value={row.original.descriptionNotes || ""}
                    onChange={(e) =>
                        table.options.meta.updateData(row.index, "descriptionNotes", e.target.value)
                    }
                    data-row={row.index}
                    data-col="descriptionNotes"
                    onKeyDown={handleNavigate}
                />
            ),
        },

        // ردیف
        {
            id: "row",
            accessorKey: "row",
            header: COLUMN_LABELS.row,
            cell: ({ row, table }) => (
                <Input
                    type="text"
                    bsSize="sm"
                    value={row.original.row || ""}
                    onChange={(e) =>
                        table.options.meta.updateData(row.index, "row", e.target.value)
                    }
                    data-row={row.index}
                    data-col="row"
                    onKeyDown={handleNavigate}
                />
            ),
        },

        // عملیات حذف
        {
            id: "actions",
            header: "عملیات",
            enableHiding: false,
            cell: ({ row }) => (
                <Button
                    color="danger"
                    size="sm"
                    onClick={() => deleteRow(row.original.id)}
                >
                    حذف
                </Button>
            ),
        },
    ], [categories, productsByCat]);

    /* -------------------------------------------------------------
     * ۱۰) ساخت جدول TanStack
     * ------------------------------------------------------------- */
    const table = useReactTable({
        data,
        columns,
        state: { sorting, globalFilter, columnVisibility },
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        onColumnVisibilityChange: (val) => {
            setColumnVisibility(val);
            try {
                localStorage.setItem("receiptColumns", JSON.stringify(val));
            } catch (err) {
                console.error("Error saving column visibility:", err);
            }
        },
        meta: {
            updateData: (rowIndex, columnId, value) => {
                console.log(`🔄 updateData called: row=${rowIndex}, column=${columnId}, value=${value}`);
                
                setData((prev) => {
                    const newData = prev.map((row, idx) =>
                        idx === rowIndex ? { 
                            ...row, 
                            [columnId]: value 
                            // ⭐ itemId تغییر نمی‌کند، فقط مقادیر دیگر
                        } : row
                    );
                    
                    console.log(`✅ Row ${rowIndex} updated:`, newData[rowIndex]);
                    return newData;
                });
            },
        },
    });

    /* -------------------------------------------------------------
     * UI نهایی
     * ------------------------------------------------------------- */
    return (
        <div className="receipt-card" ref={tableRef}>

            {/* Toolbar */}
            <Row className="items-toolbar mb-2">
                <Col md="6">
                    <div className="d-flex gap-2">
                        <Input
                            placeholder="جستجو..."
                            value={globalFilter || ""}
                            onChange={(e) => setGlobalFilter(e.target.value)}
                            className="search-input"
                        />

                        <Button color="success" onClick={addRow}>
                            + افزودن ردیف
                        </Button>
                    </div>
                </Col>

                <Col md="6" className="text-end">
                    <Button color="secondary" onClick={() => setShowColumnModal(true)}>
                        مدیریت ستون‌ها
                    </Button>
                </Col>
            </Row>

            {/* جدول */}
            <div className="table-responsive">
                <Table bordered className="items-table mb-0">
                    <thead>
                        {table.getHeaderGroups().map((hg) => (
                            <tr key={hg.id}>
                                {hg.headers.map((h) => (
                                    <th key={h.id}>
                                        {flexRender(h.column.columnDef.header, h.getContext())}
                                    </th>
                                ))}
                            </tr>
                        ))}
                    </thead>

                    <tbody>
                        {table.getRowModel().rows.length ? (
                            table.getRowModel().rows.map((row) => (
                                <tr key={row.id}>
                                    {row.getVisibleCells().map((cell) => (
                                        <td key={cell.id}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={table.getVisibleLeafColumns().length} className="text-center py-4 text-muted">
                                    هیچ ردیفی ثبت نشده است
                                </td>
                            </tr>
                        )}
                    </tbody>
                </Table>
            </div>

            {/* مدیریت ستون‌ها */}
            <ColumnManagerModal
                isOpen={showColumnModal}
                toggle={() => setShowColumnModal(false)}
                columnVisibility={columnVisibility}
                columnLabels={COLUMN_LABELS}
                onToggleColumn={(key) =>
                    setColumnVisibility((prev) => ({
                        ...prev,
                        [key]: !prev[key],
                    }))
                }
            />
        </div>
    );
};

export default ReceiptItemsTable;