import React, { useEffect, useState } from "react";
import {
    Container,
    Row,
    Col,
    Card,
    CardBody,
    Form,
    Input,
    Label,
    Button,
    FormFeedback,
    Spinner,
    Alert,
} from "reactstrap";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useParams, useNavigate, Link } from "react-router-dom";
import { get, patch } from "../../helpers/api_helper.jsx";

const EditCategory = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [categories, setCategories] = useState([]);

    const [initialData, setInitialData] = useState({
        name: "",
        slug: "",
        parent: "",
        description: "",
        is_active: true,
        storage_cost: "",
        loading_cost: "",
    });

    // --- لود دسته‌بندی‌ها برای انتخاب والد ---
    useEffect(() => {
        async function loadCategories() {
            setLoadingCategories(true);
            try {
                const res = await get("/product-categories");
                setCategories(res?.docs || []);
            } catch (err) {
                console.error("❌ Error loading categories:", err);
            }
            setLoadingCategories(false);
        }
        loadCategories();
    }, []);

    // --- لود اطلاعات دسته‌بندی برای ویرایش ---
    const loadCategory = async () => {
        setLoading(true);
        setError("");

        try {
            const res = await get(`/product-categories/${id}`);

            setInitialData({
                name: res.name || "",
                slug: res.slug || "",
                parent: res.parent?.id || res.parent || "",
                description: res.description || "",
                is_active: typeof res.is_active === "boolean" ? res.is_active : true,
                storage_cost: res.storage_cost || "",
                loading_cost: res.loading_cost || "",
            });
        } catch (err) {
            console.error("❌ Error loading category:", err);

            if (err.response?.status === 404) {
                setError("دسته‌بندی مورد نظر یافت نشد یا حذف شده است.");
            } else {
                setError(err.response?.data?.message || "خطا در دریافت اطلاعات دسته‌بندی");
            }
        }

        setLoading(false);
    };

    useEffect(() => {
        if (id) loadCategory();
    }, [id]);

    // --- فرم ---
    const formik = useFormik({
        enableReinitialize: true,
        initialValues: initialData,
        validationSchema: Yup.object({
            name: Yup.string().required("نام دسته‌بندی الزامی است").min(2),
            slug: Yup.string()
                .required("نامک الزامی است")
                .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "نامک معتبر نیست"),

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
            setSaving(true);

            try {
                // چک تکراری بودن نام یا slug
                const allCategories = await get("/product-categories");
                const exists = (allCategories.docs || []).some((c) => {
                    if (c.id === Number(id) || c.id === id) return false;

                    return (
                        (c.name || "").trim().toLowerCase() === values.name.trim().toLowerCase() ||
                        (c.slug || "").trim().toLowerCase() === values.slug.trim().toLowerCase()
                    );
                });

                if (exists) {
                    setError("دسته‌بندی دیگری با همین نام یا نامک وجود دارد.");
                    setSaving(false);
                    return;
                }

                const payloadBody = {
                    name: values.name,
                    slug: values.slug,
                    parent: values.parent ? Number(values.parent) : null,
                    description: values.description || "",
                    is_active: values.is_active,
                    storage_cost: values.storage_cost ? Number(values.storage_cost) : null,
                    loading_cost: values.loading_cost ? Number(values.loading_cost) : null,
                };

                const result = await patch(`/product-categories/${id}`, payloadBody);

                if (result?.id || result?.doc?.id) {
                    setSuccess("تغییرات با موفقیت ذخیره شد");

                    setTimeout(() => {
                        navigate("/inventory/category-list");
                    }, 1500);
                } else {
                    setError("خطا در ذخیره تغییرات");
                }
            } catch (err) {
                console.error("❌ Update error:", err);

                if (err.response?.status === 404) {
                    setError("دسته‌بندی پیدا نشد یا حذف شده است.");
                } else {
                    setError(err.response?.data?.message || "خطا در ذخیره تغییرات");
                }
            }

            setSaving(false);
        },
    });

    // --- لودینگ اولیه ---
    if (loading) {
        return (
            <div className="page-content">
                <Container fluid>
                    <Row>
                        <Col lg={8} className="mx-auto">
                            <Card>
                                <CardBody className="text-center py-5">
                                    <Spinner />
                                    <div className="mt-3 text-muted">در حال بارگذاری...</div>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>
        );
    }

    // --- UI ---
    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                        <h4 className="mb-sm-0 font-size-18">ویرایش دسته‌بندی کالا</h4>

                        <div className="page-title-right">
                            <ol className="breadcrumb m-0">
                                <li className="breadcrumb-item">
                                    <Link to="/dashboard">داشبورد</Link>
                                </li>
                                <li className="breadcrumb-item">
                                    <Link to="/inventory/category-list">دسته‌بندی‌ها</Link>
                                </li>
                                <li className="breadcrumb-item active">ویرایش دسته‌بندی</li>
                            </ol>
                        </div>
                    </div>

                    <Row>
                        <Col lg={8} className="mx-auto">
                            <Card>
                                <CardBody>
                                    <div className="mb-4">
                                        <h4 className="card-title">ویرایش دسته‌بندی</h4>
                                        <p className="card-title-desc">
                                            اطلاعات دسته‌بندی را ویرایش نمایید
                                        </p>
                                    </div>

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
                                            <Col md={6}>
                                                <div className="mb-3">
                                                    <Label htmlFor="name">نام دسته‌بندی*</Label>
                                                    <Input
                                                        id="name"
                                                        name="name"
                                                        type="text"
                                                        value={formik.values.name}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        disabled={saving}
                                                        invalid={formik.touched.name && !!formik.errors.name}
                                                    />
                                                    <FormFeedback>{formik.errors.name}</FormFeedback>
                                                </div>
                                            </Col>

                                            <Col md={6}>
                                                <div className="mb-3">
                                                    <Label htmlFor="slug">نامک*</Label>
                                                    <Input
                                                        id="slug"
                                                        name="slug"
                                                        type="text"
                                                        value={formik.values.slug}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        disabled={saving}
                                                        invalid={formik.touched.slug && !!formik.errors.slug}
                                                    />
                                                    <FormFeedback>{formik.errors.slug}</FormFeedback>
                                                </div>
                                            </Col>
                                        </Row>

                                        <Row>
                                            <Col md={12}>
                                                <div className="mb-3">
                                                    <Label htmlFor="parent">دسته والد</Label>
                                                    {loadingCategories ? (
                                                        <Spinner size="sm" />
                                                    ) : (
                                                        <Input
                                                            id="parent"
                                                            name="parent"
                                                            type="select"
                                                            value={formik.values.parent}
                                                            onChange={formik.handleChange}
                                                            disabled={saving}
                                                        >
                                                            <option value="">بدون والد</option>
                                                            {categories
                                                                .filter((c) => c.id !== Number(id))
                                                                .map((cat) => (
                                                                    <option key={cat.id} value={cat.id}>
                                                                        {cat.name}
                                                                    </option>
                                                                ))}
                                                        </Input>
                                                    )}
                                                </div>
                                            </Col>
                                        </Row>

                                        <Row>
                                            <Col md={12}>
                                                <div className="mb-3">
                                                    <Label htmlFor="description">توضیحات</Label>
                                                    <Input
                                                        id="description"
                                                        name="description"
                                                        type="textarea"
                                                        rows={3}
                                                        value={formik.values.description}
                                                        onChange={formik.handleChange}
                                                        disabled={saving}
                                                    />
                                                </div>
                                            </Col>
                                        </Row>

                                        {/* --- فیلدهای هزینه --- */}
                                        <Row>
                                            <Col md={6}>
                                                <div className="mb-3">
                                                    <Label htmlFor="storage_cost">هزینه انبارداری</Label>
                                                    <Input
                                                        id="storage_cost"
                                                        name="storage_cost"
                                                        type="number"
                                                        value={formik.values.storage_cost}
                                                        placeholder="مثلاً 5000"
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        disabled={saving}
                                                        invalid={
                                                            formik.touched.storage_cost &&
                                                            !!formik.errors.storage_cost
                                                        }
                                                    />
                                                    <FormFeedback>
                                                        {formik.errors.storage_cost}
                                                    </FormFeedback>
                                                </div>
                                            </Col>

                                            <Col md={6}>
                                                <div className="mb-3">
                                                    <Label htmlFor="loading_cost">هزینه بارگیری</Label>
                                                    <Input
                                                        id="loading_cost"
                                                        name="loading_cost"
                                                        type="number"
                                                        value={formik.values.loading_cost}
                                                        placeholder="مثلاً 20000"
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        disabled={saving}
                                                        invalid={
                                                            formik.touched.loading_cost &&
                                                            !!formik.errors.loading_cost
                                                        }
                                                    />
                                                    <FormFeedback>
                                                        {formik.errors.loading_cost}
                                                    </FormFeedback>
                                                </div>
                                            </Col>
                                        </Row>

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
                                                    <Label htmlFor="is_active">فعال باشد</Label>
                                                </div>
                                            </Col>
                                        </Row>

                                        <div className="d-flex gap-2">
                                            <Button type="submit" color="primary" disabled={saving}>
                                                {saving ? (
                                                    <>
                                                        <Spinner size="sm" className="me-2" />
                                                        در حال ذخیره...
                                                    </>
                                                ) : (
                                                    "ذخیره تغییرات"
                                                )}
                                            </Button>

                                            <Button
                                                type="button"
                                                color="secondary"
                                                onClick={() => navigate("/inventory/category-list")}
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

export default EditCategory;
