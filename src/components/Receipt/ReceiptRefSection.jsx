import React from "react";
import { Card, CardBody, Row, Col, Label, Input, Button } from "reactstrap";
import DatePickerWithIcon from "../Shared/DatePickerWithIcon";

const ReceiptRefSection = ({
                               refType,
                               setRefType,
                               refValues,
                               updateRefValue,
                               barnamehDate,
                               setBarnamehDate,
                           }) => {

    // تابع کمکی برای هندل کردن تغییر رادیو
    const handleRadioChange = (val) => {
        // console.log("Changing Ref Type to:", val); // برای دیباگ اگر نیاز بود فعال کنید
        setRefType(val);
    };

    return (
        <Card className="mb-3 receipt-card">
            <div className="receipt-card-header">
                <div className="title">
                    <i className="ri-file-list-3-line me-2"></i>
                    اطلاعات سند مرجع
                </div>
                <div className="subtitle">
                    بر اساس نوع مرجع، اطلاعات متفاوت نمایش داده می‌شود
                </div>
            </div>

            <CardBody>
                <Row>
                    {/* انتخاب نوع مرجع */}
                    <Col md="3">
                        <Label className="fw-bold d-block mb-2">نوع سند مرجع</Label>

                        {[
                            { value: "none", label: "بدون مرجع", icon: "ri-close-circle-line" },
                            { value: "barnameh", label: "بارنامه", icon: "ri-truck-line" },
                            { value: "petteh", label: "پته گمرکی", icon: "ri-shield-check-line" },
                            { value: "havale", label: "حواله سامانه جامع", icon: "ri-file-transfer-line" },
                            { value: "production", label: "سند اظهار تولید", icon: "ri-settings-3-line" },
                        ].map((t) => (
                            <div className="form-check mt-2" key={t.value}>
                                {/* استفاده از input استاندارد HTML برای جلوگیری از باگ‌های احتمالی کتابخانه */}
                                <input
                                    className="form-check-input"
                                    type="radio"
                                    name="receiptRefTypeGroup" // نام یکتا برای گروه
                                    id={`refType-${t.value}`}
                                    value={t.value}
                                    checked={refType === t.value}
                                    onChange={() => handleRadioChange(t.value)}
                                    // استفاده از onClick به عنوان پشتیبان برای اطمینان بیشتر
                                    onClick={() => handleRadioChange(t.value)}
                                />
                                <Label
                                    className="form-check-label ms-2 cursor-pointer"
                                    htmlFor={`refType-${t.value}`}
                                    style={{ cursor: "pointer" }}
                                >
                                    <i className={`${t.icon} me-1`}></i>
                                    {t.label}
                                </Label>
                            </div>
                        ))}
                    </Col>

                    {/* ------------------ محتوای فرم‌ها (بدون تغییر) ------------------ */}

                    {/* بارنامه */}
                    {refType === "barnameh" && (
                        <Col md="9">
                            <Row>
                                <Col md="4">
                                    <Label className="form-label">شماره بارنامه <span className="text-danger">*</span></Label>
                                    <Input
                                        value={refValues.barnamehNumber || ""}
                                        onChange={(e) => updateRefValue("barnamehNumber", e.target.value)}
                                    />
                                </Col>
                                <Col md="4">
                                    <Label className="form-label">تاریخ صدور <span className="text-danger">*</span></Label>
                                    <DatePickerWithIcon
                                        value={barnamehDate}
                                        onChange={setBarnamehDate}
                                    />
                                </Col>
                                <Col md="4">
                                    <Label className="form-label">کد رهگیری بارنامه</Label>
                                    <Input
                                        value={refValues.barnamehTracking || ""}
                                        onChange={(e) => updateRefValue("barnamehTracking", e.target.value)}
                                    />
                                </Col>
                            </Row>
                        </Col>
                    )}

                    {/* پته گمرکی */}
                    {refType === "petteh" && (
                        <Col md="9">
                            <Row>
                                <Col md="6">
                                    <Label className="form-label">شماره پته <span className="text-danger">*</span></Label>
                                    <Input
                                        value={refValues.pettehNumber || ""}
                                        onChange={(e) => updateRefValue("pettehNumber", e.target.value)}
                                    />
                                </Col>
                            </Row>
                        </Col>
                    )}

                    {/* حواله سامانه جامع */}
                    {refType === "havale" && (
                        <Col md="9">
                            <Row>
                                <Col md="6">
                                    <Label className="form-label">شماره حواله <span className="text-danger">*</span></Label>
                                    <Input
                                        value={refValues.havaleNumber || ""}
                                        onChange={(e) => updateRefValue("havaleNumber", e.target.value)}
                                    />
                                </Col>
                            </Row>
                        </Col>
                    )}

                    {/* اظهار تولید */}
                    {refType === "production" && (
                        <Col md="9">
                            <Row>
                                <Col md="6">
                                    <Label className="form-label">شماره اظهار تولید <span className="text-danger">*</span></Label>
                                    <Input
                                        value={refValues.productionNumber || ""}
                                        onChange={(e) => updateRefValue("productionNumber", e.target.value)}
                                    />
                                </Col>
                            </Row>
                        </Col>
                    )}
                </Row>
            </CardBody>
        </Card>
    );
};

export default ReceiptRefSection;