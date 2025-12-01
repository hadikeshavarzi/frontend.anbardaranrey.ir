import React from "react";
import { Card, CardBody, Row, Col, Label, Input } from "reactstrap";
import DatePickerWithIcon from "./DatePickerWithIcon";
import PlateInput from "../PlateInput";

const ReceiptHeader = ({
    birthDateDriver,
    setBirthDateDriver,
    dischargeDate,
    setDischargeDate,
    plate,
    setPlate,
    driver,
    setDriver,
}) => {
    // ⭐ تابع کمکی برای به‌روزرسانی فیلدهای راننده
    const updateDriverField = (field, value) => {
        setDriver((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    // ⭐ تابع کمکی برای به‌روزرسانی فیلدهای پلاک
    const updatePlateField = (field, value) => {
        setPlate((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    return (
        <Card className="mb-3 receipt-card">
            <div className="receipt-card-header">
                <div className="title">
                    <i className="ri-user-line me-2"></i>
                    اطلاعات راننده و خودرو
                </div>
                <div className="subtitle">مشخصات هویتی، تماس و اطلاعات خودرو</div>
            </div>

            <CardBody>
                {/* ردیف اول: مشخصات راننده */}
                <Row className="mb-3">
                    <Col md="4">
                        <Label className="form-label">
                            <i className="ri-id-card-line me-1"></i>
                            کد ملی / کد فراگیر راننده
                        </Label>
                        <Input
                            type="text"
                            value={driver.nationalId || ""}
                            onChange={(e) =>
                                updateDriverField("nationalId", e.target.value)
                            }
                            placeholder="کد ملی یا کد فراگیر"
                            maxLength={10}
                        />
                    </Col>

                    <Col md="4">
                        <Label className="form-label">
                            <i className="ri-calendar-line me-1"></i>
                            تاریخ تولد راننده
                        </Label>
                        <DatePickerWithIcon
                            value={birthDateDriver}
                            onChange={setBirthDateDriver}
                            placeholder="تاریخ تولد"
                        />
                    </Col>

                    <Col md="4">
                        <Label className="form-label">
                            <i className="ri-user-3-line me-1"></i>
                            نام و نام خانوادگی راننده
                        </Label>
                        <Input
                            type="text"
                            value={driver.name || ""}
                            onChange={(e) =>
                                updateDriverField("name", e.target.value)
                            }
                            placeholder="نام و نام خانوادگی"
                        />
                    </Col>
                </Row>

                {/* ردیف دوم: تاریخ تخلیه، تلفن و پلاک */}
                <Row className="mb-3">
                    <Col md="4">
                        <Label className="form-label">
                            <i className="ri-calendar-check-line me-1"></i>
                            تاریخ تخلیه
                        </Label>
                        <DatePickerWithIcon
                            value={dischargeDate}
                            onChange={setDischargeDate}
                            placeholder="تاریخ تخلیه کالا"
                        />
                    </Col>

                    <Col md="4">
                        <Label className="form-label">
                            <i className="ri-phone-line me-1"></i>
                            تلفن راننده
                        </Label>
                        <Input
                            type="tel"
                            value={driver.phone || ""}
                            onChange={(e) =>
                                updateDriverField("phone", e.target.value)
                            }
                            placeholder="09xxxxxxxxx"
                            maxLength={11}
                        />
                    </Col>

                    <Col md="4">
                        <Label className="form-label">
                            <i className="ri-car-line me-1"></i>
                            پلاک خودرو
                        </Label>
                        <PlateInput 
                            value={plate} 
                            onChange={setPlate}
                        />
                    </Col>
                </Row>
            </CardBody>
        </Card>
    );
};

export default ReceiptHeader;
