import React from "react";
import { Card, CardBody, Row, Col, Label, Input, Button } from "reactstrap";
import DatePickerWithIcon from "./DatePickerWithIcon";
import PlateInput from "../../components/PlateInput";

const ReceiptRefSection = ({
                               refType,
                               setRefType,
                               barnamehDate,
                               setBarnamehDate,
                               birthDateDriver,
                               setBirthDateDriver,
                               plate,
                               setPlate,
                           }) => {
    return (
        <Card className="mb-3 receipt-card">
            <div className="receipt-card-header">
                <div className="title">
                    <i className="ri-file-list-3-line me-2"></i>
                    اطلاعات سند مرجع
                </div>
                <div className="subtitle">بر اساس نوع مرجع، اطلاعات متفاوت نمایش داده می‌شود</div>
            </div>

            <CardBody>
                <Row>

                    {/* انتخاب نوع مرجع */}
                    <Col md="3">
                        <Label className="fw-bold d-block mb-2">نوع سند مرجع</Label>

                        {[
                            { value: "none", label: "بدون مرجع" },
                            { value: "barnameh", label: "بارنامه" },
                            { value: "petteh", label: "پته گمرکی" },
                            { value: "havale", label: "حواله سامانه جامع انبارها" },
                            { value: "production", label: "سند اظهار تولید" },
                        ].map((t) => (
                            <div className="form-check mt-2" key={t.value}>
                                <Input
                                    type="radio"
                                    name="refType"
                                    checked={refType === t.value}
                                    onChange={() => setRefType(t.value)}
                                    className="form-check-input"
                                />
                                <Label className="form-check-label ms-2">
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
                                    <Label>شماره بارنامه *</Label>
                                    <Input />
                                </Col>

                                <Col md="4">
                                    <Label>تاریخ صدور *</Label>
                                    <DatePickerWithIcon
                                        value={barnamehDate}
                                        onChange={setBarnamehDate}
                                    />
                                </Col>

                                <Col md="4">
                                    <Label>کد رهگیری بارنامه </Label>
                                    <Input />
                                </Col>
                            </Row>
                        </Col>
                    )}

                    {/* پته گمرکی */}
                    {refType === "petteh" && (
                        <Col md="9">
                            <Row>
                                <Col md="4">
                                    <Label>شماره پته *</Label>
                                    <Input />
                                </Col>

                                <Col md="4" className="d-flex align-items-end">
                                    <Button color="primary" block>
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
                                <Col md="4">
                                    <Label>شماره حواله *</Label>
                                    <Input />
                                </Col>

                                <Col md="4" className="d-flex align-items-end">
                                    <Button color="primary" block>
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
                                <Col md="4">
                                    <Label>شماره اظهار تولید *</Label>
                                    <Input />
                                </Col>

                                <Col md="4" className="d-flex align-items-end">
                                    <Button color="primary" block>
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
