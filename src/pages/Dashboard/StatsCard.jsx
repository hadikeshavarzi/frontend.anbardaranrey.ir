import React from "react";
import { Card, CardBody, Row, Col } from "reactstrap";

const StatsCard = ({ requests }) => {
    const total = requests.length;

    const pending = requests.filter(r => r.status === "pending").length;
    const approved = requests.filter(r => r.status === "approved").length;
    const rejected = requests.filter(r => r.status === "rejected").length;

    return (
        <Card>
            <CardBody>
                <h4 className="mb-4">📊 آمار درخواست‌ها</h4>

                <Row>
                    <Col md="4">
                        <div className="mini-stats-wid">
                            <p className="text-muted mb-2">کل درخواست‌ها</p>
                            <h4>{total}</h4>
                        </div>
                    </Col>

                    <Col md="4">
                        <div className="mini-stats-wid">
                            <p className="text-muted mb-2">در حال بررسی</p>
                            <h4 className="text-warning">{pending}</h4>
                        </div>
                    </Col>

                    <Col md="4">
                        <div className="mini-stats-wid">
                            <p className="text-muted mb-2">تأیید شده</p>
                            <h4 className="text-success">{approved}</h4>
                        </div>
                    </Col>

                    <Col md="4" className="mt-3">
                        <div className="mini-stats-wid">
                            <p className="text-muted mb-2">رد شده</p>
                            <h4 className="text-danger">{rejected}</h4>
                        </div>
                    </Col>
                </Row>
            </CardBody>
        </Card>
    );
};

export default StatsCard;
