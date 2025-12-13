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

    // -------------------------------
    // FORMIK
    // -------------------------------
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

            try {
                // 1) Duplicate check
                const allUnits = await get("/product-units");

                const exists = (allUnits.docs || []).some((u) => {
                    const nameEqual = u.name.trim().toLowerCase() === values.name.trim().toLowerCase();
                    const symbolEqual = u.symbol.trim().toLowerCase() === values.symbol.trim().toLowerCase();
                    return nameEqual || symbolEqual;
                });

                if (exists) {
                    setError("واحد دیگری با همین نام یا نماد وجود دارد.");
                    setLoading(false);
                    return;
                }

                // 2) Prepare payload
                const payload = {
                    name: values.name,
                    symbol: values.symbol,
                    description: values.description || "",
                    is_active: values.is_active,
                };

                // 3) Call API
                const result = await post("/product-units", payload);

                // Payload does NOT return {id}, so success criteria must be different
                if (result && result.success !== false) {
                    setSuccess("واحد کالا با موفقیت ثبت شد");

                    setTimeout(() => {
                        formik.resetForm();
                        setSuccess("");
                    }, 1500);
                } else {
                    setError("خطا در ثبت واحد");
                }
            } catch (err) {
                if (err.response?.status === 400)
                    setError(err.response.data?.message || "داده‌های ارسالی نامعتبر است.");
                else if (err.response?.status === 409)
                    setError("این واحد قبلاً ثبت شده است.");
                else setError("خطا در ثبت واحد");
            }

            setLoading(false);
        },
    });

    // -------------------------------
    // RETURN (اصلاح شد — بیرون از useFormik)
    // -------------------------------
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

                                    {/* Alerts */}
                                    {error && (
                                        <Alert color="danger" toggle={() => setError("")}>
                                            {error}
                                        </Alert>
                                    )}

                                    {success && (
                                        <Alert color="success" toggle={() => setSuccess("")}>
                                            {success}
                                        </Alert>
                                    )}

                                    <Form onSubmit={formik.handleSubmit}>
                                        <Row>
                                            {/* Name */}
                                            <Col md={6}>
                                                <div className="mb-3">
                                                    <Label>نام واحد *</Label>
                                                    <Input
                                                        name="name"
                                                        value={formik.values.name}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={formik.touched.name && !!formik.errors.name}
                                                        placeholder="مثال: کیلوگرم"
                                                    />
                                                    <FormFeedback>{formik.errors.name}</FormFeedback>
                                                </div>
                                            </Col>

                                            {/* Symbol */}
                                            <Col md={6}>
                                                <div className="mb-3">
                                                    <Label>نماد *</Label>
                                                    <Input
                                                        name="symbol"
                                                        value={formik.values.symbol}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={formik.touched.symbol && !!formik.errors.symbol}
                                                        placeholder="kg"
                                                    />
                                                    <FormFeedback>{formik.errors.symbol}</FormFeedback>
                                                </div>
                                            </Col>
                                        </Row>

                                        {/* Description */}
                                        <div className="mb-3">
                                            <Label>توضیحات</Label>
                                            <Input
                                                type="textarea"
                                                name="description"
                                                rows="3"
                                                value={formik.values.description}
                                                onChange={formik.handleChange}
                                                placeholder="توضیحات اختیاری..."
                                            />
                                        </div>

                                        {/* Active */}
                                        <div className="form-check form-switch mb-4">
                                            <Input
                                                type="checkbox"
                                                name="is_active"
                                                checked={formik.values.is_active}
                                                onChange={formik.handleChange}
                                            />
                                            <Label className="form-check-label">واحد فعال باشد</Label>
                                        </div>

                                        {/* Buttons */}
                                        <div className="d-flex gap-2">
                                            <Button type="submit" color="primary" disabled={loading}>
                                                {loading ? <Spinner size="sm" /> : "ثبت واحد"}
                                            </Button>

                                            <Button
                                                type="button"
                                                color="secondary"
                                                onClick={() => navigate("/inventory/unit-list")}
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

export default AddUnit;
