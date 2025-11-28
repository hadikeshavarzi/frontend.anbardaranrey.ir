// src/components/Receipt/ReceiptItemsTable.jsx
import React, { useState, useMemo, useCallback, useRef } from "react";
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
import SearchableSelect from "./SearchableSelect";

/* -------------------------------------------------------------
 *   لیست ستون‌ها و برچسب‌ها
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
 *   مقدار پیش‌فرض نمایش ستون‌ها
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
    length: false,
    width: false,
    thickness: false,
    heatNumber: false,
    bundleNo: false,
    brand: false,
    orderNo: false,
    depoLocation: false,
    descriptionNotes: true,
    row: true,
};

/* -------------------------------------------------------------
 *   ترتیب ستون‌ها برای navigation
 * ------------------------------------------------------------- */
const COLUMN_ORDER = [
    "nationalProductId", "productDescription",
    "group", "description", "count", "unit", "productionType",
    "isUsed", "isDefective", "fullWeight", "emptyWeight", "originWeight",
    "length", "width", "thickness", "heatNumber", "bundleNo",
    "brand", "orderNo", "depoLocation", "descriptionNotes", "row"
];

/* -------------------------------------------------------------
 * داده‌های نمونه برای شناسه کالا ملی
 * ------------------------------------------------------------- */
const nationalProductOptions = [
    { value: "1001001001", label: "میلگرد آجدار - 1001001001" },
    { value: "1001001002", label: "میلگرد ساده - 1001001002" },
    { value: "1001002001", label: "تیرآهن IPE - 1001002001" },
    { value: "1001002002", label: "تیرآهن INP - 1001002002" },
    { value: "1001003001", label: "پروفیل قوطی - 1001003001" },
    { value: "1001003002", label: "پروفیل Z - 1001003002" },
    { value: "1001004001", label: "ورق سیاه - 1001004001" },
    { value: "1001004002", label: "ورق گالوانیزه - 1001004002" },
    { value: "1001004003", label: "ورق استیل - 1001004003" },
    { value: "1001005001", label: "لوله درز مستقیم - 1001005001" },
    { value: "1001005002", label: "لوله مانیسمان - 1001005002" },
    { value: "1001006001", label: "ناودانی - 1001006001" },
    { value: "1001007001", label: "نبشی - 1001007001" },
    { value: "1001008001", label: "سیمان تیپ 2 - 1001008001" },
    { value: "1001008002", label: "سیمان تیپ 5 - 1001008002" },
];

/* -------------------------------------------------------------
 * داده‌های نمونه برای شرح کالا
 * ------------------------------------------------------------- */
const productDescriptionOptions = [
    { value: "milgerd-ajdar-a3", label: "میلگرد آجدار A3 استاندارد" },
    { value: "milgerd-ajdar-a2", label: "میلگرد آجدار A2 استاندارد" },
    { value: "milgerd-sadeh", label: "میلگرد ساده کششی" },
    { value: "tirahan-ipe-14", label: "تیرآهن IPE سایز 14" },
    { value: "tirahan-ipe-16", label: "تیرآهن IPE سایز 16" },
    { value: "tirahan-ipe-18", label: "تیرآهن IPE سایز 18" },
    { value: "profile-ghoti-40x40", label: "پروفیل قوطی 40x40" },
    { value: "profile-ghoti-50x50", label: "پروفیل قوطی 50x50" },
    { value: "varagh-siah-2mm", label: "ورق سیاه ضخامت 2 میلیمتر" },
    { value: "varagh-siah-3mm", label: "ورق سیاه ضخامت 3 میلیمتر" },
    { value: "varagh-galvanize-0.5", label: "ورق گالوانیزه 0.5 میلیمتر" },
    { value: "luleh-darz-mostaqim", label: "لوله درز مستقیم صنعتی" },
    { value: "luleh-manismann-sch40", label: "لوله مانیسمان SCH40" },
    { value: "navdani-8", label: "ناودانی سایز 8" },
    { value: "nabshi-5x50", label: "نبشی 5x50x50" },
    { value: "cement-type2", label: "سیمان تیپ 2 پاکتی 50 کیلویی" },
];

/* -------------------------------------------------------------
 * گروه‌ها و لیست کالاها
 * ------------------------------------------------------------- */
const groupOptions = [
    { value: "milgerd", label: "میلگرد" },
    { value: "tir-ahan", label: "تیرآهن" },
    { value: "profile", label: "پروفیل" },
    { value: "varagh", label: "ورق" },
    { value: "luleh", label: "لوله" },
    { value: "navdani", label: "ناودانی" },
    { value: "nabshi", label: "نبشی" },
    { value: "sakhtemani", label: "مصالح ساختمانی" },
];

const productOptions = {
    milgerd: [
        { value: "milgerd-8", label: "میلگرد 8" },
        { value: "milgerd-10", label: "میلگرد 10" },
        { value: "milgerd-12", label: "میلگرد 12" },
        { value: "milgerd-14", label: "میلگرد 14" },
        { value: "milgerd-16", label: "میلگرد 16" },
        { value: "milgerd-18", label: "میلگرد 18" },
        { value: "milgerd-20", label: "میلگرد 20" },
        { value: "milgerd-22", label: "میلگرد 22" },
        { value: "milgerd-25", label: "میلگرد 25" },
        { value: "milgerd-28", label: "میلگرد 28" },
        { value: "milgerd-32", label: "میلگرد 32" },
    ],
    "tir-ahan": [
        { value: "tir-14", label: "تیرآهن 14" },
        { value: "tir-16", label: "تیرآهن 16" },
        { value: "tir-18", label: "تیرآهن 18" },
        { value: "tir-20", label: "تیرآهن 20" },
        { value: "tir-22", label: "تیرآهن 22" },
        { value: "tir-24", label: "تیرآهن 24" },
        { value: "tir-27", label: "تیرآهن 27" },
        { value: "tir-30", label: "تیرآهن 30" },
    ],
    profile: [
        { value: "profile-20x20", label: "پروفیل 20x20" },
        { value: "profile-30x30", label: "پروفیل 30x30" },
        { value: "profile-40x40", label: "پروفیل 40x40" },
        { value: "profile-40x80", label: "پروفیل 40x80" },
        { value: "profile-50x50", label: "پروفیل 50x50" },
    ],
    varagh: [
        { value: "varagh-siah", label: "ورق سیاه" },
        { value: "varagh-galvanize", label: "ورق گالوانیزه" },
        { value: "varagh-rogani", label: "ورق روغنی" },
        { value: "varagh-estil", label: "ورق استیل" },
    ],
    luleh: [
        { value: "luleh-siah", label: "لوله سیاه" },
        { value: "luleh-galvanize", label: "لوله گالوانیزه" },
        { value: "luleh-manismann", label: "لوله مانیسمان" },
    ],
    navdani: [
        { value: "navdani-6", label: "ناودانی 6" },
        { value: "navdani-8", label: "ناودانی 8" },
        { value: "navdani-10", label: "ناودانی 10" },
        { value: "navdani-12", label: "ناودانی 12" },
        { value: "navdani-14", label: "ناودانی 14" },
    ],
    nabshi: [
        { value: "nabshi-3", label: "نبشی 3" },
        { value: "nabshi-4", label: "نبشی 4" },
        { value: "nabshi-5", label: "نبشی 5" },
        { value: "nabshi-6", label: "نبشی 6" },
        { value: "nabshi-8", label: "نبشی 8" },
        { value: "nabshi-10", label: "نبشی 10" },
    ],
    sakhtemani: [
        { value: "cement", label: "سیمان" },
        { value: "gach", label: "گچ" },
        { value: "ajor", label: "آجر" },
        { value: "shen", label: "شن" },
        { value: "maseh", label: "ماسه" },
    ],
};

const productionTypeOptions = [
    { value: "domestic", label: "داخلی" },
    { value: "import", label: "وارداتی" },
];

/* -------------------------------------------------------------
 * ایجاد ردیف خالی
 * ------------------------------------------------------------- */
const createEmptyRow = (id) => ({
    id,
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
 * کامپوننت اصلی جدول
 * ------------------------------------------------------------- */
const ReceiptItemsTable = () => {
    const [data, setData] = useState([createEmptyRow(1)]);
    const [sorting, setSorting] = useState([]);
    const [globalFilter, setGlobalFilter] = useState("");
    const [showColumnModal, setShowColumnModal] = useState(false);
    const tableRef = useRef(null);

    /* -------------------------------------------------------------
     * خواندن امن از localStorage
     * ------------------------------------------------------------- */
    const [columnVisibility, setColumnVisibility] = useState(() => {
        try {
            if (typeof window === "undefined") return DEFAULT_VISIBILITY;
            const saved = localStorage.getItem("receiptColumns");
            if (saved) {
                return { ...DEFAULT_VISIBILITY, ...JSON.parse(saved) };
            }
            return DEFAULT_VISIBILITY;
        } catch {
            return DEFAULT_VISIBILITY;
        }
    });

    const toggleColumn = useCallback((key) => {
        setColumnVisibility((prev) => {
            const updated = { ...prev, [key]: !prev[key] };
            localStorage.setItem("receiptColumns", JSON.stringify(updated));
            return updated;
        });
    }, []);

    /* -------------------------------------------------------------
     * لیست ستون‌های قابل مشاهده برای navigation
     * ------------------------------------------------------------- */
    const visibleColumns = useMemo(() => {
        return COLUMN_ORDER.filter((col) => columnVisibility[col]);
    }, [columnVisibility]);

    /* -------------------------------------------------------------
     * افزودن و حذف ردیف
     * ------------------------------------------------------------- */
    const addRow = useCallback(() => {
        setData((prev) => {
            const newId = prev.length > 0 ? Math.max(...prev.map((i) => i.id)) + 1 : 1;
            return [...prev, createEmptyRow(newId)];
        });
    }, []);

    const deleteRow = useCallback((id) => {
        setData((prev) => prev.filter((i) => i.id !== id));
    }, []);

    /* -------------------------------------------------------------
     * پیدا کردن فیلد بعدی قابل فوکوس
     * ------------------------------------------------------------- */
    const findNextFocusable = useCallback((currentRow, currentCol) => {
        const currentColIndex = visibleColumns.indexOf(currentCol);

        // اگر ستون بعدی در همین ردیف وجود دارد
        if (currentColIndex < visibleColumns.length - 1) {
            const nextCol = visibleColumns[currentColIndex + 1];
            return { row: currentRow, col: nextCol };
        }

        // رفتن به ردیف بعد
        return { row: currentRow + 1, col: visibleColumns[0], isNewRow: true };
    }, [visibleColumns]);

    /* -------------------------------------------------------------
     * حرکت با Enter بین سلول‌ها
     * ------------------------------------------------------------- */
    const handleNavigate = useCallback((e, rowIndex, colId) => {
        if (e.key !== "Enter") return;
        e.preventDefault();

        const next = findNextFocusable(rowIndex, colId);

        // اگر باید ردیف جدید بسازیم
        if (next.isNewRow && next.row >= data.length) {
            addRow();
            setTimeout(() => {
                const nextEl = document.querySelector(
                    `[data-row="${next.row}"][data-col="${next.col}"]`
                );
                nextEl?.focus();
            }, 50);
        } else {
            const nextEl = document.querySelector(
                `[data-row="${next.row}"][data-col="${next.col}"]`
            );
            nextEl?.focus();
        }
    }, [findNextFocusable, data.length, addRow]);

    /* -------------------------------------------------------------
     * تعریف همه ستون‌ها
     * ------------------------------------------------------------- */
    const columns = useMemo(
        () => [
            // # — شماره ردیف
            {
                id: "id",
                accessorKey: "id",
                header: "#",
                enableHiding: false,
                cell: (info) => <b className="row-number">{info.getValue()}</b>,
            },

            // شناسه کالا ملی (ستون جدید - قابل جستجو)
            {
                id: "nationalProductId",
                accessorKey: "nationalProductId",
                header: COLUMN_LABELS.nationalProductId,
                cell: ({ row, table }) => {
                    const value = row.original.nationalProductId || "";
                    return (
                        <SearchableSelect
                            options={nationalProductOptions}
                            value={value}
                            onChange={(val) => table.options.meta.updateData(row.index, "nationalProductId", val)}
                            placeholder="جستجوی شناسه..."
                            data-row={row.index}
                            data-col="nationalProductId"
                            onKeyDown={(e) => handleNavigate(e, row.index, "nationalProductId")}
                        />
                    );
                },
            },

            // شرح کالا (ستون جدید - قابل جستجو)
            {
                id: "productDescription",
                accessorKey: "productDescription",
                header: COLUMN_LABELS.productDescription,
                cell: ({ row, table }) => {
                    const value = row.original.productDescription || "";
                    return (
                        <SearchableSelect
                            options={productDescriptionOptions}
                            value={value}
                            onChange={(val) => table.options.meta.updateData(row.index, "productDescription", val)}
                            placeholder="جستجوی شرح کالا..."
                            data-row={row.index}
                            data-col="productDescription"
                            onKeyDown={(e) => handleNavigate(e, row.index, "productDescription")}
                        />
                    );
                },
            },

            // گروه کالا
            {
                id: "group",
                accessorKey: "group",
                header: COLUMN_LABELS.group,
                cell: ({ row, table }) => {
                    const value = row.original.group || "";
                    return (
                        <Input
                            type="select"
                            bsSize="sm"
                            value={value}
                            onChange={(e) => {
                                table.options.meta.updateData(row.index, "group", e.target.value);
                                table.options.meta.updateData(row.index, "description", "");
                            }}
                            data-row={row.index}
                            data-col="group"
                            onKeyDown={(e) => handleNavigate(e, row.index, "group")}
                        >
                            <option value="">انتخاب</option>
                            {groupOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </Input>
                    );
                },
            },

            // نام کالا
            {
                id: "description",
                accessorKey: "description",
                header: COLUMN_LABELS.description,
                cell: ({ row, table }) => {
                    const group = row.original.group;
                    const value = row.original.description || "";
                    const options = productOptions[group] || [];
                    return (
                        <Input
                            type="select"
                            bsSize="sm"
                            disabled={!group}
                            value={value}
                            onChange={(e) => table.options.meta.updateData(row.index, "description", e.target.value)}
                            data-row={row.index}
                            data-col="description"
                            onKeyDown={(e) => handleNavigate(e, row.index, "description")}
                        >
                            <option value="">{group ? "انتخاب" : "-"}</option>
                            {options.map((o) => (
                                <option key={o.value} value={o.value}>{o.label}</option>
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
                        bsSize="sm"
                        type="number"
                        value={row.original.count || ""}
                        onChange={(e) => table.options.meta.updateData(row.index, "count", e.target.value)}
                        data-row={row.index}
                        data-col="count"
                        onKeyDown={(e) => handleNavigate(e, row.index, "count")}
                        className="table-input"
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
                        onChange={(e) => table.options.meta.updateData(row.index, "unit", e.target.value)}
                        data-row={row.index}
                        data-col="unit"
                        onKeyDown={(e) => handleNavigate(e, row.index, "unit")}
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
                        onChange={(e) => table.options.meta.updateData(row.index, "productionType", e.target.value)}
                        data-row={row.index}
                        data-col="productionType"
                        onKeyDown={(e) => handleNavigate(e, row.index, "productionType")}
                    >
                        <option value="">انتخاب</option>
                        {productionTypeOptions.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                    </Input>
                ),
            },

            // مستعمل
            {
                id: "isUsed",
                accessorKey: "isUsed",
                header: COLUMN_LABELS.isUsed,
                cell: ({ row, table }) => (
                    <div className="d-flex justify-content-center">
                        <Input
                            type="checkbox"
                            checked={row.original.isUsed || false}
                            onChange={(e) => table.options.meta.updateData(row.index, "isUsed", e.target.checked)}
                            data-row={row.index}
                            data-col="isUsed"
                            onKeyDown={(e) => handleNavigate(e, row.index, "isUsed")}
                            className="table-checkbox"
                        />
                    </div>
                ),
            },

            // معیوب
            {
                id: "isDefective",
                accessorKey: "isDefective",
                header: COLUMN_LABELS.isDefective,
                cell: ({ row, table }) => (
                    <div className="d-flex justify-content-center">
                        <Input
                            type="checkbox"
                            checked={row.original.isDefective || false}
                            onChange={(e) => table.options.meta.updateData(row.index, "isDefective", e.target.checked)}
                            data-row={row.index}
                            data-col="isDefective"
                            onKeyDown={(e) => handleNavigate(e, row.index, "isDefective")}
                            className="table-checkbox"
                        />
                    </div>
                ),
            },

            // وزن پر
            {
                id: "fullWeight",
                accessorKey: "fullWeight",
                header: COLUMN_LABELS.fullWeight,
                cell: ({ row, table }) => {
                    const recalcWeights = (newVal) => {
                        const full = parseFloat(newVal) || 0;
                        const empty = parseFloat(row.original.emptyWeight) || 0;
                        const net = Math.max(0, full - empty);
                        const origin = parseFloat(row.original.originWeight) || 0;
                        table.options.meta.updateData(row.index, "netWeight", net);
                        table.options.meta.updateData(row.index, "weightDiff", net - origin);
                    };

                    return (
                        <Input
                            bsSize="sm"
                            type="number"
                            value={row.original.fullWeight || ""}
                            onChange={(e) => {
                                table.options.meta.updateData(row.index, "fullWeight", e.target.value);
                                recalcWeights(e.target.value);
                            }}
                            data-row={row.index}
                            data-col="fullWeight"
                            onKeyDown={(e) => handleNavigate(e, row.index, "fullWeight")}
                            className="table-input"
                        />
                    );
                },
            },

            // وزن خالی
            {
                id: "emptyWeight",
                accessorKey: "emptyWeight",
                header: COLUMN_LABELS.emptyWeight,
                cell: ({ row, table }) => {
                    const recalcWeights = (newVal) => {
                        const full = parseFloat(row.original.fullWeight) || 0;
                        const empty = parseFloat(newVal) || 0;
                        const net = Math.max(0, full - empty);
                        const origin = parseFloat(row.original.originWeight) || 0;
                        table.options.meta.updateData(row.index, "netWeight", net);
                        table.options.meta.updateData(row.index, "weightDiff", net - origin);
                    };

                    return (
                        <Input
                            bsSize="sm"
                            type="number"
                            value={row.original.emptyWeight || ""}
                            onChange={(e) => {
                                table.options.meta.updateData(row.index, "emptyWeight", e.target.value);
                                recalcWeights(e.target.value);
                            }}
                            data-row={row.index}
                            data-col="emptyWeight"
                            onKeyDown={(e) => handleNavigate(e, row.index, "emptyWeight")}
                            className="table-input"
                        />
                    );
                },
            },

            // وزن خالص (فقط نمایش)
            {
                id: "netWeight",
                accessorKey: "netWeight",
                header: COLUMN_LABELS.netWeight,
                cell: ({ row }) => (
                    <span className="net-weight-badge">
                        {parseFloat(row.original.netWeight || 0).toLocaleString("fa-IR")}
                    </span>
                ),
            },

            // وزن مبدأ
            {
                id: "originWeight",
                accessorKey: "originWeight",
                header: COLUMN_LABELS.originWeight,
                cell: ({ row, table }) => {
                    const recalcDiff = (newVal) => {
                        const net = parseFloat(row.original.netWeight) || 0;
                        const origin = parseFloat(newVal) || 0;
                        table.options.meta.updateData(row.index, "weightDiff", net - origin);
                    };

                    return (
                        <Input
                            bsSize="sm"
                            type="number"
                            value={row.original.originWeight || ""}
                            onChange={(e) => {
                                table.options.meta.updateData(row.index, "originWeight", e.target.value);
                                recalcDiff(e.target.value);
                            }}
                            data-row={row.index}
                            data-col="originWeight"
                            onKeyDown={(e) => handleNavigate(e, row.index, "originWeight")}
                            className="table-input"
                        />
                    );
                },
            },

            // اختلاف وزن (فقط نمایش)
            {
                id: "weightDiff",
                accessorKey: "weightDiff",
                header: COLUMN_LABELS.weightDiff,
                cell: ({ row }) => {
                    const rawValue = row.original.weightDiff;
                    const n = parseFloat(rawValue) || 0;

                    // تعیین کلاس بر اساس مقدار
                    let badgeClass = "diff-badge";
                    if (n > 0) {
                        badgeClass = "diff-badge positive";
                    } else if (n < 0) {
                        badgeClass = "diff-badge negative";
                    }

                    // نمایش عدد با علامت منفی
                    const displayValue = n.toLocaleString("fa-IR");

                    return <span className={badgeClass}>{displayValue}</span>;
                },
            },

            // طول
            {
                id: "length",
                accessorKey: "length",
                header: COLUMN_LABELS.length,
                cell: ({ row, table }) => (
                    <Input
                        bsSize="sm"
                        type="number"
                        value={row.original.length || ""}
                        onChange={(e) => table.options.meta.updateData(row.index, "length", e.target.value)}
                        data-row={row.index}
                        data-col="length"
                        onKeyDown={(e) => handleNavigate(e, row.index, "length")}
                        className="table-input"
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
                        bsSize="sm"
                        type="number"
                        value={row.original.width || ""}
                        onChange={(e) => table.options.meta.updateData(row.index, "width", e.target.value)}
                        data-row={row.index}
                        data-col="width"
                        onKeyDown={(e) => handleNavigate(e, row.index, "width")}
                        className="table-input"
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
                        bsSize="sm"
                        type="number"
                        value={row.original.thickness || ""}
                        onChange={(e) => table.options.meta.updateData(row.index, "thickness", e.target.value)}
                        data-row={row.index}
                        data-col="thickness"
                        onKeyDown={(e) => handleNavigate(e, row.index, "thickness")}
                        className="table-input"
                    />
                ),
            },

            // Heat Number
            {
                id: "heatNumber",
                accessorKey: "heatNumber",
                header: COLUMN_LABELS.heatNumber,
                cell: ({ row, table }) => (
                    <Input
                        bsSize="sm"
                        type="text"
                        value={row.original.heatNumber || ""}
                        onChange={(e) => table.options.meta.updateData(row.index, "heatNumber", e.target.value)}
                        data-row={row.index}
                        data-col="heatNumber"
                        onKeyDown={(e) => handleNavigate(e, row.index, "heatNumber")}
                        className="table-input"
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
                        bsSize="sm"
                        type="text"
                        value={row.original.bundleNo || ""}
                        onChange={(e) => table.options.meta.updateData(row.index, "bundleNo", e.target.value)}
                        data-row={row.index}
                        data-col="bundleNo"
                        onKeyDown={(e) => handleNavigate(e, row.index, "bundleNo")}
                        className="table-input"
                    />
                ),
            },

            // برند / کارخانه
            {
                id: "brand",
                accessorKey: "brand",
                header: COLUMN_LABELS.brand,
                cell: ({ row, table }) => (
                    <Input
                        bsSize="sm"
                        type="text"
                        value={row.original.brand || ""}
                        onChange={(e) => table.options.meta.updateData(row.index, "brand", e.target.value)}
                        data-row={row.index}
                        data-col="brand"
                        onKeyDown={(e) => handleNavigate(e, row.index, "brand")}
                        className="table-input"
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
                        bsSize="sm"
                        type="text"
                        value={row.original.orderNo || ""}
                        onChange={(e) => table.options.meta.updateData(row.index, "orderNo", e.target.value)}
                        data-row={row.index}
                        data-col="orderNo"
                        onKeyDown={(e) => handleNavigate(e, row.index, "orderNo")}
                        className="table-input"
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
                        bsSize="sm"
                        type="text"
                        value={row.original.depoLocation || ""}
                        onChange={(e) => table.options.meta.updateData(row.index, "depoLocation", e.target.value)}
                        data-row={row.index}
                        data-col="depoLocation"
                        onKeyDown={(e) => handleNavigate(e, row.index, "depoLocation")}
                        className="table-input"
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
                        bsSize="sm"
                        type="text"
                        value={row.original.descriptionNotes || ""}
                        onChange={(e) => table.options.meta.updateData(row.index, "descriptionNotes", e.target.value)}
                        data-row={row.index}
                        data-col="descriptionNotes"
                        onKeyDown={(e) => handleNavigate(e, row.index, "descriptionNotes")}
                        className="table-input"
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
                        bsSize="sm"
                        type="text"
                        value={row.original.row || ""}
                        onChange={(e) => table.options.meta.updateData(row.index, "row", e.target.value)}
                        data-row={row.index}
                        data-col="row"
                        onKeyDown={(e) => handleNavigate(e, row.index, "row")}
                        className="table-input"
                    />
                ),
            },

            // دکمه حذف
            {
                id: "actions",
                header: "عملیات",
                enableHiding: false,
                cell: ({ row }) => (
                    <Button
                        size="sm"
                        color="danger"
                        className="btn-delete"
                        onClick={() => deleteRow(row.original.id)}
                    >
                        <i className="ri-delete-bin-line"></i>
                    </Button>
                ),
            },
        ],
        [deleteRow, handleNavigate]
    );

    /* -------------------------------------------------------------
     * جدول TanStack
     * ------------------------------------------------------------- */
    const table = useReactTable({
        data,
        columns,
        state: {
            sorting,
            globalFilter,
            columnVisibility,
        },
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        onColumnVisibilityChange: setColumnVisibility,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),

        meta: {
            updateData: (rowIndex, columnId, value) =>
                setData((prev) =>
                    prev.map((row, idx) =>
                        idx === rowIndex ? { ...row, [columnId]: value } : row
                    )
                ),
        },
    });

    /* -------------------------------------------------------------
     * محاسبه جمع‌ها
     * ------------------------------------------------------------- */
    const totalWeight = useMemo(
        () => data.reduce((sum, r) => sum + (parseFloat(r.netWeight) || 0), 0),
        [data]
    );

    const totalCount = useMemo(
        () => data.reduce((sum, r) => sum + (parseFloat(r.count) || 0), 0),
        [data]
    );

    /* -------------------------------------------------------------
     * UI
     * ------------------------------------------------------------- */
    return (
        <div className="receipt-card" ref={tableRef}>
            {/* ===== Toolbar ===== */}
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
                            <i className="ri-add-line me-1"></i>
                            افزودن ردیف
                        </Button>
                    </div>
                </Col>

                <Col md="6" className="text-end">
                    <Button color="secondary" onClick={() => setShowColumnModal(true)}>
                        <i className="ri-layout-4-line me-1"></i>
                        مدیریت ستون‌ها
                    </Button>
                </Col>
            </Row>

            {/* ===== Table ===== */}
            <div className="table-responsive">
                <Table bordered className="items-table mb-0">
                    <thead>
                    {table.getHeaderGroups().map((hg) => (
                        <tr key={hg.id}>
                            {hg.headers.map((h) => (
                                <th key={h.id}>
                                    {h.isPlaceholder
                                        ? null
                                        : flexRender(h.column.columnDef.header, h.getContext())}
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
                            <td colSpan={table.getVisibleLeafColumns().length} className="text-center py-4 text-muted empty-state">
                                <i className="ri-inbox-line"></i>
                                <div>هیچ ردیفی ثبت نشده است</div>
                            </td>
                        </tr>
                    )}
                    </tbody>
                </Table>
            </div>

            {/* ===== Summary ===== */}
            <Row className="mt-3">
                <Col md="4">
                    <div className="summary-card rows">
                        <span className="label">تعداد ردیف‌ها</span>
                        <strong className="value">{data.length.toLocaleString("fa-IR")}</strong>
                    </div>
                </Col>

                <Col md="4">
                    <div className="summary-card weight">
                        <span className="label">مجموع وزن</span>
                        <strong className="value">{totalWeight.toLocaleString("fa-IR")}</strong>
                    </div>
                </Col>

                <Col md="4">
                    <div className="summary-card count">
                        <span className="label">مجموع تعداد</span>
                        <strong className="value">{totalCount.toLocaleString("fa-IR")}</strong>
                    </div>
                </Col>
            </Row>

            {/* ===== Column Manager Modal ===== */}
            <ColumnManagerModal
                isOpen={showColumnModal}
                toggle={() => setShowColumnModal(false)}
                columnVisibility={columnVisibility}
                columnLabels={COLUMN_LABELS}
                onToggleColumn={toggleColumn}
            />
        </div>
    );
};

export default ReceiptItemsTable;
