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
import { useNavigate, Link } from "react-router-dom";
import { get, post } from "../../helpers/api_helper.jsx";

const AddCategory = () => {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [categories, setCategories] = useState([]);

    /* ============================================================
       Load list of categories for parent dropdown
    ============================================================ */
    useEffect(() => {
        async function loadCategories() {
            try {
                const res = await get("/product-categories");
                setCategories(res?.data || []);
            } catch (err) {
                console.error("❌ Error loading categories:", err);
            }
            setLoadingCategories(false);
        }
        loadCategories();
    }, []);

    /* ============================================================
       Form Schema
    ============================================================ */
    const formik = useFormik({
        initialValues: {
            name: "",
            slug: "",
            parent_id: "",
            description: "",
            is_active: true,
            storage_cost: "",
            loading_cost: "",
        },

        validationSchema: Yup.object({
            name: Yup.string()
                .required("نام دسته‌بندی الزامی است")
                .min(2, "حداقل 2 کاراکتر"),

            slug: Yup.string()
                .required("نامک الزامی است")
                .matches(
                    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
                    "نامک باید فقط شامل حروف کوچک انگلیسی، عدد و خط تیره باشد"
                ),

            storage_cost: Yup.number()
                .nullable()
                .typeError("فقط عدد وارد کنید")
                .min(0, "نباید منفی باشد"),

            loading_cost: Yup.number()
                .nullable()
                .typeError("فقط عدد وارد کنید")
                .min(0, "نباید منفی باشد"),
        }),

        /* ============================================================
           Submit Form
        ============================================================ */
        onSubmit: async (values) => {
            setError("");
            setSuccess("");
            setLoading(true);

            try {
                // Load all for duplicate checking
                const allCats = await get("/product-categories");
                const list = allCats.data || [];

                const exists = list.some((c) => {
                    const nameEqual =
                        c.name.trim().toLowerCase() === values.name.trim().toLowerCase();
                    const slugEqual =
                        c.slug.trim().toLowerCase() === values.slug.trim().toLowerCase();
                    return nameEqual || slugEqual;
                });

                if (exists) {
                    setError("دسته‌ای با همین نام یا نامک وجود دارد.");
                    setLoading(false);
                    return;
                }

                /* Prepare payload for backend */
                const payload = {
                    name: values.name,
                    slug: values.slug,
                    parent_id: values.parent_id ? Number(values.parent_id) : null,
                    description: values.description || "",
                    is_active: values.is_active,
                    storage_cost: values.storage_cost ? Number(values.storage_cost) : null,
                    loading_cost: values.loading_cost ? Number(values.loading_cost) : null,
                };

                const result = await post("/product-categories", payload);

                if (result?.success) {
                    setSuccess("دسته‌بندی با موفقیت ثبت شد");

                    setTimeout(() => {
                        formik.resetForm();
                        setSuccess("");
                    }, 1500);
                } else {
                    setError(result?.message || "خطا در ثبت دسته‌بندی");
                }
            } catch (err) {
                console.error("❌ Create error:", err);
                setError(err.response?.data?.message || "خطا در ثبت دسته‌بندی");
            }

            setLoading(false);
        },
    });

    /* ============================================================
       Auto-generate slug
    ============================================================ */
    const generateSlug = (name) => {
        return name
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^\w\-]+/g, "")
            .replace(/\-\-+/g, "-")
            .replace(/^-+/, "")
            .replace(/-+$/, "");
    };

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>

                    {/* Breadcrumb */}
                    <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                        <h4 className="mb-sm-0 font-size-18">افزودن دسته‌بندی کالا</h4>
                        <div className="page-title-right">
                            <ol className="breadcrumb m-0">
                                <li className="breadcrumb-item">
                                    <Link to="/dashboard">داشبورد</Link>
                                </li>
                                <li className="breadcrumb-item">
                                    <Link to="/inventory/category-list">دسته‌بندی‌ها</Link>
                                </li>
                                <li className="breadcrumb-item active">افزودن دسته‌بندی</li>
                            </ol>
                        </div>
                    </div>

                    <Row>
                        <Col lg={8} className="mx-auto">
                            <Card>
                                <CardBody>

                                    <div className="mb-4">
                                        <h4 className="card-title">اطلاعات دسته‌بندی</h4>
                                        <p className="card-title-desc">
                                            لطفاً اطلاعات دسته جدید را وارد کنید
                                        </p>
                                    </div>

                                    {/* Alerts */}
                                    {error && (
                                        <Alert color="danger" className="alert-dismissible fade show">
                                            {error}
                                            <button type="button" className="btn-close" onClick={() => setError("")}></button>
                                        </Alert>
                                    )}

                                    {success && (
                                        <Alert color="success" className="alert-dismissible fade show">
                                            {success}
                                            <button type="button" className="btn-close" onClick={() => setSuccess("")}></button>
                                        </Alert>
                                    )}

                                    {/* FORM */}
                                    <Form onSubmit={formik.handleSubmit}>

                                        {/* Name + Slug */}
                                        <Row>
                                            <Col md={6}>
                                                <div className="mb-3">
                                                    <Label>نام دسته‌بندی *</Label>
                                                    <Input
                                                        name="name"
                                                        type="text"
                                                        placeholder="مثال: فولاد"
                                                        value={formik.values.name}
                                                        onChange={(e) => {
                                                            formik.handleChange(e);
                                                            formik.setFieldValue("slug", generateSlug(e.target.value));
                                                        }}
                                                        invalid={formik.touched.name && !!formik.errors.name}
                                                    />
                                                    <FormFeedback>{formik.errors.name}</FormFeedback>
                                                </div>
                                            </Col>

                                            <Col md={6}>
                                                <div className="mb-3">
                                                    <Label>نامک (Slug) *</Label>
                                                    <Input
                                                        name="slug"
                                                        type="text"
                                                        placeholder="steel"
                                                        value={formik.values.slug}
                                                        onChange={formik.handleChange}
                                                        invalid={formik.touched.slug && !!formik.errors.slug}
                                                    />
                                                    <FormFeedback>{formik.errors.slug}</FormFeedback>
                                                </div>
                                            </Col>
                                        </Row>

                                        {/* Parent */}
                                        <Row>
                                            <Col md={12}>
                                                <div className="mb-3">
                                                    <Label>دسته والد</Label>

                                                    {loadingCategories ? (
                                                        <Spinner size="sm" />
                                                    ) : (
                                                        <Input
                                                            name="parent_id"
                                                            type="select"
                                                            value={formik.values.parent_id}
                                                            onChange={formik.handleChange}
                                                        >
                                                            <option value="">بدون والد (دسته اصلی)</option>

                                                            {categories.map((cat) => (
                                                                <option key={cat.id} value={cat.id}>
                                                                    {cat.name}
                                                                </option>
                                                            ))}
                                                        </Input>
                                                    )}
                                                </div>
                                            </Col>
                                        </Row>

                                        {/* Description */}
                                        <Row>
                                            <Col md={12}>
                                                <div className="mb-3">
                                                    <Label>توضیحات</Label>
                                                    <Input
                                                        name="description"
                                                        type="textarea"
                                                        rows="4"
                                                        value={formik.values.description}
                                                        onChange={formik.handleChange}
                                                    />
                                                </div>
                                            </Col>
                                        </Row>

                                        {/* Costs */}
                                        <Row>
                                            <Col md={6}>
                                                <div className="mb-3">
                                                    <Label>هزینه انبارداری</Label>
                                                    <Input
                                                        name="storage_cost"
                                                        type="number"
                                                        placeholder="مثلاً 5000"
                                                        value={formik.values.storage_cost}
                                                        onChange={formik.handleChange}
                                                        invalid={formik.touched.storage_cost && !!formik.errors.storage_cost}
                                                    />
                                                    <FormFeedback>{formik.errors.storage_cost}</FormFeedback>
                                                </div>
                                            </Col>

                                            <Col md={6}>
                                                <div className="mb-3">
                                                    <Label>هزینه بارگیری</Label>
                                                    <Input
                                                        name="loading_cost"
                                                        type="number"
                                                        placeholder="مثلاً 20000"
                                                        value={formik.values.loading_cost}
                                                        onChange={formik.handleChange}
                                                        invalid={formik.touched.loading_cost && !!formik.errors.loading_cost}
                                                    />
                                                    <FormFeedback>{formik.errors.loading_cost}</FormFeedback>
                                                </div>
                                            </Col>
                                        </Row>

                                        {/* Active */}
                                        <Row>
                                            <Col md={12}>
                                                <div className="form-check form-switch mb-4">
                                                    <Input
                                                        type="checkbox"
                                                        name="is_active"
                                                        className="form-check-input"
                                                        checked={formik.values.is_active}
                                                        onChange={formik.handleChange}
                                                    />
                                                    <Label className="form-check-label">
                                                        دسته‌بندی فعال باشد
                                                    </Label>
                                                </div>
                                            </Col>
                                        </Row>

                                        {/* Buttons */}
                                        <div className="d-flex flex-wrap gap-2">
                                            <Button type="submit" color="primary" disabled={loading}>
                                                {loading ? (
                                                    <>
                                                        <Spinner size="sm" className="me-2" />
                                                        در حال ذخیره...
                                                    </>
                                                ) : (
                                                    <>
                                                        <i className="bx bx-check-double me-1"></i>
                                                        ثبت دسته‌بندی
                                                    </>
                                                )}
                                            </Button>

                                            <Button type="button" color="light" onClick={() => formik.resetForm()} disabled={loading}>
                                                پاک کردن فرم
                                            </Button>

                                            <Button type="button" color="secondary" onClick={() => navigate("/inventory/category-list")}>
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

export default AddCategory;
