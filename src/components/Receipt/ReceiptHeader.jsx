// src/components/Receipt/ReceiptHeader.jsx
import React from "react";
import { Card, CardBody, Row, Col, Label, Input } from "reactstrap";
import DatePickerWithIcon from "../Shared/DatePickerWithIcon";
import PlateInput from "../PlateInput";

export default function ReceiptHeader({ value, onChange }) {
    const driver = value.driver || {};
    const plate = value.plate || {};

    // آپدیت عمومی
    const update = (field, val) => {
        onChange({
            ...value,
            [field]: val,
        });
    };

    // آپدیت راننده
    const updateDriver = (field, val) => {
        update("driver", {
            ...driver,
            [field]: val,
        });
    };

    return (
        <Card className="mb-3 receipt-card">
            <div className="receipt-card-header">
                <div className="title">
                    <i className="ri-user-line me-2"></i>
                    راننده و خودرو
                </div>
            </div>

            <CardBody>

                {/* ردیف اول */}
                <Row className="mb-3">
                    <Col md="4">
                        <Label>کد ملی راننده</Label>
                        <Input
                            value={driver.nationalId || ""}
                            maxLength={10}
                            onChange={(e) =>
                                updateDriver("nationalId", e.target.value)
                            }
                        />
                    </Col>

                    <Col md="4">
                        <Label>تاریخ تولد راننده</Label>
                        <DatePickerWithIcon
                            name="birthDateDriver"
                            value={value.birthDateDriver}
                            onChange={(val, name) => update(name, val)}
                        />
                    </Col>

                    <Col md="4">
                        <Label>نام راننده</Label>
                        <Input
                            value={driver.name || ""}
                            onChange={(e) =>
                                updateDriver("name", e.target.value)
                            }
                        />
                    </Col>
                </Row>

                {/* ردیف دوم */}
                <Row className="mb-3">
                    <Col md="4">
                        <Label>تاریخ تخلیه</Label>
                        <DatePickerWithIcon
                            name="dischargeDate"
                            value={value.dischargeDate}
                            onChange={(val, name) => update(name, val)}
                        />
                    </Col>

                    <Col md="4">
                        <Label>تلفن راننده</Label>
                        <Input
                            value={driver.phone || ""}
                            maxLength={11}
                            onChange={(e) =>
                                updateDriver("phone", e.target.value)
                            }
                        />
                    </Col>

                    <Col md="4">
                        <Label>پلاک خودرو</Label>
                        <PlateInput
                            value={plate}
                            onChange={(v) => update("plate", v)}
                        />
                    </Col>
                </Row>

            </CardBody>
        </Card>
    );
}
