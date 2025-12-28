import React from "react";
import { Card, CardBody, Row, Col, Label, Input } from "reactstrap";
import Select from "react-select"; // ✅ برای انتخاب بانک/صندوق سیستم

const bankList = [
    "ملت", "ملی", "تجارت", "صادرات", "سپه", "پارسیان", "پاسارگاد", "اقتصاد نوین", "سامان",
    "رفاه", "کشاورزی", "صنعت و معدن", "دی", "شهر", "مسکن", "انصار", "مهر اقتصاد",
    "ایران زمین", "کارآفرین"
];

// ✅ sourceOptions: لیستی از بانک‌ها و صندوق‌های سیستم است که از کامپوننت والد پاس داده می‌شود
export default function ReceiptPaymentSection({ value, onChange, sourceOptions = [] }) {
    const { paymentBy, info = {} } = value;

    const update = (field, val) => {
        onChange({ ...value, [field]: val });
    };

    const updateInfo = (field, val) => {
        onChange({
            ...value,
            info: {
                ...info,
                [field]: val,
            },
        });
    };

    return (
        <Card className="mb-3 receipt-card" style={{ marginTop: 25 }}>
            <div className="receipt-card-header">
                <div className="title">
                    <i className="ri-exchange-dollar-line me-2"></i>
                    پرداخت هزینه‌ها
                </div>
                <div className="subtitle">مشخصات پرداخت و تعیین پرداخت‌کننده</div>
            </div>

            <CardBody style={{ paddingTop: 25 }}>

                {/* انتخاب پرداخت کننده */}
                <Row className="mb-4">
                    <Col md="4">
                        <Label className="form-label fw-bold">پرداخت توسط *</Label>
                        <Input
                            type="select"
                            className="form-select"
                            value={paymentBy}
                            onChange={(e) => update("paymentBy", e.target.value)}
                        >
                            <option value="customer">مشتری ( به عهده مشتری)</option>
                            <option value="warehouse">انبار </option>
                        </Input>
                    </Col>
                </Row>

                {/* اطلاعات پرداخت فقط برای زمانی که انبار پرداخت کند */}
                {paymentBy === "warehouse" && (
                    <div className="bg-light p-3 rounded border">
                        <h6 className="text-primary mb-3 fw-bold">اطلاعات حسابداری (جهت ثبت سند)</h6>
                        <Row className="gy-3 mb-4">
                            {/* ✅ فیلد جدید: مبلغ */}
                            <Col md="6">
                                <Label className="form-label fw-bold">مبلغ پرداختی (ریال) *</Label>
                                <Input
                                    type="text"
                                    className="fw-bold text-center"
                                    placeholder="0"
                                    value={info.amount ? Number(info.amount).toLocaleString() : ""}
                                    onChange={(e) => updateInfo("amount", e.target.value.replace(/[^0-9]/g, ""))}
                                />
                            </Col>

                            {/* ✅ فیلد جدید: انتخاب منبع (صندوق/بانک سیستم) */}
                            <Col md="6">
                                <Label className="form-label fw-bold">منبع پرداخت (صندوق/بانک) *</Label>
                                <Select
                                    options={sourceOptions}
                                    value={info.selectedSource}
                                    onChange={(val) => updateInfo("selectedSource", val)}
                                    placeholder="انتخاب کنید که پول از کجا پرداخت شده..."
                                    menuPlacement="auto"
                                />
                                <div className="form-text text-muted font-size-11">
                                    با انتخاب این گزینه، سند حسابداری از این منبع کسر خواهد شد.
                                </div>
                            </Col>
                        </Row>

                        <hr />
                        <h6 className="text-secondary mb-3 font-size-13">اطلاعات تکمیلی (اختیاری)</h6>

                        <Row className="gy-3">
                            <Col md="3">
                                <Label className="form-label">شماره پیگیری / ارجاع</Label>
                                <Input
                                    placeholder="کد پیگیری تراکنش"
                                    value={info.trackingCode || ""}
                                    onChange={(e) => updateInfo("trackingCode", e.target.value)}
                                />
                            </Col>

                            <Col md="3">
                                <Label className="form-label">شماره کارت مقصد</Label>
                                <Input
                                    placeholder="کارت راننده/باربری"
                                    value={info.cardNumber || ""}
                                    onChange={(e) => updateInfo("cardNumber", e.target.value)}
                                />
                            </Col>

                            <Col md="3">
                                <Label className="form-label">بانک مقصد</Label>
                                <Input
                                    type="select"
                                    value={info.bankName || ""}
                                    onChange={(e) => updateInfo("bankName", e.target.value)}
                                >
                                    <option value="">انتخاب کنید…</option>
                                    {bankList.map((bank) => (
                                        <option key={bank} value={bank}>{bank}</option>
                                    ))}
                                </Input>
                            </Col>

                            <Col md="3">
                                <Label className="form-label">نام صاحب حساب</Label>
                                <Input
                                    placeholder="نام راننده"
                                    value={info.ownerName || ""}
                                    onChange={(e) => updateInfo("ownerName", e.target.value)}
                                />
                            </Col>
                        </Row>
                    </div>
                )}

            </CardBody>
        </Card>
    );
}