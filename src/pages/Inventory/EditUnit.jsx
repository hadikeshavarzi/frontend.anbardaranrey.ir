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
import { get, patch } from "../../helpers/api_helper.jsx";

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

  // لود اطلاعات واحد
  const loadUnit = async () => {
    setLoading(true);
    setError("");

    console.log("🔍 Loading unit with ID:", id);
    console.log("🔗 API URL:", `/product-units/${id}`);

    try {
      const res = await get(`/product-units/${id}`);
      console.log("✅ Unit loaded successfully:", res);

      setInitialData({
        name: res.name || "",
        symbol: res.symbol || "",
        description: res.description || "",
        is_active: typeof res.is_active === "boolean" ? res.is_active : true,
      });
    } catch (err) {
      console.error("❌ Error loading unit:", err);
      console.error("❌ Error response:", err.response?.data);
      console.error("❌ Error status:", err.response?.status);

      if (err.response?.status === 404) {
        setError("واحد مورد نظر یافت نشد. ممکن است حذف شده باشد.");
      } else {
        setError(err.response?.data?.message || "خطا در دریافت اطلاعات واحد");
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    if (id) {
      loadUnit();
    }
  }, [id]);

  // فرم
  const formik = useFormik({
    enableReinitialize: true,
    initialValues: initialData,
    validationSchema: Yup.object({
      name: Yup.string()
          .required("نام واحد الزامی است")
          .min(2, "نام واحد باید حداقل 2 کاراکتر باشد"),
      symbol: Yup.string()
          .required("نماد الزامی است")
          .min(1, "نماد باید حداقل 1 کاراکتر باشد"),
    }),
    onSubmit: async (values) => {
      setError("");
      setSuccess("");
      setSaving(true);

      console.log("📝 Form submitted with values:", values);

      try {
        // چک تکراری بودن
        console.log("🔍 Checking for duplicates...");
        const allUnits = await get("/product-units");
        console.log("📦 All units:", allUnits);

        const exists = (allUnits.docs || []).some((u) => {
          if (u.id === Number(id) || u.id === id) return false;
          const nameEqual =
              (u.name || "").trim().toLowerCase() ===
              values.name.trim().toLowerCase();
          const symbolEqual =
              (u.symbol || "").trim().toLowerCase() ===
              values.symbol.trim().toLowerCase();
          return nameEqual || symbolEqual;
        });

        if (exists) {
          console.warn("⚠️ Duplicate found!");
          setError("واحد دیگری با همین نام یا نماد وجود دارد.");
          setSaving(false);
          return;
        }

        const payloadBody = {
          name: values.name,
          symbol: values.symbol,
          description: values.description || "",
          is_active: values.is_active,
        };

        console.log("🔗 Update URL:", `/product-units/${id}`);
        console.log("📦 Payload Body:", payloadBody);

        const result = await patch(`/product-units/${id}`, payloadBody);

        console.log("✅ Update successful:", result);

        if (result?.id || result?.doc?.id) {
          setSuccess("تغییرات با موفقیت ذخیره شد");

          setTimeout(() => {
            navigate("/inventory/unit-list");
          }, 1500);
        } else {
          console.warn("⚠️ Unexpected response format:", result);
          setError("خطا در ذخیره تغییرات");
        }
      } catch (err) {
        console.error("❌ Update error:", err);
        console.error("❌ Error response:", err.response?.data);
        console.error("❌ Error status:", err.response?.status);
        console.error("❌ Error config:", err.config);

        if (err.response?.status === 404) {
          setError("واحد مورد نظر یافت نشد. ممکن است حذف شده باشد.");
        } else if (err.response?.status === 400) {
          setError(err.response?.data?.message || "داده‌های ارسالی نامعتبر است.");
        } else if (err.response?.status === 401) {
          setError("خطای احراز هویت. لطفاً دوباره وارد شوید.");
        } else {
          setError(err.response?.data?.message || "خطا در ذخیره تغییرات");
        }
      }

      setSaving(false);
    },
  });

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

  return (
      <React.Fragment>
        <div className="page-content">
          <Container fluid>
            {/* Breadcrumb */}
            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
              <h4 className="mb-sm-0 font-size-18">ویرایش واحد کالا</h4>

              <div className="page-title-right">
                <ol className="breadcrumb m-0">
                  <li className="breadcrumb-item">
                    <a href="/dashboard">داشبورد</a>
                  </li>
                  <li className="breadcrumb-item">
                    <a href="/inventory/unit-list">واحدهای کالا</a>
                  </li>
                  <li className="breadcrumb-item active">ویرایش واحد</li>
                </ol>
              </div>
            </div>

            <Row>
              <Col lg={8} className="mx-auto">
                <Card>
                  <CardBody>
                    <div className="mb-4">
                      <h4 className="card-title">ویرایش واحد کالا</h4>
                      <p className="card-title-desc">
                        اطلاعات واحد را ویرایش نمایید
                      </p>
                    </div>

                    {/* Alerts */}
                    {error && (
                        <Alert color="danger" className="alert-dismissible fade show">
                          <i className="mdi mdi-block-helper me-2"></i>
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
                          <i className="mdi mdi-check-all me-2"></i>
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
                            <Label htmlFor="name" className="form-label">
                              نام واحد <span className="text-danger">*</span>
                            </Label>
                            <Input
                                id="name"
                                name="name"
                                type="text"
                                placeholder="مثال: کیلوگرم"
                                value={formik.values.name}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                invalid={formik.touched.name && !!formik.errors.name}
                                disabled={saving}
                            />
                            <FormFeedback>{formik.errors.name}</FormFeedback>
                          </div>
                        </Col>

                        {/* Symbol */}
                        <Col md={6}>
                          <div className="mb-3">
                            <Label htmlFor="symbol" className="form-label">
                              نماد <span className="text-danger">*</span>
                            </Label>
                            <Input
                                id="symbol"
                                name="symbol"
                                type="text"
                                placeholder="مثال: kg"
                                value={formik.values.symbol}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                invalid={formik.touched.symbol && !!formik.errors.symbol}
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
                            <Label htmlFor="description" className="form-label">
                              توضیحات
                            </Label>
                            <Input
                                id="description"
                                name="description"
                                type="textarea"
                                rows="3"
                                placeholder="توضیحات اختیاری..."
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
                          <div className="mb-4">
                            <div className="form-check form-switch">
                              <Input
                                  id="is_active"
                                  name="is_active"
                                  type="checkbox"
                                  className="form-check-input"
                                  checked={formik.values.is_active}
                                  onChange={formik.handleChange}
                                  disabled={saving}
                              />
                              <Label className="form-check-label" htmlFor="is_active">
                                فعال
                              </Label>
                            </div>
                          </div>
                        </Col>
                      </Row>

                      {/* Buttons */}
                      <div className="d-flex flex-wrap gap-2">
                        <Button
                            type="submit"
                            color="primary"
                            disabled={saving}
                        >
                          {saving ? (
                              <>
                                <Spinner size="sm" className="me-2" />
                                در حال ذخیره...
                              </>
                          ) : (
                              <>
                                <i className="bx bx-check-double me-1"></i>
                                ذخیره تغییرات
                              </>
                          )}
                        </Button>

                        <Button
                            type="button"
                            color="secondary"
                            onClick={() => navigate("/inventory/unit-list")}
                            disabled={saving}
                        >
                          <i className="bx bx-arrow-back me-1"></i>
                          بازگشت به لیست
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