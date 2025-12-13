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
        parent_id: "",
        description: "",
        is_active: true,
        storage_cost: "",
        loading_cost: "",
    });

    /* ============================================================
       Load categories for dropdown
    ============================================================ */
    useEffect(() => {
        async function loadCategories() {
            try {
                const res = await get("/product-categories");
                setCategories(res?.data || []);
            } catch (err) {
                console.error("❌ Load categories error:", err);
            }
            setLoadingCategories(false);
        }
        loadCategories();
    }, []);

    /* ============================================================
       Load current category to edit
    ============================================================ */
    const loadCategory = async () => {
        setLoading(true);
        try {
            const res = await get(`/product-categories/${id}`);

            if (!res?.data) {
                setError("دسته‌بندی یافت نشد.");
                setLoading(false);
                return;
            }

            const cat = res.data;

            setInitialData({
                name: cat.name || "",
                slug: cat.slug || "",
                parent_id: cat.parent_id || "",
                description: cat.description || "",
                is_active: cat.is_active ?? true,
                storage_cost: cat.storage_cost ?? "",
                loading_cost: cat.loading_cost ?? "",
            });
        } catch (err) {
            console.error("❌ Load category error:", err);
            setError("خطا در دریافت اطلاعات دسته‌بندی");
        }
        setLoading(false);
    };

    useEffect(() => {
        loadCategory();
    }, [id]);

    /* ============================================================
       Formik
    ============================================================ */
    const formik = useFormik({
        enableReinitialize: true,
        initialValues: initialData,

        validationSchema: Yup.object({
            name: Yup.string().required("نام دسته‌بندی الزامی است").min(2),
            slug: Yup.string()
                .required("نامک الزامی است")
                .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "نامک معتبر نیست"),
        }),

        onSubmit: async (values) => {
            setError("");
            setSuccess("");
            setSaving(true);

            try {
                /* duplicate check */
                const all = await get("/product-categories");
                const list = all.data || [];

                const duplicate = list.some((c) => {
                    if (c.id === Number(id)) return false;
                    return (
                        c.name.trim().toLowerCase() === values.name.trim().toLowerCase() ||
                        c.slug.trim().toLowerCase() === values.slug.trim().toLowerCase()
                    );
                });

                if (duplicate) {
                    setError("دسته‌بندی دیگری با همین نام یا نامک وجود دارد.");
                    setSaving(false);
                    return;
                }

                /* payload */
                const payload = {
                    name: values.name,
                    slug: values.slug,
                    parent_id: values.parent_id ? Number(values.parent_id) : null,
                    description: values.description || "",
                    is_active: values.is_active,
                    storage_cost: values.storage_cost ? Number(values.storage_cost) : null,
                    loading_cost: values.loading_cost ? Number(values.loading_cost) : null,
                };

                const result = await patch(`/product-categories/${id}`, payload);

                if (result?.success) {
                    setSuccess("تغییرات با موفقیت ذخیره شد");
                    setTimeout(() => navigate("/inventory/category-list"), 1200);
                } else {
                    setError(result?.message || "خطا در ذخیره تغییرات");
                }
            } catch (err) {
                console.error("❌ Update error:", err);
                setError(err.response?.data?.message || "خطا در ذخیره تغییرات");
            }

            setSaving(false);
        },
    });

    /* ============================================================
       Loading screen
    ============================================================ */
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

    /* ============================================================
       UI
    ============================================================ */
    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>

                    {/* Breadcrumb */}
                    <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                        <h4 className="mb-sm-0 font-size-18">ویرایش دسته‌بندی</h4>

                        <div className="page-title-right">
                            <ol className="breadcrumb m-0">
                                <li className="breadcrumb-item"><Link to="/dashboard">داشبورد</Link></li>
                                <li className="breadcrumb-item"><Link to="/inventory/category-list">دسته‌بندی‌ها</Link></li>
                                <li className="breadcrumb-item active">ویرایش</li>
                            </ol>
                        </div>
                    </div>

                    <Row>
                        <Col lg={8} className="mx-auto">
                            <Card>
                                <CardBody>

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

                                        {/* NAME + SLUG */}
                                        <Row>
                                            <Col md={6}>
                                                <div className="mb-3">
                                                    <Label>نام*</Label>
                                                    <Input
                                                        name="name"
                                                        value={formik.values.name}
                                                        onChange={formik.handleChange}
                                                        invalid={formik.touched.name && !!formik.errors.name}
                                                    />
                                                    <FormFeedback>{formik.errors.name}</FormFeedback>
                                                </div>
                                            </Col>

                                            <Col md={6}>
                                                <div className="mb-3">
                                                    <Label>نامک*</Label>
                                                    <Input
                                                        name="slug"
                                                        value={formik.values.slug}
                                                        onChange={formik.handleChange}
                                                        invalid={formik.touched.slug && !!formik.errors.slug}
                                                    />
                                                    <FormFeedback>{formik.errors.slug}</FormFeedback>
                                                </div>
                                            </Col>
                                        </Row>

                                        {/* PARENT */}
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

                                        {/* DESCRIPTION */}
                                        <Row>
                                            <Col md={12}>
                                                <div className="mb-3">
                                                    <Label>توضیحات</Label>
                                                    <Input
                                                        type="textarea"
                                                        name="description"
                                                        rows="3"
                                                        value={formik.values.description}
                                                        onChange={formik.handleChange}
                                                    />
                                                </div>
                                            </Col>
                                        </Row>

                                        {/* COSTS */}
                                        <Row>
                                            <Col md={6}>
                                                <div className="mb-3">
                                                    <Label>هزینه انبارداری</Label>
                                                    <Input
                                                        type="number"
                                                        name="storage_cost"
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
                                                        type="number"
                                                        name="loading_cost"
                                                        value={formik.values.loading_cost}
                                                        onChange={formik.handleChange}
                                                        invalid={formik.touched.loading_cost && !!formik.errors.loading_cost}
                                                    />
                                                    <FormFeedback>{formik.errors.loading_cost}</FormFeedback>
                                                </div>
                                            </Col>
                                        </Row>

                                        {/* ACTIVE */}
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
                                                    <Label className="form-check-label">فعال باشد</Label>
                                                </div>
                                            </Col>
                                        </Row>

                                        {/* BUTTONS */}
                                        <div className="d-flex gap-2">
                                            <Button type="submit" color="primary" disabled={saving}>
                                                {saving ? "در حال ذخیره..." : "ذخیره تغییرات"}
                                            </Button>

                                            <Button color="secondary" disabled={saving}
                                                    onClick={() => navigate("/inventory/category-list")}
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
