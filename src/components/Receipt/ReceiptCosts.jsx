import React, { useEffect, useRef, useState } from "react";
import { Row, Col, Label, Input, Collapse } from "reactstrap";

const formatNumber = (val) => val ? String(val).replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "";
const unformatNumber = (val) => val ? String(val).replace(/\D/g, "") : "";

const CurrencyInput = ({ value, onChange, inputRef, onKeyDown }) => {
    const [display, setDisplay] = useState("");
    useEffect(() => setDisplay(formatNumber(value)), [value]);
    const handle = (e) => { const raw = unformatNumber(e.target.value); setDisplay(formatNumber(raw)); onChange(raw); };
    return <Input type="text" dir="ltr" value={display} onChange={handle} onKeyDown={onKeyDown} innerRef={inputRef} inputMode="numeric" placeholder="0" className="cost-input" />;
};

const FIELD_ORDER = ["loadCost", "unloadCost", "warehouseCost", "tax", "returnFreight", "loadingFee", "miscCost"];

export default function ReceiptCosts({ value, onChange }) {
    const finance = value || {};
    const inputRefs = useRef({});
    const [miscVisible, setMiscVisible] = useState(false);

    const update = (field, v) => { const num = v === "" ? "" : Number(v) || 0; onChange({ ...finance, [field]: num }); if (field === "miscCost") setMiscVisible(num > 0); };
    const handleKeyDown = (e, field) => {
        if (e.key !== "Enter") return; e.preventDefault();
        const next = FIELD_ORDER[FIELD_ORDER.indexOf(field) + 1];
        if (next) inputRefs.current[next]?.focus(); else if (finance.miscCost > 0) inputRefs.current["miscDescription"]?.focus();
    };

    useEffect(() => setMiscVisible(Number(finance.miscCost) > 0), [finance.miscCost]);
    const total = ["loadCost", "unloadCost", "warehouseCost", "tax", "returnFreight", "loadingFee", "miscCost"].reduce((acc, k) => acc + (Number(finance[k]) || 0), 0);

    return (
        <div className="receipt-costs-card">
            <div className="costs-header"><div className="costs-title"><i className="ri-calculator-line"></i><span>هزینه‌ها</span></div><div className="costs-total"><span className="total-label">جمع کل:</span><span className="total-value">{formatNumber(total)}</span><span className="total-unit">ریال</span></div></div>
            <Row className="costs-grid">
                {[
                    { key: "loadCost", label: "بارگیری", icon: "ri-truck-line", className: "loading" },
                    { key: "unloadCost", label: "تخلیه", icon: "ri-download-2-line", className: "unloading" },
                    { key: "warehouseCost", label: "انبارداری", icon: "ri-home-gear-line", className: "warehouse" },
                    { key: "tax", label: "مالیات", icon: "ri-percent-line", className: "tax" },
                    { key: "returnFreight", label: "پس‌کرایه", icon: "ri-arrow-go-back-line", className: "return-freight" },
                    { key: "loadingFee", label: "بارچینی", icon: "ri-stack-line", className: "loading-fee" },
                    { key: "miscCost", label: "متفرقه", icon: "ri-more-2-line", className: "misc" },
                ].map(({ key, label, icon, className }) => (
                    <Col lg="3" md="4" sm="6" key={key}>
                        <div className="cost-item">
                            <div className={`cost-icon ${className}`}><i className={icon}></i></div>
                            <div className="cost-content"><Label className="cost-label">{label}</Label><div className="cost-input-wrapper"><CurrencyInput value={finance[key]} onChange={(v) => update(key, v)} onKeyDown={(e) => handleKeyDown(e, key)} inputRef={(el) => (inputRefs.current[key] = el)} /><span className="cost-unit">ریال</span></div></div>
                        </div>
                    </Col>
                ))}
            </Row>
            <Collapse isOpen={miscVisible}>
                <div className="misc-description-wrapper"><div className="misc-description-item"><div className="misc-desc-icon"><i className="ri-file-text-line"></i></div><div className="misc-desc-content"><Label className="misc-desc-label">توضیحات هزینه متفرقه</Label><Input type="textarea" rows={2} placeholder="توضیحات مربوط به هزینه متفرقه..." value={finance.miscDescription || ""} onChange={(e) => onChange({ ...finance, miscDescription: e.target.value })} innerRef={(el) => (inputRefs.current["miscDescription"] = el)} /></div></div></div>
            </Collapse>
        </div>
    );
}