// src/components/Receipt/ReceiptPaymentSection.jsx
import React from "react";
import { Card, CardBody, Row, Col, Label, Input } from "reactstrap";

// لیست کامل بانک‌های ایران
const bankList = [
    "ملت","ملی","تجارت","صادرات","سپه","پارسیان","پاسارگاد","اقتصاد نوین","سامان",
    "رفاه","کشاورزی","صنعت و معدن","دی","شهر","مسکن","انصار","مهر اقتصاد",
    "ایران زمین","کارآفرین",
];

const ReceiptPaymentSection = ({ paymentBy, setPaymentBy, paymentInfo, setPaymentInfo }) => {
    return (
        <Card className="mb-3 receipt-card" style={{ marginTop: "25px" }}>
            <div className="receipt-card-header">
                <div className="title">
                    <i className="ri-exchange-dollar-line me-2"></i>
                    پرداخت هزینه‌ها
                </div>
                <div className="subtitle">مشخصات پرداخت و تعیین پرداخت‌کننده</div>
            </div>

            <CardBody style={{ paddingTop: "25px" }}>

                {/* انتخاب پرداخت کننده */}
                <Row className="mb-4">
                    <Col md="4">
                        <Label className="form-label fw-bold">پرداخت توسط *</Label>
                        <Input
                            type="select"
                            className="form-select"
                            value={paymentBy}
                            onChange={(e) => setPaymentBy(e.target.value)}
                        >
                            <option value="customer">مشتری</option>
                            <option value="warehouse">انبار</option>
                        </Input>
                    </Col>
                </Row>

                {/* اگر پرداخت توسط مشتری باشد، فیلدها نمایش داده نمی‌شوند */}
                {paymentBy === "warehouse" && (
                    <>
                        {/* اطلاعات پرداخت */}
                        <Row className="gy-3">

                            <Col md="4">
                                <Label className="form-label">شماره کارت</Label>
                                <Input
                                    placeholder="مثال: 5678-1234-9910-6037"
                                    value={paymentInfo.cardNumber}
                                    onChange={(e) =>
                                        setPaymentInfo({ ...paymentInfo, cardNumber: e.target.value })
                                    }
                                />
                            </Col>

                            <Col md="4">
                                <Label className="form-label">شماره حساب</Label>
                                <Input
                                    placeholder="شماره حساب بانکی"
                                    value={paymentInfo.accountNumber}
                                    onChange={(e) =>
                                        setPaymentInfo({ ...paymentInfo, accountNumber: e.target.value })
                                    }
                                />
                            </Col>

                            <Col md="4">
                                <Label className="form-label">بانک</Label>
                                <Input
                                    type="select"
                                    value={paymentInfo.bankName}
                                    onChange={(e) =>
                                        setPaymentInfo({ ...paymentInfo, bankName: e.target.value })
                                    }
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
                                    value={paymentInfo.ownerName}
                                    onChange={(e) =>
                                        setPaymentInfo({ ...paymentInfo, ownerName: e.target.value })
                                    }
                                />
                            </Col>

                            <Col md="4">
                                <Label className="form-label">شماره پیگیری</Label>
                                <Input
                                    placeholder="کد پیگیری تراکنش"
                                    value={paymentInfo.trackingCode}
                                    onChange={(e) =>
                                        setPaymentInfo({ ...paymentInfo, trackingCode: e.target.value })
                                    }
                                />
                            </Col>
                        </Row>
                    </>
                )}

            </CardBody>
        </Card>
    );
};

export default ReceiptPaymentSection;
