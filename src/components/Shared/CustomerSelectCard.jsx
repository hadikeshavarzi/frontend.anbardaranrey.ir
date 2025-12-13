import React, { useEffect, useState } from "react";
import { Card, CardBody, Row, Col, Label } from "reactstrap";
import Select from "react-select";
import { fetchCustomers } from "../../api/customer";
import { selectStyles } from "../Styles/selectStyles";

const CustomerSelectCard = ({ value, onChange }) => {
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState([]);

  // =========================
  // 1) Load customers on mount
  // =========================
  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const list = await fetchCustomers();
      setCustomers(list);
    } catch (err) {
      console.error("Error loading customers:", err);
    }
    setLoading(false);
  };

  // =========================
  // 2) Build react-select options
  // =========================
  const customerOptions = customers.map((c) => ({
    value: c.id,
    label: `${c.name} — ${c.mobile || "بدون موبایل"}`,
    full: c,
  }));

  // =========================
  // 3) On select
  // =========================
  const handleSelect = (selected) => {
    if (!selected) return;

    const d = selected.full;

    onChange({
      id: d.id,
      name: d.name,
      nationalId: d.nationalId,
      mobile: d.mobile,
      birthDate: d.birthOrRegisterDate,
      customerType: d.customerType,
    });
  };

  return (
    <Card className="mb-3 shadow-sm">

      {/* ---------- Card Header ---------- */}
      <div className="card-header bg-light">
        <h5 className="card-title mb-1 d-flex align-items-center">
          <i className="ri-user-star-line ms-2 text-primary"></i>
          انتخاب مشتری / مالک کالا
        </h5>
        <p className="card-subtitle text-muted small">
          مشتری موردنظر را انتخاب کنید تا اطلاعات او پایین نمایش داده شود.
        </p>
      </div>

      {/* ---------- Card Body ---------- */}
      <CardBody>
        <Row className="gy-3">

          {/* Select Input */}
          <Col md="6">
            <Label className="form-label fw-bold">نام مشتری</Label>
            <Select
  isLoading={loading}
  options={customerOptions}
  value={
    value?.id
      ? customerOptions.find((o) => o.value === value.id)
      : null
  }
  onChange={handleSelect}
  placeholder="جستجو یا انتخاب مشتری..."
  isSearchable
  className="react-select-container"
  classNamePrefix="react-select"
  menuPortalTarget={document.body}
  styles={selectStyles}
/>
          </Col>

          {/* Customer Info Box */}
          <Col md="6">
            {value?.id && (
              <div className="p-3 bg-light border rounded shadow-sm">
                <div className="fw-bold mb-1">{value.name}</div>
                {value.customerType && (
                  <div className="small mb-1">
                    نوع: {value.customerType === "real" ? "حقیقی" : "حقوقی"}
                  </div>
                )}
                <div className="small text-muted">موبایل: {value.mobile}</div>
                <div className="small text-muted mt-1">
                  کد ملی / شناسه: {value.nationalId}
                </div>
              </div>
            )}
          </Col>

        </Row>
      </CardBody>
    </Card>
  );
};

export default CustomerSelectCard;
