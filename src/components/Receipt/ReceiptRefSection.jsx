import React from "react";
import { Card, CardBody, Row, Col, Label, Input, Button } from "reactstrap";
import DatePickerWithIcon from "./DatePickerWithIcon";

const ReceiptRefSection = ({
    refType,
    setRefType,
    refValues,
    updateRefValue,
    barnamehDate,
    setBarnamehDate,
}) => {
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
                            { value: "havale", label: "حواله سامانه جامع انبارها", icon: "ri-file-transfer-line" },
                            { value: "production", label: "سند اظهار تولید", icon: "ri-settings-3-line" },
                        ].map((t) => (
                            <div className="form-check mt-2" key={t.value}>
                                <Input
                                    type="radio"
                                    name="refType"
                                    id={`refType-${t.value}`}
                                    checked={refType === t.value}
                                    onChange={() => setRefType(t.value)}
                                    className="form-check-input"
                                />
                                <Label 
                                    className="form-check-label ms-2" 
                                    htmlFor={`refType-${t.value}`}
                                >
                                    <i className={`${t.icon} me-1`}></i>
                                    {t.label}
                                </Label>
                            </div>
                        ))}
                    </Col>

                    {/* بارنامه */}
                    {refType === "barnameh" && (
                        <Col md="9">
                            <Row>
                                <Col md="4">
                                    <Label className="form-label">
                                        <i className="ri-hashtag me-1"></i>
                                        شماره بارنامه
                                        <span className="text-danger ms-1">*</span>
                                    </Label>
                                    <Input
                                        type="text"
                                        value={refValues.barnamehNumber || ""}
                                        onChange={(e) =>
                                            updateRefValue("barnamehNumber", e.target.value)
                                        }
                                        placeholder="شماره بارنامه"
                                    />
                                </Col>

                                <Col md="4">
                                    <Label className="form-label">
                                        <i className="ri-calendar-line me-1"></i>
                                        تاریخ صدور
                                        <span className="text-danger ms-1">*</span>
                                    </Label>
                                    <DatePickerWithIcon
                                        value={barnamehDate}
                                        onChange={setBarnamehDate}
                                        placeholder="تاریخ صدور بارنامه"
                                    />
                                </Col>

                                <Col md="4">
                                    <Label className="form-label">
                                        <i className="ri-barcode-line me-1"></i>
                                        کد رهگیری بارنامه
                                    </Label>
                                    <Input
                                        type="text"
                                        value={refValues.barnamehTracking || ""}
                                        onChange={(e) =>
                                            updateRefValue("barnamehTracking", e.target.value)
                                        }
                                        placeholder="کد رهگیری"
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
                                    <Label className="form-label">
                                        <i className="ri-shield-check-line me-1"></i>
                                        شماره پته
                                        <span className="text-danger ms-1">*</span>
                                    </Label>
                                    <Input
                                        type="text"
                                        value={refValues.pettehNumber || ""}
                                        onChange={(e) =>
                                            updateRefValue("pettehNumber", e.target.value)
                                        }
                                        placeholder="شماره پته گمرکی"
                                    />
                                </Col>

                                <Col md="6" className="d-flex align-items-end">
                                    <Button 
                                        color="primary" 
                                        block
                                        disabled={!refValues.pettehNumber}
                                    >
                                        <i className="ri-search-line me-1"></i>
                                        استعلام پته گمرکی
                                    </Button>
                                </Col>
                            </Row>
                        </Col>
                    )}

                    {/* حواله سامانه جامع */}
                    {refType === "havale" && (
                        <Col md="9">
                            <Row>
                                <Col md="6">
                                    <Label className="form-label">
                                        <i className="ri-file-transfer-line me-1"></i>
                                        شماره حواله
                                        <span className="text-danger ms-1">*</span>
                                    </Label>
                                    <Input
                                        type="text"
                                        value={refValues.havaleNumber || ""}
                                        onChange={(e) =>
                                            updateRefValue("havaleNumber", e.target.value)
                                        }
                                        placeholder="شماره حواله سامانه جامع"
                                    />
                                </Col>

                                <Col md="6" className="d-flex align-items-end">
                                    <Button 
                                        color="primary" 
                                        block
                                        disabled={!refValues.havaleNumber}
                                    >
                                        <i className="ri-search-line me-1"></i>
                                        استعلام حواله
                                    </Button>
                                </Col>
                            </Row>
                        </Col>
                    )}

                    {/* اظهار تولید */}
                    {refType === "production" && (
                        <Col md="9">
                            <Row>
                                <Col md="6">
                                    <Label className="form-label">
                                        <i className="ri-settings-3-line me-1"></i>
                                        شماره اظهار تولید
                                        <span className="text-danger ms-1">*</span>
                                    </Label>
                                    <Input
                                        type="text"
                                        value={refValues.productionNumber || ""}
                                        onChange={(e) =>
                                            updateRefValue("productionNumber", e.target.value)
                                        }
                                        placeholder="شماره سند اظهار تولید"
                                    />
                                </Col>

                                <Col md="6" className="d-flex align-items-end">
                                    <Button 
                                        color="primary" 
                                        block
                                        disabled={!refValues.productionNumber}
                                    >
                                        <i className="ri-search-line me-1"></i>
                                        استعلام سند
                                    </Button>
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
