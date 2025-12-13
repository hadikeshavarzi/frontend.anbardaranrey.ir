import React from "react";
import { Container, Row, Col, Card, CardBody } from "reactstrap";
import { useParams } from "react-router-dom";

const ClearanceView = () => {
  const { id } = useParams(); // دریافت ID سند ترخیص

  return (
    <div className="page-content">
      <Container fluid>

        {/* عنوان صفحه */}
        <div className="page-title-box d-sm-flex align-items-center justify-content-between">
          <h4 className="mb-sm-0 font-size-18">مشاهده ترخیص</h4>

          <div className="page-title-right">
            <ol className="breadcrumb m-0">
              <li className="breadcrumb-item"><a href="/dashboard">داشبورد</a></li>
              <li className="breadcrumb-item"><a href="/clearances/list">ترخیص کالا</a></li>
              <li className="breadcrumb-item active">مشاهده</li>
            </ol>
          </div>
        </div>

        {/* بدنه صفحه – خالی */}
        <Row>
          <Col lg={12}>
            <Card className="shadow-sm">
              <CardBody>
                {/* نمایش اطلاعات ترخیص بعداً اضافه می‌شود */}
                <div className="text-center text-muted py-5">
                  <h5>🚚 جزئیات ترخیص</h5>
                  <p className="mt-2">شناسه سند: {id}</p>
                  <p>جزئیات کامل این ترخیص بعداً اینجا نمایش داده می‌شود.</p>
                </div>
              </CardBody>
            </Card>
          </Col>
        </Row>

      </Container>
    </div>
  );
};

export default ClearanceView;
