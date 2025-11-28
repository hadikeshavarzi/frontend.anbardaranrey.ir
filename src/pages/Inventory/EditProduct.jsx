import React, { useEffect, useState } from "react";
import {
    Container,
    Row,
    Col,
    Card,
    CardBody,
    Form,
    Label,
    Input,
    Button,
    FormFeedback,
    Spinner,
    Alert,
} from "reactstrap";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import { get, patch } from "../../helpers/api_helper.jsx";

const EditProduct = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [loadingData, setLoadingData] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [units, setUnits] = useState([]);
    const [categories, setCategories] = useState([]);

    const [initialData, setInitialData] = useState({
        name: "",
        sku: "",
        category: "",
        unit: "",
        quantity: 0,
        min_stock: "",
        max_stock: "",
        location: "",
        price: "",
        cost_price: "",
        barcode: "",
        batch_number: "",
        expire_date: "",
        description: "",
        specifications: "",
        is_active: true,
    });

    // لود واحدها و دسته‌بندی‌ها
    useEffect(() => {
        async function loadSelectData() {
            setLoadingData(true);
            try {
                const [unitsRes, catsRes] = await Promise.all([
                    get("/product-units"),
                    get("/product-categories"),
                ]);

                setUnits(unitsRes?.docs || []);
                setCategories(catsRes?.docs || []);
            } catch (err) {
                console.error("Error loading select data:", err);
            }
            setLoadingData(false);
        }
        loadSelectData();
    }, []);

    // لود اطلاعات محصول
    const loadProduct = async () => {
        setLoading(true);
        setError("");

        console.log("🔍 Loading product with ID:", id);

        try {
            const res = await get(`/products/${id}`);
            console.log("✅ Product loaded successfully:", res);

            setInitialData({
                name: res.name || "",
                sku: res.sku || "",
                category: res.category?.id || res.category || "",
                unit: res.unit?.id || res.unit || "",
                quantity: res.quantity || 0,
                min_stock: res.min_stock || "",
                max_stock: res.max_stock || "",
                location: res.location || "",
                price: res.price || "",
                cost_price: res.cost_price || "",
                barcode: res.barcode || "",
                batch_number: res.batch_number || "",
                expire_date: res.expire_date || "",
                description: res.description || "",
                specifications: res.specifications || "",
                is_active: typeof res.is_active === "boolean" ? res.is_active : true,
            });
        } catch (err) {
            console.error("❌ Error loading product:", err);

            if (err.response?.status === 404) {
                setError("کالای مورد نظر یافت نشد. ممکن است حذف شده باشد.");
            } else {
                setError(err.response?.data?.message || "خطا در دریافت اطلاعات کالا");
            }
        }

        setLoading(false);
    };

    useEffect(() => {
        if (id) {
            loadProduct();
        }
    }, [id]);

    // فرم
    const formik = useFormik({
        enableReinitialize: true,
        initialValues: initialData,
        validationSchema: Yup.object({
            name: Yup.string()
                .required("نام کالا الزامی است")
                .min(2, "نام کالا باید حداقل 2 کاراکتر باشد"),
            sku: Yup.string()
                .required("کد کالا الزامی است")
                .min(2, "کد کالا باید حداقل 2 کاراکتر باشد"),
            category: Yup.string().required("دسته‌بندی الزامی است"),
            unit: Yup.string().required("واحد الزامی است"),
            quantity: Yup.number()
                .min(0, "موجودی نمی‌تواند منفی باشد")
                .required("موجودی الزامی است"),
            price: Yup.number().min(0, "قیمت نمی‌تواند منفی باشد"),
        }),
        onSubmit: async (values) => {
            setError("");
            setSuccess("");
            setSaving(true);

            console.log("📝 Form submitted with values:", values);

            try {
                // چک تکراری بودن SKU
                const allProducts = await get("/products");

                const exists = (allProducts.docs || []).some((p) => {
                    if (p.id === Number(id) || p.id === id) return false;
                    return (
                        (p.sku || "").trim().toLowerCase() ===
                        values.sku.trim().toLowerCase()
                    );
                });

                if (exists) {
                    setError("کالای دیگری با همین کد (SKU) وجود دارد.");
                    setSaving(false);
                    return;
                }

                const payloadBody = {
                    name: values.name,
                    sku: values.sku,
                    category: values.category ? Number(values.category) : null,
                    unit: values.unit ? Number(values.unit) : null,
                    quantity: Number(values.quantity) || 0,
                    min_stock: values.min_stock ? Number(values.min_stock) : null,
                    max_stock: values.max_stock ? Number(values.max_stock) : null,
                    location: values.location || "",
                    price: values.price ? Number(values.price) : null,
                    cost_price: values.cost_price ? Number(values.cost_price) : null,
                    barcode: values.barcode || "",
                    batch_number: values.batch_number || "",
                    expire_date: values.expire_date || null,
                    description: values.description || "",
                    specifications: values.specifications || "",
                    is_active: values.is_active,
                };

                console.log("🔗 Update URL:", `/products/${id}`);
                console.log("📦 Payload Body:", payloadBody);

                const result = await patch(`/products/${id}`, payloadBody);

                console.log("✅ Update successful:", result);

                if (result?.id || result?.doc?.id) {
                    setSuccess("تغییرات با موفقیت ذخیره شد");

                    setTimeout(() => {
                        navigate("/inventory/product-list");
                    }, 1500);
                } else {
                    setError("خطا در ذخیره تغییرات");
                }
            } catch (err) {
                console.error("❌ Update error:", err);

                if (err.response?.status === 404) {
                    setError("کالای مورد نظر یافت نشد. ممکن است حذف شده باشد.");
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

    if (loading || loadingData) {
        return (
            <div className="page-content">
                <Container fluid>
                    <Row>
                        <Col lg={10} className="mx-auto">
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
                        <h4 className="mb-sm-0 font-size-18">ویرایش کالا</h4>

                        <div className="page-title-right">
                            <ol className="breadcrumb m-0">
                                <li className="breadcrumb-item">
                                    <Link to="/dashboard">داشبورد</Link>
                                </li>
                                <li className="breadcrumb-item">
                                    <Link to="/inventory/product-list">کالاها</Link>
                                </li>
                                <li className="breadcrumb-item active">ویرایش کالا</li>
                            </ol>
                        </div>
                    </div>

                    <Row>
                        <Col lg={10} className="mx-auto">
                            <Card>
                                <CardBody>
                                    <div className="mb-4">
                                        <h4 className="card-title">ویرایش کالا</h4>
                                        <p className="card-title-desc">
                                            اطلاعات کالا را ویرایش نمایید
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
                                        {/* اطلاعات پایه */}
                                        <div className="mb-4">
                                            <h5 className="font-size-14 mb-3">
                                                <i className="bx bx-info-circle me-1"></i>
                                                اطلاعات پایه
                                            </h5>

                                            <Row>
                                                {/* Name */}
                                                <Col md={6}>
                                                    <div className="mb-3">
                                                        <Label htmlFor="name" className="form-label">
                                                            نام کالا <span className="text-danger">*</span>
                                                        </Label>
                                                        <Input
                                                            id="name"
                                                            name="name"
                                                            type="text"
                                                            value={formik.values.name}
                                                            onChange={formik.handleChange}
                                                            onBlur={formik.handleBlur}
                                                            invalid={formik.touched.name && !!formik.errors.name}
                                                            disabled={saving}
                                                        />
                                                        <FormFeedback>{formik.errors.name}</FormFeedback>
                                                    </div>
                                                </Col>

                                                {/* SKU */}
                                                <Col md={6}>
                                                    <div className="mb-3">
                                                        <Label htmlFor="sku" className="form-label">
                                                            کد کالا (SKU) <span className="text-danger">*</span>
                                                        </Label>
                                                        <Input
                                                            id="sku"
                                                            name="sku"
                                                            type="text"
                                                            value={formik.values.sku}
                                                            onChange={formik.handleChange}
                                                            onBlur={formik.handleBlur}
                                                            invalid={formik.touched.sku && !!formik.errors.sku}
                                                            disabled={saving}
                                                        />
                                                        <FormFeedback>{formik.errors.sku}</FormFeedback>
                                                    </div>
                                                </Col>
                                            </Row>

                                            <Row>
                                                {/* Category */}
                                                <Col md={6}>
                                                    <div className="mb-3">
                                                        <Label htmlFor="category" className="form-label">
                                                            دسته‌بندی <span className="text-danger">*</span>
                                                        </Label>
                                                        <Input
                                                            id="category"
                                                            name="category"
                                                            type="select"
                                                            value={formik.values.category}
                                                            onChange={formik.handleChange}
                                                            onBlur={formik.handleBlur}
                                                            invalid={
                                                                formik.touched.category && !!formik.errors.category
                                                            }
                                                            disabled={saving}
                                                        >
                                                            <option value="">انتخاب کنید...</option>
                                                            {categories.map((c) => (
                                                                <option key={c.id} value={c.id}>
                                                                    {c.name}
                                                                </option>
                                                            ))}
                                                        </Input>
                                                        <FormFeedback>{formik.errors.category}</FormFeedback>
                                                    </div>
                                                </Col>

                                                {/* Unit */}
                                                <Col md={6}>
                                                    <div className="mb-3">
                                                        <Label htmlFor="unit" className="form-label">
                                                            واحد <span className="text-danger">*</span>
                                                        </Label>
                                                        <Input
                                                            id="unit"
                                                            name="unit"
                                                            type="select"
                                                            value={formik.values.unit}
                                                            onChange={formik.handleChange}
                                                            onBlur={formik.handleBlur}
                                                            invalid={formik.touched.unit && !!formik.errors.unit}
                                                            disabled={saving}
                                                        >
                                                            <option value="">انتخاب کنید...</option>
                                                            {units.map((u) => (
                                                                <option key={u.id} value={u.id}>
                                                                    {u.name} ({u.symbol})
                                                                </option>
                                                            ))}
                                                        </Input>
                                                        <FormFeedback>{formik.errors.unit}</FormFeedback>
                                                    </div>
                                                </Col>
                                            </Row>
                                        </div>

                                        {/* موجودی و قیمت */}
                                        <div className="mb-4">
                                            <h5 className="font-size-14 mb-3">
                                                <i className="bx bx-dollar-circle me-1"></i>
                                                موجودی و قیمت
                                            </h5>

                                            <Row>
                                                <Col md={4}>
                                                    <div className="mb-3">
                                                        <Label htmlFor="quantity" className="form-label">
                                                            موجودی فعلی <span className="text-danger">*</span>
                                                        </Label>
                                                        <Input
                                                            id="quantity"
                                                            name="quantity"
                                                            type="number"
                                                            value={formik.values.quantity}
                                                            onChange={formik.handleChange}
                                                            onBlur={formik.handleBlur}
                                                            invalid={
                                                                formik.touched.quantity && !!formik.errors.quantity
                                                            }
                                                            disabled={saving}
                                                        />
                                                        <FormFeedback>{formik.errors.quantity}</FormFeedback>
                                                    </div>
                                                </Col>

                                                <Col md={4}>
                                                    <div className="mb-3">
                                                        <Label htmlFor="min_stock" className="form-label">
                                                            حداقل موجودی
                                                        </Label>
                                                        <Input
                                                            id="min_stock"
                                                            name="min_stock"
                                                            type="number"
                                                            value={formik.values.min_stock}
                                                            onChange={formik.handleChange}
                                                            disabled={saving}
                                                        />
                                                    </div>
                                                </Col>

                                                <Col md={4}>
                                                    <div className="mb-3">
                                                        <Label htmlFor="max_stock" className="form-label">
                                                            حداکثر موجودی
                                                        </Label>
                                                        <Input
                                                            id="max_stock"
                                                            name="max_stock"
                                                            type="number"
                                                            value={formik.values.max_stock}
                                                            onChange={formik.handleChange}
                                                            disabled={saving}
                                                        />
                                                    </div>
                                                </Col>
                                            </Row>

                                            <Row>
                                                <Col md={4}>
                                                    <div className="mb-3">
                                                        <Label htmlFor="price" className="form-label">
                                                            قیمت فروش (تومان)
                                                        </Label>
                                                        <Input
                                                            id="price"
                                                            name="price"
                                                            type="number"
                                                            value={formik.values.price}
                                                            onChange={formik.handleChange}
                                                            onBlur={formik.handleBlur}
                                                            invalid={formik.touched.price && !!formik.errors.price}
                                                            disabled={saving}
                                                        />
                                                        <FormFeedback>{formik.errors.price}</FormFeedback>
                                                    </div>
                                                </Col>

                                                <Col md={4}>
                                                    <div className="mb-3">
                                                        <Label htmlFor="cost_price" className="form-label">
                                                            قیمت خرید (تومان)
                                                        </Label>
                                                        <Input
                                                            id="cost_price"
                                                            name="cost_price"
                                                            type="number"
                                                            value={formik.values.cost_price}
                                                            onChange={formik.handleChange}
                                                            disabled={saving}
                                                        />
                                                    </div>
                                                </Col>

                                                <Col md={4}>
                                                    <div className="mb-3">
                                                        <Label htmlFor="location" className="form-label">
                                                            موقعیت انبار
                                                        </Label>
                                                        <Input
                                                            id="location"
                                                            name="location"
                                                            type="text"
                                                            value={formik.values.location}
                                                            onChange={formik.handleChange}
                                                            disabled={saving}
                                                        />
                                                    </div>
                                                </Col>
                                            </Row>
                                        </div>

                                        {/* اطلاعات تکمیلی */}
                                        <div className="mb-4">
                                            <h5 className="font-size-14 mb-3">
                                                <i className="bx bx-barcode me-1"></i>
                                                اطلاعات تکمیلی
                                            </h5>

                                            <Row>
                                                <Col md={4}>
                                                    <div className="mb-3">
                                                        <Label htmlFor="barcode" className="form-label">
                                                            بارکد
                                                        </Label>
                                                        <Input
                                                            id="barcode"
                                                            name="barcode"
                                                            type="text"
                                                            value={formik.values.barcode}
                                                            onChange={formik.handleChange}
                                                            disabled={saving}
                                                        />
                                                    </div>
                                                </Col>

                                                <Col md={4}>
                                                    <div className="mb-3">
                                                        <Label htmlFor="batch_number" className="form-label">
                                                            شماره دسته
                                                        </Label>
                                                        <Input
                                                            id="batch_number"
                                                            name="batch_number"
                                                            type="text"
                                                            value={formik.values.batch_number}
                                                            onChange={formik.handleChange}
                                                            disabled={saving}
                                                        />
                                                    </div>
                                                </Col>

                                                <Col md={4}>
                                                    <div className="mb-3">
                                                        <Label htmlFor="expire_date" className="form-label">
                                                            تاریخ انقضا
                                                        </Label>
                                                        <Input
                                                            id="expire_date"
                                                            name="expire_date"
                                                            type="date"
                                                            value={formik.values.expire_date}
                                                            onChange={formik.handleChange}
                                                            disabled={saving}
                                                        />
                                                    </div>
                                                </Col>
                                            </Row>
                                        </div>

                                        {/* توضیحات */}
                                        <div className="mb-4">
                                            <Row>
                                                <Col md={6}>
                                                    <div className="mb-3">
                                                        <Label htmlFor="description" className="form-label">
                                                            توضیحات
                                                        </Label>
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

                                                <Col md={6}>
                                                    <div className="mb-3">
                                                        <Label htmlFor="specifications" className="form-label">
                                                            مشخصات فنی
                                                        </Label>
                                                        <Input
                                                            id="specifications"
                                                            name="specifications"
                                                            type="textarea"
                                                            rows="3"
                                                            value={formik.values.specifications}
                                                            onChange={formik.handleChange}
                                                            disabled={saving}
                                                        />
                                                    </div>
                                                </Col>
                                            </Row>
                                        </div>

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
                                            <Button type="submit" color="primary" disabled={saving}>
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
                                                onClick={() => navigate("/inventory/product-list")}
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

export default EditProduct;