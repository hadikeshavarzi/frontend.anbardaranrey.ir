import React from "react";
import { Card, CardBody, Row, Col, Label, Input } from "reactstrap";
import DatePickerWithIcon from "./DatePickerWithIcon";
import PlateInput from "../../components/PlateInput";

const ReceiptHeader = ({
                           birthDateDriver,
                           setBirthDateDriver,
                           dischargeDate,
                           setDischargeDate,
                           plate,
                           setPlate,
                       }) => {
    return (
        <Card className="mb-3 receipt-card">
            <div className="receipt-card-header">
                <div className="title">
                    <i className="ri-user-line me-2"></i>
                    اطلاعات راننده
                </div>
                <div className="subtitle">مشخصات هویتی، تماس و اطلاعات خودرو</div>
            </div>

            <CardBody>

                {/* ردیف اول */}
                <Row className="mb-3">
                    <Col md="4">
                        <Label>کد ملی / کد فراگیر راننده</Label>
                        <Input />
                    </Col>

                    <Col md="4">
                        <Label>تاریخ تولد راننده</Label>
                        <DatePickerWithIcon
                            value={birthDateDriver}
                            onChange={setBirthDateDriver}
                        />
                    </Col>

                    <Col md="4">
                        <Label>نام و نام خانوادگی راننده</Label>
                        <Input />
                    </Col>
                </Row>

                {/* ردیف دوم */}
                <Row className="mb-3">
                    <Col md="4">
                        <Label>تاریخ تخلیه</Label>
                        <DatePickerWithIcon
                            value={dischargeDate}
                            onChange={setDischargeDate}
                        />
                    </Col>

                    <Col md="4">
                        <Label>تلفن راننده</Label>
                        <Input />
                    </Col>

                    <Col md="4">
                        <Label>پلاک خودرو</Label>
                        <PlateInput value={plate} onChange={setPlate} />
                    </Col>
                </Row>

            </CardBody>
        </Card>
    );
};

export default ReceiptHeader;
