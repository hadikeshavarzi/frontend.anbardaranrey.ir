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

    // لود دسته‌بندی‌ها برای انتخاب والد
    useEffect(() => {
        async function loadCategories() {
            setLoadingCategories(true);
            try {
                const res = await get("/product-categories");
                setCategories(res?.docs || []);
            } catch (err) {
                console.error("Error loading categories:", err);
            }
            setLoadingCategories(false);
        }
        loadCategories();
    }, []);

    const formik = useFormik({
        initialValues: {
            name: "",
            slug: "",
            parent: "",
            description: "",
            is_active: true,
            storage_cost: "",
            loading_cost: "",
        },

        validationSchema: Yup.object({
            name: Yup.string()
                .required("نام دسته‌بندی الزامی است")
                .min(2, "نام دسته باید حداقل 2 کاراکتر باشد"),

            slug: Yup.string()
                .required("نامک الزامی است")
                .matches(
                    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
                    "نامک باید فقط شامل حروف کوچک انگلیسی، اعداد و خط تیره باشد"
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

        onSubmit: async (values) => {
            setError("");
            setSuccess("");
            setLoading(true);

            try {
                // چک تکراری بودن
                const allCategories = await get("/product-categories");
                const exists = (allCategories.docs || []).some((c) => {
                    const nameEqual =
                        (c.name || "").trim().toLowerCase() ===
                        values.name.trim().toLowerCase();

                    const slugEqual =
                        (c.slug || "").trim().toLowerCase() ===
                        values.slug.trim().toLowerCase();

                    return nameEqual || slugEqual;
                });

                if (exists) {
                    setError("دسته‌بندی دیگری با همین نام یا نامک وجود دارد.");
                    setLoading(false);
                    return;
                }

                const result = await post("/product-categories", {
                    name: values.name,
                    slug: values.slug,
                    parent: values.parent ? Number(values.parent) : null,
                    description: values.description || "",
                    is_active: values.is_active,
                    storage_cost: values.storage_cost
                        ? Number(values.storage_cost)
                        : null,
                    loading_cost: values.loading_cost
                        ? Number(values.loading_cost)
                        : null,
                });

                if (result?.id || result?.doc?.id) {
                    setSuccess("دسته‌بندی با موفقیت ثبت شد");

                    setTimeout(() => {
                        formik.resetForm();
                        setSuccess("");
                    }, 2000);
                } else {
                    setError("خطا در ثبت دسته‌بندی");
                }
            } catch (err) {
                console.error("❌ Create error:", err);
                setError(err.response?.data?.message || "خطا در ثبت دسته‌بندی");
            }

            setLoading(false);
        },
    });

    // تولید خودکار slug از نام
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
                                            لطفاً اطلاعات دسته‌بندی جدید را وارد نمایید
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
                                                        نام دسته‌بندی <span className="text-danger">*</span>
                                                    </Label>
                                                    <Input
                                                        id="name"
                                                        name="name"
                                                        type="text"
                                                        placeholder="مثال: لوازم الکترونیکی"
                                                        value={formik.values.name}
                                                        onChange={(e) => {
                                                            formik.handleChange(e);
                                                            if (!formik.touched.slug) {
                                                                formik.setFieldValue(
                                                                    "slug",
                                                                    generateSlug(e.target.value)
                                                                );
                                                            }
                                                        }}
                                                        onBlur={formik.handleBlur}
                                                        invalid={
                                                            formik.touched.name &&
                                                            !!formik.errors.name
                                                        }
                                                        disabled={loading}
                                                    />
                                                    <FormFeedback>
                                                        {formik.errors.name}
                                                    </FormFeedback>
                                                </div>
                                            </Col>

                                            {/* Slug */}
                                            <Col md={6}>
                                                <div className="mb-3">
                                                    <Label htmlFor="slug" className="form-label">
                                                        نامک (Slug){" "}
                                                        <span className="text-danger">*</span>
                                                    </Label>
                                                    <Input
                                                        id="slug"
                                                        name="slug"
                                                        type="text"
                                                        placeholder="مثال: electronics"
                                                        value={formik.values.slug}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={
                                                            formik.touched.slug &&
                                                            !!formik.errors.slug
                                                        }
                                                        disabled={loading}
                                                    />
                                                    <FormFeedback>
                                                        {formik.errors.slug}
                                                    </FormFeedback>
                                                </div>
                                            </Col>
                                        </Row>

                                        {/* Parent */}
                                        <Row>
                                            <Col md={12}>
                                                <div className="mb-3">
                                                    <Label htmlFor="parent" className="form-label">
                                                        دسته والد
                                                    </Label>
                                                    {loadingCategories ? (
                                                        <Spinner size="sm" />
                                                    ) : (
                                                        <Input
                                                            id="parent"
                                                            name="parent"
                                                            type="select"
                                                            value={formik.values.parent}
                                                            onChange={formik.handleChange}
                                                            disabled={loading}
                                                        >
                                                            <option value="">
                                                                بدون والد (دسته اصلی)
                                                            </option>
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
                                                    <Label
                                                        htmlFor="description"
                                                        className="form-label"
                                                    >
                                                        توضیحات
                                                    </Label>
                                                    <Input
                                                        id="description"
                                                        name="description"
                                                        type="textarea"
                                                        rows="4"
                                                        value={formik.values.description}
                                                        onChange={formik.handleChange}
                                                        disabled={loading}
                                                    />
                                                </div>
                                            </Col>
                                        </Row>

                                        {/* Storage + Loading Costs */}
                                        <Row>
                                            <Col md={6}>
                                                <div className="mb-3">
                                                    <Label htmlFor="storage_cost" className="form-label">
                                                        هزینه انبارداری (تومان)
                                                    </Label>
                                                    <Input
                                                        id="storage_cost"
                                                        name="storage_cost"
                                                        type="number"
                                                        placeholder="مثلاً 5000"
                                                        value={formik.values.storage_cost}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={
                                                            formik.touched.storage_cost &&
                                                            !!formik.errors.storage_cost
                                                        }
                                                        disabled={loading}
                                                    />
                                                    <FormFeedback>
                                                        {formik.errors.storage_cost}
                                                    </FormFeedback>
                                                </div>
                                            </Col>

                                            <Col md={6}>
                                                <div className="mb-3">
                                                    <Label htmlFor="loading_cost" className="form-label">
                                                        هزینه بارگیری (تومان)
                                                    </Label>
                                                    <Input
                                                        id="loading_cost"
                                                        name="loading_cost"
                                                        type="number"
                                                        placeholder="مثلاً 20000"
                                                        value={formik.values.loading_cost}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={
                                                            formik.touched.loading_cost &&
                                                            !!formik.errors.loading_cost
                                                        }
                                                        disabled={loading}
                                                    />
                                                    <FormFeedback>
                                                        {formik.errors.loading_cost}
                                                    </FormFeedback>
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
                                                    />
                                                    <Label
                                                        className="form-check-label"
                                                        htmlFor="is_active"
                                                    >
                                                        دسته‌بندی فعال باشد
                                                    </Label>
                                                </div>
                                            </Col>
                                        </Row>

                                        {/* Buttons */}
                                        <div className="d-flex flex-wrap gap-2">
                                            <Button
                                                type="submit"
                                                color="primary"
                                                disabled={loading}
                                            >
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

                                            <Button
                                                type="button"
                                                color="light"
                                                onClick={() => formik.resetForm()}
                                                disabled={loading}
                                            >
                                                <i className="bx bx-refresh me-1"></i>
                                                پاک کردن فرم
                                            </Button>

                                            <Button
                                                type="button"
                                                color="secondary"
                                                onClick={() =>
                                                    navigate("/inventory/category-list")
                                                }
                                                disabled={loading}
                                            >
                                                <i className="bx bx-arrow-back me-1"></i>
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
