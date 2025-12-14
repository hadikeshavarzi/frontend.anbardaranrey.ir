import React, { useState, useMemo, useEffect, useCallback, memo, useRef } from "react";
import {
    Button,
    Table,
    Card,
    CardBody,
    CardHeader,
    Badge,
    Row,
    Col,
} from "reactstrap";
import {
    useReactTable,
    getCoreRowModel,
    getFilteredRowModel,
    flexRender,
} from "@tanstack/react-table";
import ColumnManagerModal from "./ColumnManagerModal";
import { get } from "../../helpers/api_helper";

/* ==========================================
   استایل‌های Skote-Based
========================================== */
const SKOTE_COLORS = {
    primary: "#556ee6",
    success: "#34c38f",
    warning: "#f1b44c",
    danger: "#f46a6a",
    info: "#50a5f1",
    dark: "#343a40",
    muted: "#74788d",
    light: "#f8f9fa",
    white: "#ffffff",
    border: "#eff2f7",
    tableBg: "#f8f9fa",
    tableHover: "#f1f5f7",
};

const styles = {
    card: {
        boxShadow: "0 0.75rem 1.5rem rgba(18,38,63,.03)",
        borderRadius: "0.25rem",
        border: "none",
        marginBottom: "1.5rem",
    },
    cardHeader: {
        background: "linear-gradient(135deg, #556ee6 0%, #4458cb 100%)",
        borderRadius: "0.25rem 0.25rem 0 0",
        padding: "1rem 1.25rem",
        borderBottom: "none",
    },
    cardTitle: {
        color: "#fff",
        fontSize: "1.1rem",
        fontWeight: 500,
        margin: 0,
    },
    tableWrapper: {
        overflowX: "auto",
        borderRadius: "0 0 0.25rem 0.25rem",
    },
    table: {
        marginBottom: 0,
        fontSize: "0.8125rem",
        tableLayout: "fixed",
    },
    tableHead: {
        backgroundColor: SKOTE_COLORS.light,
        borderBottom: `2px solid ${SKOTE_COLORS.border}`,
    },
    th: {
        fontWeight: 600,
        color: SKOTE_COLORS.dark,
        padding: "0.75rem 0.5rem",
        whiteSpace: "nowrap",
        fontSize: "0.8125rem",
        borderTop: "none",
        verticalAlign: "middle",
        textAlign: "center",
        position: "relative",
        userSelect: "none",
    },
    td: {
        padding: "0.5rem",
        verticalAlign: "middle",
        borderColor: SKOTE_COLORS.border,
    },
    input: {
        fontSize: "0.8125rem",
        padding: "0.35rem 0.5rem",
        borderRadius: "0.2rem",
        border: `1px solid ${SKOTE_COLORS.border}`,
        textAlign: "center",
        transition: "border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out",
        width: "100%",
    },
    inputFocus: {
        borderColor: SKOTE_COLORS.primary,
        boxShadow: `0 0 0 0.15rem rgba(85, 110, 230, 0.25)`,
    },
    select: {
        fontSize: "0.8125rem",
        padding: "0.35rem 0.5rem",
        borderRadius: "0.2rem",
        border: `1px solid ${SKOTE_COLORS.border}`,
        backgroundColor: SKOTE_COLORS.white,
        cursor: "pointer",
        width: "100%",
    },
    badge: {
        fontSize: "0.75rem",
        padding: "0.35em 0.65em",
        fontWeight: 500,
    },
    summaryRow: {
        backgroundColor: SKOTE_COLORS.light,
        fontWeight: 600,
    },
    actionBtn: {
        padding: "0.25rem 0.5rem",
        fontSize: "0.75rem",
        lineHeight: 1.5,
        borderRadius: "0.2rem",
    },
    statsCard: {
        background: "linear-gradient(135deg, #fff 0%, #f8f9fa 100%)",
        borderRadius: "0.25rem",
        padding: "0.75rem 1rem",
        border: `1px solid ${SKOTE_COLORS.border}`,
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
    },
    statsIcon: {
        width: "40px",
        height: "40px",
        borderRadius: "0.25rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "1.25rem",
    },
    resizeHandle: {
        position: "absolute",
        left: 0,
        top: 0,
        height: "100%",
        width: "5px",
        cursor: "col-resize",
        backgroundColor: "transparent",
        zIndex: 1,
    },
};

/* ==========================================
   تعریف لیبل‌ها و ترتیب پیش‌فرض
========================================== */
const COLUMN_LABELS = {
    actions: "عملیات",
    id: "#",
    nationalProductId: "شناسه ملی",
    categoryId: "گروه کالا",
    productId: "نام کالا",
    productDescription: "شرح کالا",
    productionType: "نوع تولید",
    count: "تعداد",
    unit: "واحد",
    fullWeight: "وزن پر",
    emptyWeight: "وزن خالی",
    netWeight: "وزن خالص",
    originWeight: "وزن مبدا",
    weightDiff: "اختلاف وزن",
    isUsed: "مستعمل",
    isDefective: "معیوب",
    length: "طول",
    width: "عرض",
    thickness: "ضخامت",
    heatNumber: "Heat No",
    bundleNo: "شماره بسته",
    brand: "برند",
    orderNo: "شماره سفارش",
    parentRow: "ردیف مرجع",
    depoLocation: "محل دپو",
    descriptionNotes: "توضیحات",
    rowCode: "کد ردیف",
};

const DEFAULT_COLUMN_ORDER = [
    "actions", "id", "nationalProductId", "categoryId", "productId",
    "productDescription", "productionType", "count", "unit", "fullWeight",
    "emptyWeight", "netWeight", "originWeight", "weightDiff", "isUsed",
    "isDefective", "length", "width", "thickness", "heatNumber", "bundleNo",
    "brand", "orderNo", "parentRow", "depoLocation", "descriptionNotes", "rowCode",
];

const DEFAULT_COLUMN_WIDTHS = {
    actions: 60, id: 50, nationalProductId: 140, categoryId: 180, productId: 200,
    productDescription: 150, productionType: 100, count: 90, unit: 80,
    fullWeight: 100, emptyWeight: 100, netWeight: 100, originWeight: 100,
    weightDiff: 100, isUsed: 70, isDefective: 70, length: 80, width: 80,
    thickness: 80, heatNumber: 100, bundleNo: 100, brand: 100, orderNo: 100,
    parentRow: 100, depoLocation: 120, descriptionNotes: 150, rowCode: 100,
};

const DEFAULT_VIS = Object.fromEntries(
    Object.keys(COLUMN_LABELS).map((k) => [k, true])
);

const STORAGE_KEY = "receiptTable_settings_v3";

const loadSettings = () => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            return {
                columnOrder: parsed.columnOrder || DEFAULT_COLUMN_ORDER,
                columnWidths: { ...DEFAULT_COLUMN_WIDTHS, ...parsed.columnWidths },
                columnVisibility: { ...DEFAULT_VIS, ...parsed.columnVisibility },
            };
        }
    } catch (e) {
        console.error("Error loading settings:", e);
    }
    return {
        columnOrder: DEFAULT_COLUMN_ORDER,
        columnWidths: DEFAULT_COLUMN_WIDTHS,
        columnVisibility: DEFAULT_VIS,
    };
};

const saveSettings = (settings) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
        console.error("Error saving settings:", e);
    }
};

/* ==========================================
   کامپوننت ورودی عددی - اصلاح شده
========================================== */
const NumericInput = memo(({ value, onChange, onBlur, ...props }) => {
    const [isFocused, setIsFocused] = useState(false);

    // ✅ مستقیماً displayValue را محاسبه کن
    const displayValue = useMemo(() => {
        if (value === null || value === undefined || value === "" || value === 0) {
            if (value === 0) return "0";
            return "";
        }
        return Number(value).toLocaleString("en-US");
    }, [value]);

    const handleChange = (e) => {
        const raw = e.target.value.replace(/[^0-9.]/g, "");
        onChange(raw);
    };

    return (
        <input
            type="text"
            className="form-control form-control-sm"
            value={displayValue}
            onChange={handleChange}
            onBlur={(e) => {
                setIsFocused(false);
                onBlur?.(e);
            }}
            onFocus={() => setIsFocused(true)}
            style={{
                ...styles.input,
                ...(isFocused ? styles.inputFocus : {}),
            }}
            {...props}
        />
    );
});

/* ==========================================
   کامپوننت سلول قابل ویرایش - اصلاح شده
========================================== */
const EditableCell = memo(
    ({ getValue, row, column, table, updateData, type = "text" }) => {
        // ✅ مقدار را از getValue بگیر
        const initialValue = getValue ? getValue() : undefined;
        const [localValue, setLocalValue] = useState(initialValue);
        const [isFocused, setIsFocused] = useState(false);

        useEffect(() => {
            setLocalValue(initialValue);
        }, [initialValue]);

        const onBlur = () => {
            updateData(row.index, column.id, localValue);
        };

        if (type === "number") {
            return (
                <NumericInput
                    value={localValue}
                    onChange={setLocalValue}
                    onBlur={onBlur}
                />
            );
        }

        return (
            <input
                type="text"
                className="form-control form-control-sm"
                value={localValue ?? ""}
                onChange={(e) => setLocalValue(e.target.value)}
                onBlur={() => {
                    setIsFocused(false);
                    onBlur();
                }}
                onFocus={() => setIsFocused(true)}
                style={{
                    ...styles.input,
                    ...(isFocused ? styles.inputFocus : {}),
                }}
            />
        );
    }
);
/* ==========================================
   کامپوننت هدر قابل درگ و ریسایز
========================================== */
const DraggableHeader = ({
    columnId, columnWidth, onResize, onDragStart, onDragOver, onDrop,
    isDragging, isDragOver, children,
}) => {
    const [isResizing, setIsResizing] = useState(false);
    const startXRef = useRef(0);
    const startWidthRef = useRef(0);

    const handleResizeStart = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsResizing(true);
        startXRef.current = e.clientX;
        startWidthRef.current = columnWidth;

        const handleMouseMove = (moveEvent) => {
            const diff = startXRef.current - moveEvent.clientX;
            const newWidth = Math.max(50, startWidthRef.current + diff);
            onResize(columnId, newWidth);
        };

        const handleMouseUp = () => {
            setIsResizing(false);
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
    };

    return (
        <th
            draggable
            onDragStart={(e) => onDragStart(e, columnId)}
            onDragOver={(e) => onDragOver(e, columnId)}
            onDrop={(e) => onDrop(e, columnId)}
            onDragEnd={(e) => e.target.style.opacity = "1"}
            style={{
                ...styles.th,
                width: columnWidth, minWidth: columnWidth, maxWidth: columnWidth,
                opacity: isDragging ? 0.5 : 1,
                backgroundColor: isDragOver ? "rgba(85, 110, 230, 0.1)" : undefined,
                borderRight: isDragOver ? `2px solid ${SKOTE_COLORS.primary}` : undefined,
                transition: "background-color 0.2s, opacity 0.2s",
            }}
        >
            <div
                style={{ ...styles.resizeHandle, backgroundColor: isResizing ? SKOTE_COLORS.primary : "transparent" }}
                onMouseDown={handleResizeStart}
                title="تغییر اندازه"
            />
            <div style={{ cursor: "grab", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                <i className="bx bx-grid-vertical" style={{ fontSize: "0.75rem", opacity: 0.4, flexShrink: 0 }} />
                <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{children}</span>
            </div>
        </th>
    );
};

/* ==========================================
   کامپوننت آمار
========================================== */
const StatCard = ({ icon, label, value, color, bgColor }) => (
    <div style={styles.statsCard}>
        <div style={{ ...styles.statsIcon, backgroundColor: bgColor, color }}>
            <i className={icon}></i>
        </div>
        <div>
            <div style={{ fontSize: "0.75rem", color: SKOTE_COLORS.muted }}>{label}</div>
            <div style={{ fontSize: "1rem", fontWeight: 600, color: SKOTE_COLORS.dark }}>{value}</div>
        </div>
    </div>
);

/* ==========================================
   جدول اصلی
========================================== */
const ReceiptItemsTable = ({ onItemsChange, ownerId, initialItems }) => {
    const [data, setData] = useState([]);
    const [categories, setCategories] = useState([]);
    const [productsByCat, setProductsByCat] = useState({});
    const [showColumnModal, setShowColumnModal] = useState(false);
    const [hoveredRow, setHoveredRow] = useState(null);
    const productsCacheRef = useRef({});

    // ✅ Refs برای جلوگیری از race condition
    const isLoadingItems = useRef(false);
    const hasLoadedInitialItems = useRef(false);

    const [draggedColumn, setDraggedColumn] = useState(null);
    const [dragOverColumn, setDragOverColumn] = useState(null);

    const [settings, setSettings] = useState(loadSettings);
    const { columnOrder, columnWidths, columnVisibility } = settings;

    useEffect(() => {
        saveSettings(settings);
    }, [settings]);

    const summary = useMemo(
        () => data.reduce(
            (s, r) => ({
                count: s.count + Number(r.count || 0),
                netWeight: s.netWeight + Number(r.netWeight || 0),
                items: s.items + 1,
            }),
            { count: 0, netWeight: 0, items: 0 }
        ),
        [data]
    );

    useEffect(() => {
        get("/product-categories?limit=500")
            .then((res) => setCategories(res.data || []))
            .catch(console.error);
    }, []);

    const loadProductsForCategory = useCallback(async (catId) => {
        if (!catId || productsCacheRef.current[catId]) return;
        productsCacheRef.current[catId] = [];

        try {
            const res = await get(`/products?category_id=${catId}&limit=500`);
            const list = res.data || [];
            productsCacheRef.current[catId] = list;
            setProductsByCat((prev) => ({ ...prev, [catId]: list }));
        } catch (err) {
            console.error("Load products failed:", err);
            delete productsCacheRef.current[catId];
        }
    }, []);

    /* ==========================================
       ✅ مپ کردن داده‌های اولیه - اصلاح شده
    ========================================== */
    useEffect(() => {
        if (!initialItems || initialItems.length === 0) {
            console.log("❌ No initialItems");
            return;
        }

        if (hasLoadedInitialItems.current) {
            console.log("❌ Already loaded initial items");
            return;
        }

        if (isLoadingItems.current) {
            console.log("❌ Already loading...");
            return;
        }

        isLoadingItems.current = true;
        console.log("✅ Starting to load items...", initialItems);

        const loadItemsWithCategories = async () => {
            try {
                const mapped = await Promise.all(
                    initialItems.map(async (r, idx) => {
                        let categoryId = r.category_id;

                        console.log("🔍 RAW ITEM:", r);

                        if (!categoryId && r.product_id) {
                            try {
                                const productRes = await get(`/products/${r.product_id}`);
                                const product = productRes.data || productRes;
                                categoryId = product.category_id;
                                console.log(`📦 Product ${r.product_id} -> Category ${categoryId}`);
                            } catch (err) {
                                console.warn("Could not fetch product category:", err);
                            }
                        }

                        console.log("🔍 MAPPED VALUES:", {
                            count: r.count,
                            fullWeight: r.weights_full,
                            emptyWeight: r.weights_empty,
                            originWeight: r.weights_origin,
                            categoryId: categoryId,
                        });

                        return {
                            id: idx + 1,
                            realId: r.id,
                            categoryId: categoryId,
                            productId: r.product_id,
                            nationalProductId: r.national_product_id,
                            productDescription: r.product_description,
                            count: r.count,
                            unit: r.unit || "kg",
                            productionType: r.production_type || "domestic",
                            isUsed: Boolean(r.is_used),
                            isDefective: Boolean(r.is_defective),
                            fullWeight: r.weights_full,
                            emptyWeight: r.weights_empty,
                            netWeight: r.weights_net,
                            originWeight: r.weights_origin,
                            weightDiff: r.weights_diff,
                            length: r.dim_length,
                            width: r.dim_width,
                            thickness: r.dim_thickness,
                            heatNumber: r.heat_number,
                            bundleNo: r.bundle_no,
                            brand: r.brand,
                            orderNo: r.order_no,
                            depoLocation: r.depo_location,
                            descriptionNotes: r.description_notes,
                            rowCode: r.row_code,
                            parentRow: r.parent_row,
                        };
                    })
                );

                console.log("✅ MAPPED ITEMS:", mapped);

                hasLoadedInitialItems.current = true;
                setData(mapped);

                const uniqueCatIds = [...new Set(mapped.map((r) => r.categoryId).filter(Boolean))];
                uniqueCatIds.forEach((catId) => loadProductsForCategory(catId));

            } catch (error) {
                console.error("❌ ERROR:", error);
            } finally {
                isLoadingItems.current = false;
            }
        };

        loadItemsWithCategories();
    }, [initialItems, loadProductsForCategory]);

    /* ==========================================
       ✅ خروجی - اصلاح شده
    ========================================== */
    useEffect(() => {
        if (!onItemsChange) return;

        if (data.length === 0 && !hasLoadedInitialItems.current) {
            console.log("⏳ Skipping onItemsChange - still loading...");
            return;
        }

        console.log("📤 Sending items to parent:", data.length);

        const mapped = data.map((r) => ({
            id: r.realId,
            owner_id: ownerId,
            category_id: Number(r.categoryId) || null,
            product_id: Number(r.productId) || null,
            national_product_id: r.nationalProductId,
            product_description: r.productDescription,
            row_code: r.rowCode,
            parent_row: r.parentRow,
            count: Number(r.count || 0),
            unit: r.unit,
            production_type: r.productionType,
            is_used: Boolean(r.isUsed),
            is_defective: Boolean(r.isDefective),
            weights_full: Number(r.fullWeight || 0),
            weights_empty: Number(r.emptyWeight || 0),
            weights_net: Number(r.netWeight || 0),
            weights_origin: Number(r.originWeight || 0),
            weights_diff: Number(r.weightDiff || 0),
            dim_length: Number(r.length || 0),
            dim_width: Number(r.width || 0),
            dim_thickness: Number(r.thickness || 0),
            heat_number: r.heatNumber,
            bundle_no: r.bundleNo,
            brand: r.brand,
            order_no: r.orderNo,
            depo_location: r.depoLocation,
            description_notes: r.descriptionNotes,
        }));
        onItemsChange(mapped);
    }, [data, ownerId, onItemsChange]);

    const addRow = () =>
        setData((prev) => [
            ...prev,
            {
                id: prev.length + 1,
                unit: "kg",
                productionType: "domestic",
                isUsed: false,
                isDefective: false,
            },
        ]);

    const deleteRow = (id) => setData((prev) => prev.filter((r) => r.id !== id));

    const updateData = useCallback(
        (rowIndex, col, value) => {
            setData((prev) =>
                prev.map((r, i) => {
                    if (i !== rowIndex) return r;
                    const out = { ...r, [col]: value };
                    if (["fullWeight", "emptyWeight", "originWeight"].includes(col)) {
                        const full = Number(col === "fullWeight" ? value : r.fullWeight) || 0;
                        const empty = Number(col === "emptyWeight" ? value : r.emptyWeight) || 0;
                        const origin = Number(col === "originWeight" ? value : r.originWeight) || 0;
                        out.netWeight = full - empty;
                        out.weightDiff = out.netWeight - origin;
                    }
                    if (col === "categoryId") {
                        out.productId = "";
                        loadProductsForCategory(value);
                    }
                    return out;
                })
            );
        },
        [loadProductsForCategory]
    );

    const handleColumnResize = useCallback((columnId, width) => {
        setSettings((prev) => ({
            ...prev,
            columnWidths: { ...prev.columnWidths, [columnId]: width },
        }));
    }, []);

    const handleDragStart = (e, columnId) => {
        setDraggedColumn(columnId);
        e.dataTransfer.effectAllowed = "move";
        e.target.style.opacity = "0.5";
    };

    const handleDragOver = (e, columnId) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (columnId !== draggedColumn) setDragOverColumn(columnId);
    };

    const handleDrop = (e, targetColumnId) => {
        e.preventDefault();
        setDragOverColumn(null);
        if (draggedColumn && draggedColumn !== targetColumnId) {
            setSettings((prev) => {
                const newOrder = [...prev.columnOrder];
                const draggedIndex = newOrder.indexOf(draggedColumn);
                const targetIndex = newOrder.indexOf(targetColumnId);
                newOrder.splice(draggedIndex, 1);
                newOrder.splice(targetIndex, 0, draggedColumn);
                return { ...prev, columnOrder: newOrder };
            });
        }
        setDraggedColumn(null);
    };

    const resetSettings = () => {
        const defaultSettings = {
            columnOrder: DEFAULT_COLUMN_ORDER,
            columnWidths: DEFAULT_COLUMN_WIDTHS,
            columnVisibility: DEFAULT_VIS,
        };
        setSettings(defaultSettings);
        saveSettings(defaultSettings);
    };

    const allColumns = useMemo(
        () => ({
            actions: {
                id: "actions",
                header: () => (
                    <Button color="success" size="sm" onClick={addRow}
                        style={{ ...styles.actionBtn, boxShadow: "0 2px 6px rgba(52, 195, 143, 0.4)" }}>
                        <i className="bx bx-plus"></i>
                    </Button>
                ),
                cell: ({ row }) => (
                    <Button color="danger" size="sm" outline onClick={() => deleteRow(row.original.id)} style={styles.actionBtn}>
                        <i className="bx bx-trash-alt"></i>
                    </Button>
                ),
            },
            id: {
                id: "id",
                header: "#",
                accessorKey: "id",
                cell: ({ getValue }) => (
                    <Badge color="light" style={{ ...styles.badge, color: SKOTE_COLORS.primary, backgroundColor: "rgba(85, 110, 230, 0.1)" }}>
                        {getValue()}
                    </Badge>
                ),
            },
            nationalProductId: {
                id: "nationalProductId",
                header: COLUMN_LABELS.nationalProductId,
                accessorKey: "nationalProductId",
                cell: (p) => <EditableCell {...p} updateData={updateData} type="text" />,
            },
            categoryId: {
                id: "categoryId",
                header: COLUMN_LABELS.categoryId,
                cell: ({ row }) => (
                    <select className="form-select form-select-sm" value={row.original.categoryId || ""}
                        onChange={(e) => updateData(row.index, "categoryId", e.target.value)} style={styles.select}>
                        <option value="">انتخاب...</option>
                        {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                ),
            },
            productId: {
                id: "productId",
                header: COLUMN_LABELS.productId,
                cell: ({ row }) => (
                    <select className="form-select form-select-sm" value={row.original.productId || ""}
                        onChange={(e) => updateData(row.index, "productId", e.target.value)} style={styles.select}>
                        <option value="">انتخاب...</option>
                        {(productsByCat[row.original.categoryId] || []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                ),
            },
            productDescription: {
                id: "productDescription",
                header: COLUMN_LABELS.productDescription,
                accessorKey: "productDescription",
                cell: (p) => <EditableCell {...p} updateData={updateData} type="text" />,
            },
            productionType: {
                id: "productionType",
                header: COLUMN_LABELS.productionType,
                cell: ({ row }) => (
                    <select className="form-select form-select-sm" value={row.original.productionType || "domestic"}
                        onChange={(e) => updateData(row.index, "productionType", e.target.value)} style={styles.select}>
                        <option value="domestic">داخلی</option>
                        <option value="import">وارداتی</option>
                    </select>
                ),
            },
            count: {
                id: "count",
                header: COLUMN_LABELS.count,
                accessorKey: "count",
                cell: (p) => <EditableCell {...p} updateData={updateData} type="number" />,
            },
            unit: {
                id: "unit",
                header: COLUMN_LABELS.unit,
                cell: ({ row }) => (
                    <select className="form-select form-select-sm" value={row.original.unit || "kg"}
                        onChange={(e) => updateData(row.index, "unit", e.target.value)} style={styles.select}>
                        <option value="kg">کیلو</option>
                        <option value="ton">تن</option>
                        <option value="pcs">عدد</option>
                    </select>
                ),
            },
            fullWeight: {
                id: "fullWeight",
                header: COLUMN_LABELS.fullWeight,
                accessorKey: "fullWeight",
                cell: (p) => <EditableCell {...p} updateData={updateData} type="number" />,
            },
            emptyWeight: {
                id: "emptyWeight",
                header: COLUMN_LABELS.emptyWeight,
                accessorKey: "emptyWeight",
                cell: (p) => <EditableCell {...p} updateData={updateData} type="number" />,
            },
            netWeight: {
                id: "netWeight",
                header: COLUMN_LABELS.netWeight,
                cell: ({ row }) => (
                    <Badge color="primary" style={{ ...styles.badge, fontSize: "0.8rem" }}>
                        {Number(row.original.netWeight || 0).toLocaleString()}
                    </Badge>
                ),
            },
            originWeight: {
                id: "originWeight",
                header: COLUMN_LABELS.originWeight,
                accessorKey: "originWeight",
                cell: (p) => <EditableCell {...p} updateData={updateData} type="number" />,
            },
            weightDiff: {
                id: "weightDiff",
                header: COLUMN_LABELS.weightDiff,
                cell: ({ row }) => {
                    const v = Number(row.original.weightDiff || 0);
                    return <Badge color={v > 0 ? "success" : v < 0 ? "danger" : "secondary"} style={styles.badge}>{v > 0 ? "+" : ""}{v.toLocaleString()}</Badge>;
                },
            },
            isUsed: {
                id: "isUsed",
                header: COLUMN_LABELS.isUsed,
                cell: ({ row }) => (
                    <div className="form-check d-flex justify-content-center">
                        <input type="checkbox" className="form-check-input" checked={row.original.isUsed || false}
                            onChange={(e) => updateData(row.index, "isUsed", e.target.checked)} style={{ width: "18px", height: "18px", cursor: "pointer" }} />
                    </div>
                ),
            },
            isDefective: {
                id: "isDefective",
                header: COLUMN_LABELS.isDefective,
                cell: ({ row }) => (
                    <div className="form-check d-flex justify-content-center">
                        <input type="checkbox" className="form-check-input" checked={row.original.isDefective || false}
                            onChange={(e) => updateData(row.index, "isDefective", e.target.checked)} style={{ width: "18px", height: "18px", cursor: "pointer" }} />
                    </div>
                ),
            },
            length: {
                id: "length",
                header: COLUMN_LABELS.length,
                accessorKey: "length",
                cell: (p) => <EditableCell {...p} updateData={updateData} type="number" />,
            },
            width: {
                id: "width",
                header: COLUMN_LABELS.width,
                accessorKey: "width",
                cell: (p) => <EditableCell {...p} updateData={updateData} type="number" />,
            },
            thickness: {
                id: "thickness",
                header: COLUMN_LABELS.thickness,
                accessorKey: "thickness",
                cell: (p) => <EditableCell {...p} updateData={updateData} type="number" />,
            },
            heatNumber: {
                id: "heatNumber",
                header: COLUMN_LABELS.heatNumber,
                accessorKey: "heatNumber",
                cell: (p) => <EditableCell {...p} updateData={updateData} type="text" />,
            },
            bundleNo: {
                id: "bundleNo",
                header: COLUMN_LABELS.bundleNo,
                accessorKey: "bundleNo",
                cell: (p) => <EditableCell {...p} updateData={updateData} type="text" />,
            },
            brand: {
                id: "brand",
                header: COLUMN_LABELS.brand,
                accessorKey: "brand",
                cell: (p) => <EditableCell {...p} updateData={updateData} type="text" />,
            },
            orderNo: {
                id: "orderNo",
                header: COLUMN_LABELS.orderNo,
                accessorKey: "orderNo",
                cell: (p) => <EditableCell {...p} updateData={updateData} type="text" />,
            },
            parentRow: {
                id: "parentRow",
                header: COLUMN_LABELS.parentRow,
                accessorKey: "parentRow",
                cell: (p) => <EditableCell {...p} updateData={updateData} type="text" />,
            },
            depoLocation: {
                id: "depoLocation",
                header: COLUMN_LABELS.depoLocation,
                accessorKey: "depoLocation",
                cell: (p) => <EditableCell {...p} updateData={updateData} type="text" />,
            },
            descriptionNotes: {
                id: "descriptionNotes",
                header: COLUMN_LABELS.descriptionNotes,
                accessorKey: "descriptionNotes",
                cell: (p) => <EditableCell {...p} updateData={updateData} type="text" />,
            },
            rowCode: {
                id: "rowCode",
                header: COLUMN_LABELS.rowCode,
                accessorKey: "rowCode",
                cell: (p) => <EditableCell {...p} updateData={updateData} type="text" />,
            },
        }),
        [categories, productsByCat, updateData]
    );

    const visibleColumnIds = useMemo(
        () => columnOrder.filter((id) => columnVisibility[id] !== false),
        [columnOrder, columnVisibility]
    );

    const columns = useMemo(
        () => visibleColumnIds.map((id) => allColumns[id]),
        [visibleColumnIds, allColumns]
    );

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
    });

    return (
        <Card style={styles.card}>
            <CardHeader style={styles.cardHeader}>
                <Row className="align-items-center">
                    <Col>
                        <h5 style={styles.cardTitle}>
                            <i className="bx bx-package me-2"></i>
                            اقلام رسید
                        </h5>
                    </Col>
                    <Col xs="auto">
                        <div className="d-flex gap-2">
                            <Button color="light" size="sm" onClick={resetSettings}
                                style={{ ...styles.actionBtn, backgroundColor: "rgba(255,255,255,0.2)", border: "none", color: "#fff" }} title="بازنشانی تنظیمات">
                                <i className="bx bx-reset me-1"></i>بازنشانی
                            </Button>
                            <Button color="light" size="sm" onClick={() => setShowColumnModal(true)}
                                style={{ ...styles.actionBtn, backgroundColor: "rgba(255,255,255,0.2)", border: "none", color: "#fff" }}>
                                <i className="bx bx-cog me-1"></i>ستون‌ها
                            </Button>
                        </div>
                    </Col>
                </Row>
            </CardHeader>

            <CardBody style={{ padding: "1.25rem" }}>
                <Row className="mb-3 g-3">
                    <Col md={4}>
                        <StatCard icon="bx bx-box" label="تعداد ردیف" value={summary.items.toLocaleString("fa-IR")}
                            color={SKOTE_COLORS.primary} bgColor="rgba(85, 110, 230, 0.1)" />
                    </Col>
                    <Col md={4}>
                        <StatCard icon="bx bx-layer" label="جمع تعداد" value={summary.count.toLocaleString("fa-IR")}
                            color={SKOTE_COLORS.success} bgColor="rgba(52, 195, 143, 0.1)" />
                    </Col>
                    <Col md={4}>
                        <StatCard icon="bx bx-cylinder" label="وزن خالص کل" value={`${summary.netWeight.toLocaleString("fa-IR")} کیلو`}
                            color={SKOTE_COLORS.info} bgColor="rgba(80, 165, 241, 0.1)" />
                    </Col>
                </Row>

                <div className="alert d-flex align-items-center mb-3"
                    style={{ fontSize: "0.8rem", padding: "0.5rem 1rem", backgroundColor: "rgba(80, 165, 241, 0.1)", border: "none", color: SKOTE_COLORS.info, borderRadius: "0.25rem" }}>
                    <i className="bx bx-info-circle me-2"></i>
                    برای جابجایی ستون‌ها، هدر را بکشید. برای تغییر اندازه، لبه چپ هدر را بکشید.
                </div>

                <div style={styles.tableWrapper}>
                    <Table hover responsive className="table-nowrap mb-0 align-middle" style={styles.table}>
                        <thead style={styles.tableHead}>
                            <tr>
                                {visibleColumnIds.map((columnId) => {
                                    const col = allColumns[columnId];
                                    return (
                                        <DraggableHeader key={columnId} columnId={columnId} columnWidth={columnWidths[columnId] || 100}
                                            onResize={handleColumnResize} onDragStart={handleDragStart} onDragOver={handleDragOver}
                                            onDrop={handleDrop} isDragging={draggedColumn === columnId} isDragOver={dragOverColumn === columnId}>
                                            {typeof col.header === "function" ? col.header() : col.header}
                                        </DraggableHeader>
                                    );
                                })}
                            </tr>
                        </thead>
                        <tbody>
                            {table.getRowModel().rows.map((row) => (
                                <tr key={row.id} onMouseEnter={() => setHoveredRow(row.id)} onMouseLeave={() => setHoveredRow(null)}
                                    style={{ backgroundColor: hoveredRow === row.id ? SKOTE_COLORS.tableHover : "transparent", transition: "background-color 0.15s ease" }}>
                                    {row.getVisibleCells().map((cell) => (
                                        <td key={cell.id} style={{ ...styles.td, width: columnWidths[cell.column.id] || 100, minWidth: columnWidths[cell.column.id] || 100, maxWidth: columnWidths[cell.column.id] || 100 }}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                        {data.length > 0 && (
                            <tfoot>
                                <tr style={styles.summaryRow}>
                                    <td colSpan={columns.length - 3} style={{ ...styles.td, textAlign: "left", paddingRight: "1rem" }}>
                                        <strong><i className="bx bx-calculator me-2"></i>جمع کل</strong>
                                    </td>
                                    <td style={{ ...styles.td, textAlign: "center" }}>
                                        <Badge color="success" style={{ ...styles.badge, fontSize: "0.85rem" }}>{summary.count.toLocaleString("fa-IR")}</Badge>
                                    </td>
                                    <td style={styles.td}></td>
                                    <td colSpan={2} style={{ ...styles.td, textAlign: "center" }}>
                                        <Badge color="primary" style={{ ...styles.badge, fontSize: "0.85rem" }}>{summary.netWeight.toLocaleString("fa-IR")} کیلو</Badge>
                                    </td>
                                </tr>
                            </tfoot>
                        )}
                    </Table>
                </div>

                {data.length === 0 && (
                    <div className="text-center py-5" style={{ color: SKOTE_COLORS.muted }}>
                        <i className="bx bx-inbox" style={{ fontSize: "3rem", opacity: 0.5 }}></i>
                        <p className="mt-2 mb-0">هیچ کالایی اضافه نشده است</p>
                        <Button color="primary" size="sm" onClick={addRow} className="mt-3" style={{ ...styles.actionBtn, padding: "0.5rem 1.5rem" }}>
                            <i className="bx bx-plus me-1"></i>افزودن اولین کالا
                        </Button>
                    </div>
                )}
            </CardBody>

            <ColumnManagerModal isOpen={showColumnModal} toggle={() => setShowColumnModal(false)}
                columnVisibility={columnVisibility} columnLabels={COLUMN_LABELS}
                onToggleColumn={(vis) => setSettings((prev) => ({ ...prev, columnVisibility: vis }))} />
        </Card>
    );
};

export default ReceiptItemsTable;