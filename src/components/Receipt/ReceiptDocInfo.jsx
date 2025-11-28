import React from "react";
import { Card, CardBody, Row, Col, Label, Input } from "reactstrap";
import DatePickerWithIcon from "./DatePickerWithIcon";

const ReceiptDocInfo = ({ docDate, setDocDate }) => {
    return (
        <Card className="mb-3 receipt-card">
            <div className="receipt-card-header">
                <div className="title">
                    <i className="ri-file-paper-line me-2"></i>
                    اطلاعات سند
                </div>
                <div className="subtitle">شماره رسید، تاریخ سند و کد عطف</div>
            </div>

            <CardBody>
                <Row className="mb-3">

                    {/* تاریخ سند */}
                    <Col md="4">
                        <Label>تاریخ سند *</Label>
                        <DatePickerWithIcon
                            value={docDate}
                            onChange={setDocDate}
                        />
                    </Col>

                    {/* کد عطف */}
                    <Col md="4">
                        <Label>کد عطف</Label>
                        <Input />
                    </Col>

                    {/* شماره رسید */}
                    <Col md="4">
                        <Label>شماره رسید</Label>
                        <Input disabled placeholder="— تولید خودکار —" />
                    </Col>

                </Row>
            </CardBody>
        </Card>
    );
};

export default ReceiptDocInfo;
