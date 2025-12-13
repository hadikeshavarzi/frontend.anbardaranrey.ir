// src/components/Receipt/ReceiptPaymentSection.jsx
import React from "react";
import { Card, CardBody, Row, Col, Label, Input } from "reactstrap";

const bankList = [
    "ملت", "ملی", "تجارت", "صادرات", "سپه", "پارسیان", "پاسارگاد", "اقتصاد نوین", "سامان",
    "رفاه", "کشاورزی", "صنعت و معدن", "دی", "شهر", "مسکن", "انصار", "مهر اقتصاد",
    "ایران زمین", "کارآفرین"
];

export default function ReceiptPaymentSection({ value, onChange }) {
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
                            <option value="customer">مشتری</option>
                            <option value="warehouse">انبار</option>
                        </Input>
                    </Col>
                </Row>

                {/* اطلاعات پرداخت فقط برای زمانی که انبار پرداخت کند */}
                {paymentBy === "warehouse" && (
                    <>
                        <Row className="gy-3">

                            <Col md="4">
                                <Label className="form-label">شماره کارت</Label>
                                <Input
                                    placeholder="مثال: 6037-9910-1234-5678"
                                    value={info.cardNumber || ""}
                                    onChange={(e) => updateInfo("cardNumber", e.target.value)}
                                />
                            </Col>

                            <Col md="4">
                                <Label className="form-label">شماره حساب</Label>
                                <Input
                                    placeholder="شماره حساب بانکی"
                                    value={info.accountNumber || ""}
                                    onChange={(e) => updateInfo("accountNumber", e.target.value)}
                                />
                            </Col>

                            <Col md="4">
                                <Label className="form-label">بانک</Label>
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
                        </Row>

                        <Row className="gy-3 mt-1">
                            <Col md="4">
                                <Label className="form-label">صاحب حساب</Label>
                                <Input
                                    placeholder="نام دارنده حساب"
                                    value={info.ownerName || ""}
                                    onChange={(e) => updateInfo("ownerName", e.target.value)}
                                />
                            </Col>

                            <Col md="4">
                                <Label className="form-label">شماره پیگیری</Label>
                                <Input
                                    placeholder="کد پیگیری تراکنش"
                                    value={info.trackingCode || ""}
                                    onChange={(e) => updateInfo("trackingCode", e.target.value)}
                                />
                            </Col>
                        </Row>
                    </>
                )}

            </CardBody>
        </Card>
    );
}
