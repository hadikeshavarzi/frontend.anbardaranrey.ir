import React, { useState, useMemo, useEffect, useCallback, memo, useRef } from "react";
import {
    Button, Table, Card, CardBody, CardHeader, Badge, Row, Col
} from "reactstrap";
import {
    useReactTable, getCoreRowModel, getFilteredRowModel, flexRender,
} from "@tanstack/react-table";
import ColumnManagerModal from "./ColumnManagerModal";
import { getProductCategories, getProducts, getProductById, getProductUnits } from "../../services/receiptService";

/* ==========================================
   استایل‌های Skote-Based
========================================== */
const SKOTE_COLORS = {
    primary: "#556ee6", success: "#34c38f", warning: "#f1b44c", danger: "#f46a6a",
    info: "#50a5f1", dark: "#343a40", muted: "#74788d", light: "#f8f9fa",
    white: "#ffffff", border: "#eff2f7", tableBg: "#f8f9fa", tableHover: "#f1f5f7",
};

const styles = {
    card: { boxShadow: "0 0.75rem 1.5rem rgba(18,38,63,.03)", borderRadius: "0.25rem", border: "none", marginBottom: "1.5rem" },
    cardHeader: { background: "linear-gradient(135deg, #556ee6 0%, #4458cb 100%)", borderRadius: "0.25rem 0.25rem 0 0", padding: "1rem 1.25rem", borderBottom: "none" },
    cardTitle: { color: "#fff", fontSize: "1.1rem", fontWeight: 500, margin: 0 },
    tableWrapper: { overflowX: "auto", borderRadius: "0 0 0.25rem 0.25rem" },
    table: { marginBottom: 0, fontSize: "0.8125rem", tableLayout: "fixed" },
    tableHead: { backgroundColor: SKOTE_COLORS.light, borderBottom: `2px solid ${SKOTE_COLORS.border}` },
    th: { fontWeight: 600, color: SKOTE_COLORS.dark, padding: "0.75rem 0.5rem", whiteSpace: "nowrap", fontSize: "0.8125rem", borderTop: "none", verticalAlign: "middle", textAlign: "center", position: "relative", userSelect: "none" },
    td: { padding: "0.5rem", verticalAlign: "middle", borderColor: SKOTE_COLORS.border },
    input: { fontSize: "0.8125rem", padding: "0.35rem 0.5rem", borderRadius: "0.2rem", border: `1px solid ${SKOTE_COLORS.border}`, textAlign: "center", transition: "border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out", width: "100%" },
    select: { fontSize: "0.8125rem", padding: "0.35rem 0.5rem", borderRadius: "0.2rem", border: `1px solid ${SKOTE_COLORS.border}`, backgroundColor: SKOTE_COLORS.white, cursor: "pointer", width: "100%" },
    badge: { fontSize: "0.75rem", padding: "0.35em 0.65em", fontWeight: 500 },
    summaryRow: { backgroundColor: SKOTE_COLORS.light, fontWeight: 600 },
    actionBtn: { padding: "0.25rem 0.5rem", fontSize: "0.75rem", lineHeight: 1.5, borderRadius: "0.2rem" },
    statsCard: { background: "linear-gradient(135deg, #fff 0%, #f8f9fa 100%)", borderRadius: "0.25rem", padding: "0.75rem 1rem", border: `1px solid ${SKOTE_COLORS.border}`, display: "flex", alignItems: "center", gap: "0.75rem" },
    statsIcon: { width: "40px", height: "40px", borderRadius: "0.25rem", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.25rem" },
    resizeHandle: { position: "absolute", left: 0, top: 0, height: "100%", width: "5px", cursor: "col-resize", backgroundColor: "transparent", zIndex: 1 },
};

const COLUMN_LABELS = {
    actions: "عملیات", id: "#", national_product_id: "شناسه ملی", category_id: "گروه کالا", product_id: "نام کالا",
    product_description: "شرح کالا", production_type: "نوع تولید", count: "تعداد", unit_id: "واحد",
    weights_full: "وزن پر", weights_empty: "وزن خالی", weights_net: "وزن خالص", weights_origin: "وزن مبدا",
    weights_diff: "اختلاف وزن", is_used: "مستعمل", is_defective: "معیوب", dim_length: "طول", dim_width: "عرض",
    dim_thickness: "ضخامت", heat_number: "Heat No", bundle_no: "شماره بسته", brand: "برند", order_no: "شماره سفارش",
    parent_row: "ردیف مرجع", depo_location: "محل دپو", description_notes: "توضیحات", row_code: "کد ردیف",
};

const DEFAULT_COLUMN_ORDER = Object.keys(COLUMN_LABELS);
const DEFAULT_COLUMN_WIDTHS = { actions: 60, id: 50, national_product_id: 140, category_id: 180, product_id: 200, product_description: 150, count: 90 };
const DEFAULT_VIS = Object.fromEntries(Object.keys(COLUMN_LABELS).map((k) => [k, true]));
const STORAGE_KEY = "receiptTable_settings_v9";

const loadSettings = () => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) return { columnOrder: DEFAULT_COLUMN_ORDER, columnWidths: DEFAULT_COLUMN_WIDTHS, columnVisibility: DEFAULT_VIS, ...JSON.parse(saved) };
    } catch (e) {}
    return { columnOrder: DEFAULT_COLUMN_ORDER, columnWidths: DEFAULT_COLUMN_WIDTHS, columnVisibility: DEFAULT_VIS };
};

const saveSettings = (settings) => localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));

const EditableCell = memo(({ getValue, row, column, updateData, type = "text" }) => {
    const initialValue = getValue();
    const [localValue, setLocalValue] = useState(initialValue);
    useEffect(() => setLocalValue(initialValue), [initialValue]);
    const onBlur = () => updateData(row.index, column.id, localValue);

    if (type === "number") {
        return (
            <input type="text" className="form-control form-control-sm"
                   value={localValue ?? ""}
                   onChange={(e) => setLocalValue(e.target.value.replace(/[^0-9.]/g, ""))}
                   onBlur={onBlur} style={styles.input} />
        );
    }
    return <input type="text" className="form-control form-control-sm" value={localValue ?? ""} onChange={(e) => setLocalValue(e.target.value)} onBlur={onBlur} style={styles.input} />;
});

const DraggableHeader = ({ columnId, columnWidth, onResize, children }) => {
    const startXRef = useRef(0);
    const startWidthRef = useRef(0);
    const handleResizeStart = (e) => {
        e.preventDefault(); e.stopPropagation(); startXRef.current = e.clientX; startWidthRef.current = columnWidth;
        const handleMouseMove = (ev) => onResize(columnId, Math.max(50, startWidthRef.current + (startXRef.current - ev.clientX)));
        const handleMouseUp = () => { document.removeEventListener("mousemove", handleMouseMove); document.removeEventListener("mouseup", handleMouseUp); };
        document.addEventListener("mousemove", handleMouseMove); document.addEventListener("mouseup", handleMouseUp);
    };
    return (
        <th style={{ ...styles.th, width: columnWidth, minWidth: columnWidth, maxWidth: columnWidth }}>
            <div style={styles.resizeHandle} onMouseDown={handleResizeStart} />
            {children}
        </th>
    );
};

const StatCard = ({ icon, label, value, color, bgColor }) => (
    <div style={styles.statsCard}><div style={{ ...styles.statsIcon, backgroundColor: bgColor, color }}><i className={icon}></i></div><div><div style={{ fontSize: "0.75rem", color: SKOTE_COLORS.muted }}>{label}</div><div style={{ fontSize: "1rem", fontWeight: 600, color: SKOTE_COLORS.dark }}>{value}</div></div></div>
);

const ReceiptItemsTable = ({ onItemsChange, ownerId, initialItems }) => {
    const [data, setData] = useState([]);
    const [categories, setCategories] = useState([]);
    const [units, setUnits] = useState([]);
    const [productsByCat, setProductsByCat] = useState({});
    const [showColumnModal, setShowColumnModal] = useState(false);
    const hasLoadedInitialItems = useRef(false);
    const [settings, setSettings] = useState(loadSettings);
    const { columnOrder, columnWidths, columnVisibility } = settings;

    useEffect(() => saveSettings(settings), [settings]);
    const summary = useMemo(() => data.reduce((s, r) => ({ count: s.count + Number(r.count || 0), weights_net: s.weights_net + Number(r.weights_net || 0), items: s.items + 1 }), { count: 0, weights_net: 0, items: 0 }), [data]);

    useEffect(() => {
        getProductCategories().then(d => setCategories(d || [])).catch(console.error);
        getProductUnits().then(d => setUnits(d || [])).catch(console.error);
    }, []);

    const loadProductsForCategory = useCallback(async (catId) => {
        if (!catId || productsByCat[catId]) return;
        try {
            const list = await getProducts(catId);
            setProductsByCat((prev) => ({ ...prev, [catId]: list }));
        } catch (err) { console.error(err); }
    }, [productsByCat]);

    useEffect(() => {
        if (!initialItems?.length || hasLoadedInitialItems.current) return;
        const loadItems = async () => {
            const mapped = await Promise.all(initialItems.map(async (r, idx) => {
                let catId = r.category_id;
                if (!catId && r.product_id) {
                    try { const p = await getProductById(r.product_id); catId = p?.category_id; } catch (e) {}
                }
                return {
                    id: idx + 1,
                    // نگاشت نام‌های دیتابیس به نام‌های داخلی (CamelCase برای راحتی ادیت)
                    category_id: catId,
                    product_id: r.product_id,
                    national_product_id: r.national_product_id,
                    product_description: r.product_description,
                    count: r.count,
                    unit_id: r.unit_id || r.unit || 1,
                    production_type: r.production_type || "domestic",
                    is_used: Boolean(r.is_used),
                    is_defective: Boolean(r.is_defective),
                    weights_full: r.weights_full,
                    weights_empty: r.weights_empty,
                    weights_net: r.weights_net,
                    weights_origin: r.weights_origin,
                    weights_diff: r.weights_diff,
                    dim_length: r.dim_length,
                    dim_width: r.dim_width,
                    dim_thickness: r.dim_thickness,
                    heat_number: r.heat_number,
                    bundle_no: r.bundle_no,
                    brand: r.brand,
                    order_no: r.order_no,

                    // نام‌های داخلی باید با accessorKey ستون‌ها یکی باشند
                    parentRow: r.parent_row,
                    depoLocation: r.depo_location,
                    descriptionNotes: r.description_notes,
                    rowCode: r.row_code,
                };
            }));
            hasLoadedInitialItems.current = true;
            setData(mapped);
            [...new Set(mapped.map(r => r.category_id).filter(Boolean))].forEach(loadProductsForCategory);
        };
        loadItems();
    }, [initialItems, loadProductsForCategory]);

    // ارسال به والد (اینجا همه چیز باید SnakeCase باشد)
    useEffect(() => {
        if (!onItemsChange) return;
        const cleanData = data.map(r => ({
            owner_id: ownerId,
            category_id: Number(r.category_id) || null,
            product_id: Number(r.product_id) || null,
            national_product_id: r.national_product_id,
            product_description: r.product_description,
            count: Number(r.count || 0),
            unit_id: Number(r.unit_id) || 1,
            production_type: r.production_type || "domestic",
            is_used: Boolean(r.is_used),
            is_defective: Boolean(r.is_defective),
            weights_full: Number(r.weights_full || 0),
            weights_empty: Number(r.weights_empty || 0),
            weights_net: Number(r.weights_net || 0),
            weights_origin: Number(r.weights_origin || 0),
            weights_diff: Number(r.weights_diff || 0),
            dim_length: Number(r.dim_length || 0),
            dim_width: Number(r.dim_width || 0),
            dim_thickness: Number(r.dim_thickness || 0),
            heat_number: r.heat_number,
            bundle_no: r.bundle_no,
            brand: r.brand,
            order_no: r.order_no,

            // ✅ نگاشت صحیح فیلدهای متنی
            parent_row: r.parentRow || "", // استفاده از نام داخلی
            depo_location: r.depoLocation || "",
            description_notes: r.descriptionNotes || "",
            row_code: r.rowCode || ""
        }));
        onItemsChange(cleanData);
    }, [data, ownerId, onItemsChange]);

    const addRow = () => setData(prev => [...prev, { id: prev.length + 1, unit_id: 1, production_type: "domestic", is_used: false, is_defective: false }]);
    const deleteRow = (id) => setData(prev => prev.filter(r => r.id !== id));

    const updateData = useCallback((rowIndex, col, value) => {
        setData(prev => prev.map((r, i) => {
            if (i !== rowIndex) return r;
            const out = { ...r, [col]: value };
            if (["weights_full", "weights_empty", "weights_origin"].includes(col)) {
                const full = Number(col === "weights_full" ? value : r.weights_full) || 0;
                const empty = Number(col === "weights_empty" ? value : r.weights_empty) || 0;
                const origin = Number(col === "weights_origin" ? value : r.weights_origin) || 0;
                out.weights_net = full - empty;
                out.weights_diff = out.weights_net - origin;
            }
            if (col === "category_id") { out.product_id = ""; loadProductsForCategory(value); }
            return out;
        }));
    }, [loadProductsForCategory]);

    const handleColumnResize = useCallback((id, width) => setSettings(p => ({ ...p, columnWidths: { ...p.columnWidths, [id]: width } })), []);

    const allColumns = useMemo(() => ({
        actions: { id: "actions", header: () => <Button color="success" size="sm" onClick={addRow} style={styles.actionBtn}><i className="bx bx-plus"></i></Button>, cell: ({ row }) => <Button color="danger" size="sm" outline onClick={() => deleteRow(row.original.id)} style={styles.actionBtn}><i className="bx bx-trash-alt"></i></Button> },
        id: { id: "id", header: "#", accessorKey: "id", cell: ({ getValue }) => <Badge color="light" style={{ ...styles.badge, color: SKOTE_COLORS.primary }}>{getValue()}</Badge> },
        category_id: { id: "category_id", header: COLUMN_LABELS.category_id, cell: ({ row }) => <select className="form-select form-select-sm" value={row.original.category_id || ""} onChange={(e) => updateData(row.index, "category_id", e.target.value)} style={styles.select}><option value="">انتخاب...</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select> },
        product_id: { id: "product_id", header: COLUMN_LABELS.product_id, cell: ({ row }) => <select className="form-select form-select-sm" value={row.original.product_id || ""} onChange={(e) => updateData(row.index, "product_id", e.target.value)} style={styles.select}><option value="">انتخاب...</option>{(productsByCat[row.original.category_id] || []).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select> },
        count: { id: "count", header: COLUMN_LABELS.count, accessorKey: "count", cell: p => <EditableCell {...p} updateData={updateData} type="number" /> },
        unit_id: { id: "unit_id", header: COLUMN_LABELS.unit_id, cell: ({ row }) => <select className="form-select form-select-sm" value={row.original.unit_id || ""} onChange={(e) => updateData(row.index, "unit_id", e.target.value)} style={styles.select}>{units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select> },
        weights_full: { id: "weights_full", header: COLUMN_LABELS.weights_full, accessorKey: "weights_full", cell: p => <EditableCell {...p} updateData={updateData} type="number" /> },
        weights_empty: { id: "weights_empty", header: COLUMN_LABELS.weights_empty, accessorKey: "weights_empty", cell: p => <EditableCell {...p} updateData={updateData} type="number" /> },
        weights_net: { id: "weights_net", header: COLUMN_LABELS.weights_net, cell: ({ row }) => <Badge color="primary" style={styles.badge}>{Number(row.original.weights_net || 0).toLocaleString()}</Badge> },
        weights_origin: { id: "weights_origin", header: COLUMN_LABELS.weights_origin, accessorKey: "weights_origin", cell: p => <EditableCell {...p} updateData={updateData} type="number" /> },
        weights_diff: { id: "weights_diff", header: COLUMN_LABELS.weights_diff, cell: ({ row }) => { const v = Number(row.original.weights_diff || 0); return <Badge color={v > 0 ? "success" : v < 0 ? "danger" : "secondary"} style={styles.badge}>{v > 0 ? "+" : ""}{v.toLocaleString()}</Badge>; } },
        national_product_id: { id: "national_product_id", header: COLUMN_LABELS.national_product_id, accessorKey: "national_product_id", cell: p => <EditableCell {...p} updateData={updateData} /> },
        product_description: { id: "product_description", header: COLUMN_LABELS.product_description, accessorKey: "product_description", cell: p => <EditableCell {...p} updateData={updateData} /> },
        production_type: { id: "production_type", header: COLUMN_LABELS.production_type, cell: ({ row }) => <select className="form-select form-select-sm" value={row.original.production_type} onChange={(e) => updateData(row.index, "production_type", e.target.value)} style={styles.select}><option value="domestic">داخلی</option><option value="import">وارداتی</option></select> },
        is_used: { id: "is_used", header: COLUMN_LABELS.is_used, cell: ({ row }) => <input type="checkbox" className="form-check-input" checked={row.original.is_used} onChange={(e) => updateData(row.index, "is_used", e.target.checked)} /> },
        is_defective: { id: "is_defective", header: COLUMN_LABELS.is_defective, cell: ({ row }) => <input type="checkbox" className="form-check-input" checked={row.original.is_defective} onChange={(e) => updateData(row.index, "is_defective", e.target.checked)} /> },
        dim_length: { id: "dim_length", header: COLUMN_LABELS.dim_length, accessorKey: "dim_length", cell: p => <EditableCell {...p} updateData={updateData} type="number" /> },
        dim_width: { id: "dim_width", header: COLUMN_LABELS.dim_width, accessorKey: "dim_width", cell: p => <EditableCell {...p} updateData={updateData} type="number" /> },
        dim_thickness: { id: "dim_thickness", header: COLUMN_LABELS.dim_thickness, accessorKey: "dim_thickness", cell: p => <EditableCell {...p} updateData={updateData} type="number" /> },

        // ✅ ستون‌هایی که باید به CamelCase باشند چون accessorKey آن‌ها CamelCase است (در state)
        heat_number: { id: "heat_number", header: COLUMN_LABELS.heat_number, accessorKey: "heat_number", cell: p => <EditableCell {...p} updateData={updateData} /> },
        bundle_no: { id: "bundle_no", header: COLUMN_LABELS.bundle_no, accessorKey: "bundle_no", cell: p => <EditableCell {...p} updateData={updateData} /> },
        brand: { id: "brand", header: COLUMN_LABELS.brand, accessorKey: "brand", cell: p => <EditableCell {...p} updateData={updateData} /> },
        order_no: { id: "order_no", header: COLUMN_LABELS.order_no, accessorKey: "order_no", cell: p => <EditableCell {...p} updateData={updateData} /> },

        // ✅ مهم: accessorKey باید با نام موجود در data یکی باشد (CamelCase)
        parent_row: { id: "parent_row", header: COLUMN_LABELS.parent_row, accessorKey: "parentRow", cell: p => <EditableCell {...p} updateData={updateData} /> },
        depo_location: { id: "depo_location", header: COLUMN_LABELS.depo_location, accessorKey: "depoLocation", cell: p => <EditableCell {...p} updateData={updateData} /> },
        row_code: { id: "row_code", header: COLUMN_LABELS.row_code, accessorKey: "rowCode", cell: p => <EditableCell {...p} updateData={updateData} /> },
        description_notes: { id: "description_notes", header: COLUMN_LABELS.description_notes, accessorKey: "descriptionNotes", cell: p => <EditableCell {...p} updateData={updateData} /> },
    }), [categories, productsByCat, units, updateData]);

    const columns = useMemo(() => columnOrder.filter(id => columnVisibility[id] !== false).map(id => allColumns[id]).filter(Boolean), [columnOrder, columnVisibility, allColumns]);
    const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel(), getFilteredRowModel: getFilteredRowModel() });

    return (
        <Card style={styles.card}>
            <CardHeader style={styles.cardHeader}>
                <Row className="align-items-center">
                    <Col><h5 style={styles.cardTitle}><i className="bx bx-package me-2"></i>اقلام رسید</h5></Col>
                    <Col xs="auto">
                        <Button color="light" size="sm" onClick={() => setShowColumnModal(true)} style={{ ...styles.actionBtn, backgroundColor: "rgba(255,255,255,0.2)", border: "none", color: "#fff" }}><i className="bx bx-cog me-1"></i>ستون‌ها</Button>
                    </Col>
                </Row>
            </CardHeader>
            <CardBody style={{ padding: "1.25rem" }}>
                <Row className="mb-3 g-3">
                    <Col md={4}><StatCard icon="bx bx-box" label="تعداد ردیف" value={summary.items} color={SKOTE_COLORS.primary} bgColor="rgba(85, 110, 230, 0.1)" /></Col>
                    <Col md={4}><StatCard icon="bx bx-layer" label="جمع تعداد" value={summary.count.toLocaleString()} color={SKOTE_COLORS.success} bgColor="rgba(52, 195, 143, 0.1)" /></Col>
                    <Col md={4}><StatCard icon="bx bx-cylinder" label="وزن خالص کل" value={`${summary.weights_net.toLocaleString()} کیلو`} color={SKOTE_COLORS.info} bgColor="rgba(80, 165, 241, 0.1)" /></Col>
                </Row>
                <div style={styles.tableWrapper}>
                    <Table hover responsive className="table-nowrap mb-0 align-middle" style={styles.table}>
                        <thead style={styles.tableHead}>
                        <tr>{columns.map(col => <DraggableHeader key={col.id} columnId={col.id} columnWidth={columnWidths[col.id] || 100} onResize={handleColumnResize}>{col.header}</DraggableHeader>)}</tr>
                        </thead>
                        <tbody>
                        {table.getRowModel().rows.map(row => (
                            <tr key={row.id}>
                                {row.getVisibleCells().map(cell => <td key={cell.id} style={{ ...styles.td, width: columnWidths[cell.column.id] || 100, minWidth: columnWidths[cell.column.id], maxWidth: columnWidths[cell.column.id] }}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}
                            </tr>
                        ))}
                        </tbody>
                        {data.length > 0 && <tfoot><tr style={styles.summaryRow}><td colSpan={3} style={styles.td}><strong>جمع کل</strong></td><td style={{...styles.td, textAlign: "center"}}><Badge color="success">{summary.count.toLocaleString()}</Badge></td><td colSpan={4} style={{...styles.td, textAlign: "center"}}><Badge color="primary">{summary.weights_net.toLocaleString()}</Badge></td></tr></tfoot>}
                    </Table>
                </div>
                {data.length === 0 && <div className="text-center py-5" style={{ color: SKOTE_COLORS.muted }}><i className="bx bx-inbox" style={{ fontSize: "3rem", opacity: 0.5 }}></i><p className="mt-2 mb-0">لیست خالی است</p><Button color="primary" size="sm" onClick={addRow} className="mt-3"><i className="bx bx-plus me-1"></i>افزودن کالا</Button></div>}
            </CardBody>
            <ColumnManagerModal isOpen={showColumnModal} toggle={() => setShowColumnModal(false)} columnVisibility={columnVisibility} columnLabels={COLUMN_LABELS} onToggleColumn={(vis) => setSettings(p => ({ ...p, columnVisibility: vis }))} />
        </Card>
    );
};

export default ReceiptItemsTable;