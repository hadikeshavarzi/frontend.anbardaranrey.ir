import React, { useState } from "react";
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
import { useNavigate } from "react-router-dom";
import { get, post } from "../../helpers/api_helper.jsx";

const AddUnit = () => {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const formik = useFormik({
        initialValues: {
            name: "",
            symbol: "",
            description: "",
            is_active: true,
        },
        validationSchema: Yup.object({
            name: Yup.string()
                .required("نام واحد الزامی است")
                .min(2, "نام واحد باید حداقل 2 کاراکتر باشد")
                .max(50, "نام واحد نباید بیشتر از 50 کاراکتر باشد"),
            symbol: Yup.string()
                .required("نماد الزامی است")
                .min(1, "نماد باید حداقل 1 کاراکتر باشد")
                .max(10, "نماد نباید بیشتر از 10 کاراکتر باشد"),
            description: Yup.string().max(500, "توضیحات نباید بیشتر از 500 کاراکتر باشد"),
        }),

        onSubmit: async (values) => {
            setError("");
            setSuccess("");
            setLoading(true);

            console.log("📝 Creating new unit with values:", values);

            try {
                // چک کردن تکراری بودن نام و نماد
                console.log("🔍 Checking for duplicates...");
                const allUnits = await get("/product-units");
                console.log("📦 All units:", allUnits);

                const exists = (allUnits.docs || []).some((u) => {
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
                    setLoading(false);
                    return;
                }

                // ایجاد payload
                const payloadBody = {
                    name: values.name,
                    symbol: values.symbol,
                    description: values.description || "",
                    is_active: values.is_active,
                };

                console.log("🔗 Create URL:", "/product-units");
                console.log("📦 Payload Body:", payloadBody);

                const result = await post("/product-units", payloadBody);

                console.log("✅ Unit created successfully:", result);

                if (result?.id || result?.doc?.id) {
                    setSuccess("واحد کالا با موفقیت ثبت شد");

                    // ریست کردن فرم بعد از 1 ثانیه
                    setTimeout(() => {
                        formik.resetForm();
                        setSuccess("");
                    }, 2000);

                    // اختیاری: رفتن به صفحه لیست بعد از 2.5 ثانیه
                    // setTimeout(() => {
                    //   navigate("/inventory/unit-list");
                    // }, 2500);
                } else {
                    console.warn("⚠️ Unexpected response format:", result);
                    setError("خطا در ثبت واحد");
                }
            } catch (err) {
                console.error("❌ Create error:", err);
                console.error("❌ Error response:", err.response?.data);
                console.error("❌ Error status:", err.response?.status);

                // نمایش پیام خطای دقیق‌تر
                if (err.response?.status === 400) {
                    setError(err.response?.data?.message || "داده‌های ارسالی نامعتبر است.");
                } else if (err.response?.status === 401) {
                    setError("خطای احراز هویت. لطفاً دوباره وارد شوید.");
                } else if (err.response?.status === 409) {
                    setError("واحد با این مشخصات قبلاً ثبت شده است.");
                } else {
                    setError(err.response?.data?.message || "خطا در ثبت واحد");
                }
            }

            setLoading(false);
        },
    });

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    {/* Breadcrumb */}
                    <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                        <h4 className="mb-sm-0 font-size-18">افزودن واحد کالا</h4>

                        <div className="page-title-right">
                            <ol className="breadcrumb m-0">
                                <li className="breadcrumb-item">
                                    <a href="/dashboard">داشبورد</a>
                                </li>
                                <li className="breadcrumb-item">
                                    <a href="/inventory/unit-list">واحدهای کالا</a>
                                </li>
                                <li className="breadcrumb-item active">افزودن واحد</li>
                            </ol>
                        </div>
                    </div>

                    <Row>
                        <Col lg={8} className="mx-auto">
                            <Card>
                                <CardBody>
                                    <div className="d-flex align-items-center mb-4">
                                        <div className="flex-shrink-0 me-3">
                                            <div className="avatar-sm">
                                                <div className="avatar-title rounded-circle bg-soft-primary text-primary font-size-20">
                                                    <i className="bx bx-layer"></i>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex-grow-1">
                                            <h5 className="card-title mb-1">اطلاعات واحد کالا</h5>
                                            <p className="text-muted mb-0">
                                                لطفاً اطلاعات واحد جدید را وارد نمایید
                                            </p>
                                        </div>
                                    </div>

                                    {/* Alert Messages */}
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
                                                        disabled={loading}
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
                                                        disabled={loading}
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
                                                        rows="4"
                                                        placeholder="توضیحات اختیاری درباره واحد..."
                                                        value={formik.values.description}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={
                                                            formik.touched.description && !!formik.errors.description
                                                        }
                                                        disabled={loading}
                                                    />
                                                    <FormFeedback>{formik.errors.description}</FormFeedback>
                                                </div>
                                            </Col>
                                        </Row>

                                        {/* Active Status */}
                                        <Row>
                                            <Col md={12}>
                                                <div className="mb-4">
                                                    <div className="form-check form-switch form-switch-md">
                                                        <Input
                                                            id="is_active"
                                                            name="is_active"
                                                            type="checkbox"
                                                            className="form-check-input"
                                                            checked={formik.values.is_active}
                                                            onChange={formik.handleChange}
                                                            disabled={loading}
                                                        />
                                                        <Label className="form-check-label" htmlFor="is_active">
                                                            واحد فعال باشد
                                                        </Label>
                                                    </div>
                                                    <small className="text-muted">
                                                        واحدهای غیرفعال در لیست انتخاب نمایش داده نمی‌شوند
                                                    </small>
                                                </div>
                                            </Col>
                                        </Row>

                                        {/* Action Buttons */}
                                        <div className="d-flex flex-wrap gap-2">
                                            <Button
                                                type="submit"
                                                color="primary"
                                                className="btn-label"
                                                disabled={loading}
                                            >
                                                <i className="bx bx-check-double label-icon"></i>
                                                {loading ? (
                                                    <>
                                                        <Spinner size="sm" className="me-2" />
                                                        در حال ذخیره...
                                                    </>
                                                ) : (
                                                    "ثبت واحد"
                                                )}
                                            </Button>

                                            <Button
                                                type="button"
                                                color="success"
                                                className="btn-label"
                                                disabled={loading}
                                                onClick={() => {
                                                    formik.resetForm();
                                                    setError("");
                                                    setSuccess("");
                                                }}
                                            >
                                                <i className="bx bx-refresh label-icon"></i>
                                                پاک کردن فرم
                                            </Button>

                                            <Button
                                                type="button"
                                                color="secondary"
                                                className="btn-label"
                                                onClick={() => navigate("/inventory/unit-list")}
                                                disabled={loading}
                                            >
                                                <i className="bx bx-arrow-back label-icon"></i>
                                                بازگشت به لیست
                                            </Button>
                                        </div>
                                    </Form>
                                </CardBody>
                            </Card>

                            {/* Help Card */}
                            <Card className="border border-primary">
                                <CardBody>
                                    <div className="d-flex">
                                        <div className="flex-shrink-0 me-3">
                                            <i className="mdi mdi-information text-primary font-size-24"></i>
                                        </div>
                                        <div className="flex-grow-1">
                                            <h5 className="font-size-14 mb-2">راهنما</h5>
                                            <p className="text-muted mb-1">
                                                <i className="mdi mdi-circle-medium text-success me-1"></i>
                                                نام واحد باید منحصر به فرد باشد
                                            </p>
                                            <p className="text-muted mb-1">
                                                <i className="mdi mdi-circle-medium text-success me-1"></i>
                                                نماد واحد برای نمایش سریع استفاده می‌شود
                                            </p>
                                            <p className="text-muted mb-0">
                                                <i className="mdi mdi-circle-medium text-success me-1"></i>
                                                واحدهای غیرفعال قابل استفاده در سیستم نیستند
                                            </p>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>
        </React.Fragment>
    );
};

export default AddUnit;