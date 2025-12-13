import React, { useEffect, useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  CardBody,
  Button,
  Form,
  Input,
  Label,
  FormFeedback,
  Spinner,
  Alert,
} from "reactstrap";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useParams, useNavigate } from "react-router-dom";
import { get, put } from "../../helpers/api_helper.jsx";

const EditUnit = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [initialData, setInitialData] = useState({
    name: "",
    symbol: "",
    description: "",
    is_active: true,
  });

  // ============================================================
  // Load Unit Data
  // ============================================================
  const loadUnit = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await get(`/product-units/${id}`);

      setInitialData({
        name: res.name || "",
        symbol: res.symbol || "",
        description: res.description || "",
        is_active: res.is_active === true,
      });
    } catch (err) {
      if (err.response?.status === 404) {
        setError("واحد مورد نظر یافت نشد.");
      } else {
        setError("خطا در دریافت اطلاعات واحد.");
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    if (id) loadUnit();
  }, [id]);

  // ============================================================
  // Formik
  // ============================================================
  const formik = useFormik({
    enableReinitialize: true,
    initialValues: initialData,
    validationSchema: Yup.object({
      name: Yup.string().required("نام واحد الزامی است"),
      symbol: Yup.string().required("نماد الزامی است"),
    }),

    onSubmit: async (values) => {
      setSaving(true);
      setError("");
      setSuccess("");

      try {
        // Duplicate check
        const allUnits = await get("/product-units");

        const exists = (allUnits || []).some((u) => {
          if (u.id === Number(id)) return false;

          const sameName =
              u.name.trim().toLowerCase() === values.name.trim().toLowerCase();

          const sameSymbol =
              u.symbol.trim().toLowerCase() === values.symbol.trim().toLowerCase();

          return sameName || sameSymbol;
        });

        if (exists) {
          setError("واحد دیگری با همین نام یا نماد وجود دارد.");
          setSaving(false);
          return;
        }

        // Update body
        const payloadBody = {
          name: values.name,
          symbol: values.symbol,
          description: values.description,
          is_active: values.is_active,
        };

        const result = await put(`/product-units/${id}`, payloadBody);

        if (result?.id) {
          setSuccess("تغییرات با موفقیت ذخیره شد.");
          setTimeout(() => navigate("/inventory/unit-list"), 1200);
        } else {
          setError("خطا در ذخیره تغییرات.");
        }
      } catch (err) {
        if (err.response?.status === 404) {
          setError("واحد مورد نظر یافت نشد.");
        } else {
          setError("خطا در ذخیره تغییرات.");
        }
      }

      setSaving(false);
    },
  });

  // ============================================================
  // Loading State
  // ============================================================
  if (loading) {
    return (
        <div className="page-content">
          <Container fluid>
            <Row>
              <Col lg={8} className="mx-auto">
                <Card>
                  <CardBody className="text-center py-5">
                    <Spinner color="primary" />
                    <div className="mt-3">
                      <h5 className="text-muted">در حال بارگذاری...</h5>
                    </div>
                  </CardBody>
                </Card>
              </Col>
            </Row>
          </Container>
        </div>
    );
  }

  // ============================================================
  // Main Form UI
  // ============================================================
  return (
      <React.Fragment>
        <div className="page-content">
          <Container fluid>
            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
              <h4 className="mb-sm-0 font-size-18">ویرایش واحد کالا</h4>
            </div>

            <Row>
              <Col lg={8} className="mx-auto">
                <Card>
                  <CardBody>
                    <h4 className="card-title mb-4">فرم ویرایش</h4>

                    {error && (
                        <Alert color="danger" className="alert-dismissible fade show">
                          {error}
                          <button
                              type="button"
                              className="btn-close"
                              onClick={() => setError("")}
                          ></button>
                        </Alert>
                    )}

                    {success && (
                        <Alert color="success" className="alert-dismissible fade show">
                          {success}
                          <button
                              type="button"
                              className="btn-close"
                              onClick={() => setSuccess("")}
                          ></button>
                        </Alert>
                    )}

                    <Form
                        onSubmit={(e) => {
                          e.preventDefault();
                          formik.handleSubmit();
                        }}
                    >
                      <Row>
                        {/* Name */}
                        <Col md={6}>
                          <div className="mb-3">
                            <Label htmlFor="name">نام واحد</Label>
                            <Input
                                id="name"
                                name="name"
                                type="text"
                                value={formik.values.name}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                invalid={
                                    formik.touched.name && !!formik.errors.name
                                }
                                disabled={saving}
                            />
                            <FormFeedback>{formik.errors.name}</FormFeedback>
                          </div>
                        </Col>

                        {/* Symbol */}
                        <Col md={6}>
                          <div className="mb-3">
                            <Label htmlFor="symbol">نماد</Label>
                            <Input
                                id="symbol"
                                name="symbol"
                                type="text"
                                value={formik.values.symbol}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                invalid={
                                    formik.touched.symbol && !!formik.errors.symbol
                                }
                                disabled={saving}
                            />
                            <FormFeedback>{formik.errors.symbol}</FormFeedback>
                          </div>
                        </Col>
                      </Row>

                      {/* Description */}
                      <Row>
                        <Col md={12}>
                          <div className="mb-3">
                            <Label htmlFor="description">توضیحات</Label>
                            <Input
                                id="description"
                                name="description"
                                type="textarea"
                                rows="3"
                                value={formik.values.description}
                                onChange={formik.handleChange}
                                disabled={saving}
                            />
                          </div>
                        </Col>
                      </Row>

                      {/* Active */}
                      <Row>
                        <Col md={12}>
                          <div className="form-check form-switch mb-4">
                            <Input
                                id="is_active"
                                name="is_active"
                                type="checkbox"
                                className="form-check-input"
                                checked={formik.values.is_active}
                                onChange={formik.handleChange}
                                disabled={saving}
                            />
                            <Label
                                className="form-check-label"
                                htmlFor="is_active"
                            >
                              فعال باشد
                            </Label>
                          </div>
                        </Col>
                      </Row>

                      <div className="d-flex gap-2">
                        <Button type="submit" color="primary" disabled={saving}>
                          {saving ? (
                              <>
                                <Spinner size="sm" className="me-2" />
                                ذخیره...
                              </>
                          ) : (
                              "ذخیره تغییرات"
                          )}
                        </Button>

                        <Button
                            type="button"
                            color="secondary"
                            onClick={() => navigate("/inventory/unit-list")}
                            disabled={saving}
                        >
                          بازگشت
                        </Button>
                      </div>
                    </Form>
                  </CardBody>
                </Card>
              </Col>
            </Row>
          </Container>
        </div>
      </React.Fragment>
  );
};

export default EditUnit;
