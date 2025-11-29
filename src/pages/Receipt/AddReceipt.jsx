// src/pages/Receipts/AddReceipt.jsx
import React, { useState } from "react";
import {
  Container, Row, Col, Card, CardBody, Button, Spinner, Alert, Form
} from "reactstrap";
import { post } from "../../helpers/api_helper";
import ReceiptOwnerSection from "../../components/Receipt/ReceiptOwnerSection";
import ReceiptItemsTable from "../../components/Receipt/ReceiptItemsTable";
import DatePickerWithIcon from "../../components/Receipt/DatePickerWithIcon";

const AddReceipt = () => {
  const [saving, setSaving] = useState(false);
  const [owner, setOwner] = useState({});
  const [deliverer, setDeliverer] = useState({});
  const [items, setItems] = useState([]);
  const [docDate, setDocDate] = useState(null);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const saveReceipt = async () => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await post("/receipts", {
        owner: owner.id,
        deliverer: deliverer.id || null,
        docDate: docDate?.toDate?.().toISOString(),
        items: items.map((i) => i.id),
        status: "draft",
      });

      if (res.id) {
        setSuccess("رسید با موفقیت ثبت شد!");
      }
    } catch (err) {
      setError("خطا در ثبت رسید");
    }

    setSaving(false);
  };

  return (
    <div className="page-content">
      <Container fluid>
        <h4>ثبت رسید جدید</h4>

        {error && <Alert color="danger">{error}</Alert>}
        {success && <Alert color="success">{success}</Alert>}

        <Card className="mt-3">
          <CardBody>

            <Form>
              <Row>
                <Col md={4}>
                  <label>تاریخ سند</label>
                  <DatePickerWithIcon value={docDate} onChange={setDocDate} />
                </Col>
              </Row>

              <ReceiptOwnerSection
                owner={owner}
                setOwner={setOwner}
                deliverer={deliverer}
                setDeliverer={setDeliverer}
              />

              {/* جدول اقلام */}
              <ReceiptItemsTable onItemsChange={setItems} />

              <Button
                color="primary"
                className="mt-4"
                disabled={saving}
                onClick={saveReceipt}
              >
                {saving ? <Spinner size="sm" /> : "ثبت رسید"}
              </Button>

            </Form>
          </CardBody>
        </Card>
      </Container>
    </div>
  );
};

export default AddReceipt;
