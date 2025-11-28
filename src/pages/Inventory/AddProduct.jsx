import React, { useState, useEffect } from "react";
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

const AddProduct = () => {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [units, setUnits] = useState([]);
    const [categories, setCategories] = useState([]);

    // لود واحدها و دسته‌بندی‌ها
    useEffect(() => {
        async function loadData() {
            setLoadingData(true);
            try {
                const [unitsRes, catsRes] = await Promise.all([
                    get("/product-units"),
                    get("/product-categories"),
                ]);

                setUnits(unitsRes?.docs || []);
                setCategories(catsRes?.docs || []);
            } catch (err) {
                console.error("Error loading data:", err);
                setError("خطا در بارگذاری اطلاعات اولیه");
            }
            setLoadingData(false);
        }
        loadData();
    }, []);

    const formik = useFormik({
        initialValues: {
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
        },
        validationSchema: Yup.object({
            name: Yup.string()
                .required("نام کالا الزامی است")
                .min(2, "نام کالا باید حداقل 2 کاراکتر باشد"),
            sku: Yup.string()
                .required("کد کالا الزامی است")
                .min(2, "کد کالا باید حداقل 2 کاراکتر باشد"),
            category: Yup.string().required("دسته‌بندی الزامی است"),
            unit: Yup.string().required("واحد کالا الزامی است"),
            quantity: Yup.number()
                .min(0, "موجودی نمی‌تواند منفی باشد")
                .required("موجودی الزامی است"),
            price: Yup.number().min(0, "قیمت نمی‌تواند منفی باشد"),
        }),

        onSubmit: async (values) => {
            setError("");
            setSuccess("");
            setLoading(true);

            console.log("📝 Creating new product with values:", values);

            try {
                // چک تکراری بودن SKU
                const allProducts = await get("/products");
                const exists = (allProducts.docs || []).some(
                    (p) =>
                        (p.sku || "").trim().toLowerCase() ===
                        values.sku.trim().toLowerCase()
                );

                if (exists) {
                    setError("کالای دیگری با همین کد (SKU) وجود دارد.");
                    setLoading(false);
                    return;
                }

                const result = await post("/products", {
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
                });

                if (result?.id || result?.doc?.id) {
                    setSuccess("کالا با موفقیت ثبت شد");

                    setTimeout(() => {
                        formik.resetForm();
                        setSuccess("");
                    }, 2000);
                } else {
                    setError("خطا در ثبت کالا");
                }
            } catch (err) {
                console.error("❌ Create error:", err);
                setError(err.response?.data?.message || "خطا در ثبت کالا");
            }

            setLoading(false);
        },
    });

    if (loadingData) {
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
                        <h4 className="mb-sm-0 font-size-18">افزودن کالا</h4>

                        <div className="page-title-right">
                            <ol className="breadcrumb m-0">
                                <li className="breadcrumb-item">
                                    <Link to="/dashboard">داشبورد</Link>
                                </li>
                                <li className="breadcrumb-item">
                                    <Link to="/inventory/product-list">کالاها</Link>
                                </li>
                                <li className="breadcrumb-item active">افزودن کالا</li>
                            </ol>
                        </div>
                    </div>

                    <Row>
                        <Col lg={10} className="mx-auto">
                            <Card>
                                <CardBody>
                                    <div className="mb-4">
                                        <h4 className="card-title">اطلاعات کالا</h4>
                                        <p className="card-title-desc">
                                            لطفاً اطلاعات کالای جدید را وارد نمایید
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
                                                            placeholder="مثال: لپ‌تاپ ایسوس"
                                                            value={formik.values.name}
                                                            onChange={formik.handleChange}
                                                            onBlur={formik.handleBlur}
                                                            invalid={formik.touched.name && !!formik.errors.name}
                                                            disabled={loading}
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
                                                            placeholder="مثال: LP-ASUS-001"
                                                            value={formik.values.sku}
                                                            onChange={formik.handleChange}
                                                            onBlur={formik.handleBlur}
                                                            invalid={formik.touched.sku && !!formik.errors.sku}
                                                            disabled={loading}
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
                                                            disabled={loading}
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
                                                            disabled={loading}
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
                                                {/* Quantity */}
                                                <Col md={4}>
                                                    <div className="mb-3">
                                                        <Label htmlFor="quantity" className="form-label">
                                                            موجودی فعلی <span className="text-danger">*</span>
                                                        </Label>
                                                        <Input
                                                            id="quantity"
                                                            name="quantity"
                                                            type="number"
                                                            placeholder="0"
                                                            value={formik.values.quantity}
                                                            onChange={formik.handleChange}
                                                            onBlur={formik.handleBlur}
                                                            invalid={
                                                                formik.touched.quantity && !!formik.errors.quantity
                                                            }
                                                            disabled={loading}
                                                        />
                                                        <FormFeedback>{formik.errors.quantity}</FormFeedback>
                                                    </div>
                                                </Col>

                                                {/* Min Stock */}
                                                <Col md={4}>
                                                    <div className="mb-3">
                                                        <Label htmlFor="min_stock" className="form-label">
                                                            حداقل موجودی
                                                        </Label>
                                                        <Input
                                                            id="min_stock"
                                                            name="min_stock"
                                                            type="number"
                                                            placeholder="10"
                                                            value={formik.values.min_stock}
                                                            onChange={formik.handleChange}
                                                            disabled={loading}
                                                        />
                                                    </div>
                                                </Col>

                                                {/* Max Stock */}
                                                <Col md={4}>
                                                    <div className="mb-3">
                                                        <Label htmlFor="max_stock" className="form-label">
                                                            حداکثر موجودی
                                                        </Label>
                                                        <Input
                                                            id="max_stock"
                                                            name="max_stock"
                                                            type="number"
                                                            placeholder="100"
                                                            value={formik.values.max_stock}
                                                            onChange={formik.handleChange}
                                                            disabled={loading}
                                                        />
                                                    </div>
                                                </Col>
                                            </Row>

                                            <Row>
                                                {/* Price */}
                                                <Col md={4}>
                                                    <div className="mb-3">
                                                        <Label htmlFor="price" className="form-label">
                                                            قیمت فروش (تومان)
                                                        </Label>
                                                        <Input
                                                            id="price"
                                                            name="price"
                                                            type="number"
                                                            placeholder="1000000"
                                                            value={formik.values.price}
                                                            onChange={formik.handleChange}
                                                            onBlur={formik.handleBlur}
                                                            invalid={formik.touched.price && !!formik.errors.price}
                                                            disabled={loading}
                                                        />
                                                        <FormFeedback>{formik.errors.price}</FormFeedback>
                                                    </div>
                                                </Col>

                                                {/* Cost Price */}
                                                <Col md={4}>
                                                    <div className="mb-3">
                                                        <Label htmlFor="cost_price" className="form-label">
                                                            قیمت خرید (تومان)
                                                        </Label>
                                                        <Input
                                                            id="cost_price"
                                                            name="cost_price"
                                                            type="number"
                                                            placeholder="900000"
                                                            value={formik.values.cost_price}
                                                            onChange={formik.handleChange}
                                                            disabled={loading}
                                                        />
                                                    </div>
                                                </Col>

                                                {/* Location */}
                                                <Col md={4}>
                                                    <div className="mb-3">
                                                        <Label htmlFor="location" className="form-label">
                                                            موقعیت انبار
                                                        </Label>
                                                        <Input
                                                            id="location"
                                                            name="location"
                                                            type="text"
                                                            placeholder="قفسه A، ردیف 3"
                                                            value={formik.values.location}
                                                            onChange={formik.handleChange}
                                                            disabled={loading}
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
                                                {/* Barcode */}
                                                <Col md={4}>
                                                    <div className="mb-3">
                                                        <Label htmlFor="barcode" className="form-label">
                                                            بارکد
                                                        </Label>
                                                        <Input
                                                            id="barcode"
                                                            name="barcode"
                                                            type="text"
                                                            placeholder="123456789"
                                                            value={formik.values.barcode}
                                                            onChange={formik.handleChange}
                                                            disabled={loading}
                                                        />
                                                    </div>
                                                </Col>

                                                {/* Batch Number */}
                                                <Col md={4}>
                                                    <div className="mb-3">
                                                        <Label htmlFor="batch_number" className="form-label">
                                                            شماره دسته
                                                        </Label>
                                                        <Input
                                                            id="batch_number"
                                                            name="batch_number"
                                                            type="text"
                                                            placeholder="BATCH-2024-001"
                                                            value={formik.values.batch_number}
                                                            onChange={formik.handleChange}
                                                            disabled={loading}
                                                        />
                                                    </div>
                                                </Col>

                                                {/* Expire Date */}
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
                                                            disabled={loading}
                                                        />
                                                    </div>
                                                </Col>
                                            </Row>
                                        </div>

                                        {/* توضیحات */}
                                        <div className="mb-4">
                                            <Row>
                                                {/* Description */}
                                                <Col md={6}>
                                                    <div className="mb-3">
                                                        <Label htmlFor="description" className="form-label">
                                                            توضیحات
                                                        </Label>
                                                        <Input
                                                            id="description"
                                                            name="description"
                                                            type="textarea"
                                                            rows="4"
                                                            placeholder="توضیحات اختیاری درباره کالا..."
                                                            value={formik.values.description}
                                                            onChange={formik.handleChange}
                                                            disabled={loading}
                                                        />
                                                    </div>
                                                </Col>

                                                {/* Specifications */}
                                                <Col md={6}>
                                                    <div className="mb-3">
                                                        <Label htmlFor="specifications" className="form-label">
                                                            مشخصات فنی
                                                        </Label>
                                                        <Input
                                                            id="specifications"
                                                            name="specifications"
                                                            type="textarea"
                                                            rows="4"
                                                            placeholder="مشخصات فنی کالا..."
                                                            value={formik.values.specifications}
                                                            onChange={formik.handleChange}
                                                            disabled={loading}
                                                        />
                                                    </div>
                                                </Col>
                                            </Row>
                                        </div>

                                        {/* Active Status */}
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
                                                            disabled={loading}
                                                        />
                                                        <Label className="form-check-label" htmlFor="is_active">
                                                            کالا فعال باشد
                                                        </Label>
                                                    </div>
                                                </div>
                                            </Col>
                                        </Row>

                                        {/* Action Buttons */}
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
                                                        ثبت کالا
                                                    </>
                                                )}
                                            </Button>

                                            <Button
                                                type="button"
                                                color="light"
                                                disabled={loading}
                                                onClick={() => {
                                                    formik.resetForm();
                                                    setError("");
                                                    setSuccess("");
                                                }}
                                            >
                                                <i className="bx bx-refresh me-1"></i>
                                                پاک کردن فرم
                                            </Button>

                                            <Button
                                                type="button"
                                                color="secondary"
                                                onClick={() => navigate("/inventory/product-list")}
                                                disabled={loading}
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

export default AddProduct;