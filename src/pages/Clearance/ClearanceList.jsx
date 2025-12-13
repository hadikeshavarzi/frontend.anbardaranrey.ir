import React from "react";
import { Container, Row, Col, Card, CardBody } from "reactstrap";

const ClearanceList = () => {
  return (
    <div className="page-content">
      <Container fluid>

        {/* عنوان صفحه */}
        <div className="page-title-box d-sm-flex align-items-center justify-content-between">
          <h4 className="mb-sm-0 font-size-18">لیست ترخیص‌ها</h4>

          <div className="page-title-right">
            <ol className="breadcrumb m-0">
              <li className="breadcrumb-item"><a href="/dashboard">داشبورد</a></li>
              <li className="breadcrumb-item"><a href="/clearances/list">ترخیص کالا</a></li>
              <li className="breadcrumb-item active">لیست</li>
            </ol>
          </div>
        </div>

        {/* بدنه صفحه – الان خالی */}
        <Row>
          <Col lg={12}>
            <Card className="shadow-sm">
              <CardBody>
                {/* اینجا جدول لیست بعداً اضافه می‌شود */}
                <div className="text-center text-muted py-5">
                  <h5>🗂️ لیست ترخیص‌ها</h5>
                  <p className="mt-2">در آینده جدول و فیلترها اینجا قرار می‌گیرند.</p>
                </div>
              </CardBody>
            </Card>
          </Col>
        </Row>

      </Container>
    </div>
  );
};

export default ClearanceList;
