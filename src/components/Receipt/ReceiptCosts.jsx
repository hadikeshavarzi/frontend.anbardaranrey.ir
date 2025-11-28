// src/components/Receipt/ReceiptCosts.jsx
import React, { useState, useEffect, useRef } from "react";
import { Row, Col, Label, Input, Collapse } from "reactstrap";

/**
 * تبدیل عدد به فرمت هزارگان فارسی
 */
const formatNumber = (value) => {
    if (!value && value !== 0) return "";
    // حذف همه کاراکترهای غیر عددی
    const numStr = String(value).replace(/[^\d]/g, "");
    if (!numStr) return "";
    // اضافه کردن جداکننده هزارگان
    return numStr.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

/**
 * حذف فرمت و برگرداندن عدد خام
 */
const unformatNumber = (value) => {
    if (!value) return "";
    return String(value).replace(/[^\d]/g, "");
};

/**
 * کامپوننت Input با فرمت‌دهی لایو
 */
const CurrencyInput = ({ value, onChange, placeholder = "0", className = "", onKeyDown, inputRef, ...props }) => {
    const [displayValue, setDisplayValue] = useState("");

    useEffect(() => {
        setDisplayValue(formatNumber(value));
    }, [value]);

    const handleChange = (e) => {
        const rawValue = unformatNumber(e.target.value);
        setDisplayValue(formatNumber(rawValue));
        onChange(rawValue);
    };

    return (
        <Input
            type="text"
            inputMode="numeric"
            value={displayValue}
            onChange={handleChange}
            placeholder={placeholder}
            className={className}
            dir="ltr"
            onKeyDown={onKeyDown}
            innerRef={inputRef}
            {...props}
        />
    );
};

// ترتیب فیلدها برای navigation
const FIELD_ORDER = [
    "loadCost",
    "unloadCost",
    "warehouseCost",
    "tax",
    "returnFreight",
    "loadingFee",
    "miscCost"
];

const ReceiptCosts = ({ finance, setFinance }) => {
    const [showMiscDesc, setShowMiscDesc] = useState(false);
    const inputRefs = useRef({});

    const handleChange = (key, value) => {
        setFinance((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    // رفتن به فیلد بعدی با Enter
    const handleKeyDown = (e, currentField) => {
        if (e.key === "Enter") {
            e.preventDefault();
            const currentIndex = FIELD_ORDER.indexOf(currentField);
            const nextIndex = currentIndex + 1;

            if (nextIndex < FIELD_ORDER.length) {
                const nextField = FIELD_ORDER[nextIndex];
                inputRefs.current[nextField]?.focus();
            } else {
                // اگر آخرین فیلد بود و متفرقه مقدار داشت، برو به توضیحات
                if (parseFloat(finance.miscCost) > 0) {
                    inputRefs.current["miscDescription"]?.focus();
                }
            }
        }
    };

    // وقتی متفرقه مقدار داشت، توضیحات نمایش داده بشه
    useEffect(() => {
        const miscValue = parseFloat(finance.miscCost) || 0;
        if (miscValue > 0) {
            setShowMiscDesc(true);
        }
    }, [finance.miscCost]);

    // محاسبه جمع هزینه‌ها
    const totalCost =
        (parseFloat(finance.loadCost) || 0) +
        (parseFloat(finance.unloadCost) || 0) +
        (parseFloat(finance.warehouseCost) || 0) +
        (parseFloat(finance.tax) || 0) +
        (parseFloat(finance.returnFreight) || 0) +
        (parseFloat(finance.loadingFee) || 0) +
        (parseFloat(finance.miscCost) || 0);

    return (
        <div className="receipt-costs-card">
            {/* هدر کارت */}
            <div className="costs-header">
                <div className="costs-title">
                    <i className="ri-calculator-line"></i>
                    <span>هزینه‌ها</span>
                </div>
                <div className="costs-total">
                    <span className="total-label">جمع کل:</span>
                    <span className="total-value">{formatNumber(totalCost)}</span>
                    <span className="total-unit">ریال</span>
                </div>
            </div>

            {/* فیلدهای هزینه */}
            <Row className="costs-grid">
                <Col lg="3" md="4" sm="6">
                    <div className="cost-item">
                        <div className="cost-icon loading">
                            <i className="ri-truck-line"></i>
                        </div>
                        <div className="cost-content">
                            <Label className="cost-label">بارگیری</Label>
                            <div className="cost-input-wrapper">
                                <CurrencyInput
                                    value={finance.loadCost}
                                    onChange={(val) => handleChange("loadCost", val)}
                                    className="cost-input"
                                    onKeyDown={(e) => handleKeyDown(e, "loadCost")}
                                    inputRef={(el) => inputRefs.current["loadCost"] = el}
                                />
                                <span className="cost-unit">ریال</span>
                            </div>
                        </div>
                    </div>
                </Col>

                <Col lg="3" md="4" sm="6">
                    <div className="cost-item">
                        <div className="cost-icon unloading">
                            <i className="ri-download-2-line"></i>
                        </div>
                        <div className="cost-content">
                            <Label className="cost-label">تخلیه</Label>
                            <div className="cost-input-wrapper">
                                <CurrencyInput
                                    value={finance.unloadCost}
                                    onChange={(val) => handleChange("unloadCost", val)}
                                    className="cost-input"
                                    onKeyDown={(e) => handleKeyDown(e, "unloadCost")}
                                    inputRef={(el) => inputRefs.current["unloadCost"] = el}
                                />
                                <span className="cost-unit">ریال</span>
                            </div>
                        </div>
                    </div>
                </Col>

                <Col lg="3" md="4" sm="6">
                    <div className="cost-item">
                        <div className="cost-icon warehouse">
                            <i className="ri-home-gear-line"></i>
                        </div>
                        <div className="cost-content">
                            <Label className="cost-label">انبارداری</Label>
                            <div className="cost-input-wrapper">
                                <CurrencyInput
                                    value={finance.warehouseCost}
                                    onChange={(val) => handleChange("warehouseCost", val)}
                                    className="cost-input"
                                    onKeyDown={(e) => handleKeyDown(e, "warehouseCost")}
                                    inputRef={(el) => inputRefs.current["warehouseCost"] = el}
                                />
                                <span className="cost-unit">ریال</span>
                            </div>
                        </div>
                    </div>
                </Col>

                <Col lg="3" md="4" sm="6">
                    <div className="cost-item">
                        <div className="cost-icon tax">
                            <i className="ri-percent-line"></i>
                        </div>
                        <div className="cost-content">
                            <Label className="cost-label">مالیات</Label>
                            <div className="cost-input-wrapper">
                                <CurrencyInput
                                    value={finance.tax}
                                    onChange={(val) => handleChange("tax", val)}
                                    className="cost-input"
                                    onKeyDown={(e) => handleKeyDown(e, "tax")}
                                    inputRef={(el) => inputRefs.current["tax"] = el}
                                />
                                <span className="cost-unit">ریال</span>
                            </div>
                        </div>
                    </div>
                </Col>

                <Col lg="3" md="4" sm="6">
                    <div className="cost-item">
                        <div className="cost-icon return-freight">
                            <i className="ri-arrow-go-back-line"></i>
                        </div>
                        <div className="cost-content">
                            <Label className="cost-label">پس‌کرایه</Label>
                            <div className="cost-input-wrapper">
                                <CurrencyInput
                                    value={finance.returnFreight}
                                    onChange={(val) => handleChange("returnFreight", val)}
                                    className="cost-input"
                                    onKeyDown={(e) => handleKeyDown(e, "returnFreight")}
                                    inputRef={(el) => inputRefs.current["returnFreight"] = el}
                                />
                                <span className="cost-unit">ریال</span>
                            </div>
                        </div>
                    </div>
                </Col>

                <Col lg="3" md="4" sm="6">
                    <div className="cost-item">
                        <div className="cost-icon loading-fee">
                            <i className="ri-stack-line"></i>
                        </div>
                        <div className="cost-content">
                            <Label className="cost-label">بارچینی</Label>
                            <div className="cost-input-wrapper">
                                <CurrencyInput
                                    value={finance.loadingFee}
                                    onChange={(val) => handleChange("loadingFee", val)}
                                    className="cost-input"
                                    onKeyDown={(e) => handleKeyDown(e, "loadingFee")}
                                    inputRef={(el) => inputRefs.current["loadingFee"] = el}
                                />
                                <span className="cost-unit">ریال</span>
                            </div>
                        </div>
                    </div>
                </Col>

                <Col lg="3" md="4" sm="6">
                    <div className="cost-item">
                        <div className="cost-icon misc">
                            <i className="ri-more-2-line"></i>
                        </div>
                        <div className="cost-content">
                            <Label className="cost-label">متفرقه</Label>
                            <div className="cost-input-wrapper">
                                <CurrencyInput
                                    value={finance.miscCost}
                                    onChange={(val) => {
                                        handleChange("miscCost", val);
                                        const numVal = parseFloat(val) || 0;
                                        setShowMiscDesc(numVal > 0);
                                    }}
                                    className="cost-input"
                                    onKeyDown={(e) => handleKeyDown(e, "miscCost")}
                                    inputRef={(el) => inputRefs.current["miscCost"] = el}
                                />
                                <span className="cost-unit">ریال</span>
                            </div>
                        </div>
                    </div>
                </Col>
            </Row>

            {/* توضیحات متفرقه */}
            <Collapse isOpen={showMiscDesc}>
                <div className="misc-description-wrapper">
                    <div className="misc-description-item">
                        <div className="misc-desc-icon">
                            <i className="ri-file-text-line"></i>
                        </div>
                        <div className="misc-desc-content">
                            <Label className="misc-desc-label">توضیحات هزینه متفرقه</Label>
                            <Input
                                type="textarea"
                                rows={2}
                                value={finance.miscDescription || ""}
                                onChange={(e) => handleChange("miscDescription", e.target.value)}
                                placeholder="توضیحات مربوط به هزینه متفرقه را وارد کنید..."
                                className="misc-desc-input"
                                innerRef={(el) => inputRefs.current["miscDescription"] = el}
                            />
                        </div>
                    </div>
                </div>
            </Collapse>
        </div>
    );
};

export default ReceiptCosts;
