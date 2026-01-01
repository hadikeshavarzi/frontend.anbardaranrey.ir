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

// ✅ تغییر مهم: استفاده مستقیم از کلاینت سوپابیس برای جلوگیری از خطای اینترسپتور
import { supabase } from "../../helpers/supabase";

const EditProduct = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true); // لودینگ دریافت محصول
    const [saving, setSaving] = useState(false);  // لودینگ ذخیره
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // لیست‌ها
    const [units, setUnits] = useState([]);
    const [categories, setCategories] = useState([]);

    const [initialData, setInitialData] = useState({
        name: "",
        sku: "",
        category_id: "",
        unit_id: "",
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
        notes: ""
    });

    /* -----------------------------
        1. LOAD ALL DATA (Categories, Units, Product)
    ------------------------------*/
    useEffect(() => {
        const fetchAllData = async () => {
            setLoading(true);
            setError("");

            try {
                // الف) دریافت واحدها و دسته‌ها
                const { data: unitsData } = await supabase.from("product_units").select("*");
                const { data: catsData } = await supabase.from("product_categories").select("*");

                setUnits(unitsData || []);
                setCategories(catsData || []);

                // ب) دریافت اطلاعات محصول
                // نکته: اینجا فقط select('*') میزنیم تا قاطی نکند (مشکل relationship پیش نیاید)
                const { data: product, error: productError } = await supabase
                    .from("products")
                    .select("*")
                    .eq("id", id)
                    .single();

                if (productError) throw productError;

                // پر کردن فرم
                setInitialData({
                    name: product.name || "",
                    sku: product.sku || "",
                    category_id: product.category_id || "",
                    unit_id: product.unit_id || "",
                    min_stock: product.min_stock ?? "",
                    max_stock: product.max_stock ?? "",
                    location: product.location ?? "",
                    price: product.price ?? "",
                    cost_price: product.cost_price ?? "",
                    barcode: product.barcode ?? "",
                    batch_number: product.batch_number ?? "",
                    expire_date: product.expire_date ?? "",
                    description: product.description ?? "",
                    specifications: product.specifications ?? "",
                    is_active: product.is_active ?? true,
                    notes: product.notes ?? ""
                });

            } catch (err) {
                console.error("❌ Error fetching data:", err);
                setError("خطا در دریافت اطلاعات: " + (err.message || "نامشخص"));
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchAllData();
    }, [id]);

    /* -----------------------------
                FORM LOGIC
    ------------------------------*/
    const formik = useFormik({
        enableReinitialize: true,
        initialValues: initialData,
        validationSchema: Yup.object({
            name: Yup.string().required("نام کالا الزامی است").min(2, "حداقل ۲ کاراکتر"),
            sku: Yup.string().required("کد کالا الزامی است"),
            category_id: Yup.string().required("انتخاب دسته‌بندی الزامی است"),
            unit_id: Yup.string().required("انتخاب واحد الزامی است"),
            price: Yup.number().nullable().typeError("قیمت باید عدد باشد").min(0, "قیمت نمی‌تواند منفی باشد"),
        }),
        onSubmit: async (values) => {
            setSaving(true);
            setError("");
            setSuccess("");

            try {
                // 1. چک کردن SKU تکراری (به جز خودش)
                const { data: duplicateCheck } = await supabase
                    .from("products")
                    .select("id")
                    .eq("sku", values.sku)
                    .neq("id", id); // به جز آیدی خودش

                if (duplicateCheck && duplicateCheck.length > 0) {
                    setError("کالای دیگری با همین کد (SKU) وجود دارد.");
                    setSaving(false);
                    return;
                }

                // 2. آماده‌سازی دیتا
                const payload = {
                    name: values.name,
                    sku: values.sku,
                    category_id: Number(values.category_id),
                    unit_id: Number(values.unit_id),
                    min_stock: values.min_stock ? Number(values.min_stock) : 0,
                    max_stock: values.max_stock ? Number(values.max_stock) : null,
                    location: values.location || null,
                    price: values.price ? Number(values.price) : null,
                    cost_price: values.cost_price ? Number(values.cost_price) : null,
                    barcode: values.barcode || null,
                    batch_number: values.batch_number || null,
                    expire_date: values.expire_date || null,
                    description: values.description || null,
                    specifications: values.specifications || null,
                    is_active: values.is_active,
                    notes: values.notes || null,
                    updated_at: new Date() // آپدیت تاریخ
                };

                // 3. ارسال آپدیت
                const { error: updateError } = await supabase
                    .from("products")
                    .update(payload)
                    .eq("id", id);

                if (updateError) throw updateError;

                setSuccess("تغییرات با موفقیت ذخیره شد.");
                setTimeout(() => navigate("/inventory/product-list"), 1500);

            } catch (err) {
                console.error("❌ Update error:", err);
                setError("خطا در ذخیره تغییرات: " + err.message);
            } finally {
                setSaving(false);
            }
        },
    });

    /* -----------------------------
        RENDER
    ------------------------------*/
    if (loading) {
        return (
            <div className="page-content">
                <Container fluid>
                    <Card>
                        <CardBody className="text-center py-5">
                            <Spinner color="primary" />
                            <h5 className="text-muted mt-3">در حال بارگذاری اطلاعات کالا...</h5>
                        </CardBody>
                    </Card>
                </Container>
            </div>
        );
    }

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>

                    {/* Breadcrumb */}
                    <div className="page-title-box d-flex align-items-center justify-content-between">
                        <h4 className="mb-0">ویرایش کالا</h4>
                        <div className="page-title-right">
                            <ol className="breadcrumb m-0">
                                <li className="breadcrumb-item"><Link to="/dashboard">داشبورد</Link></li>
                                <li className="breadcrumb-item"><Link to="/inventory/product-list">کالاها</Link></li>
                                <li className="breadcrumb-item active">ویرایش</li>
                            </ol>
                        </div>
                    </div>

                    <Row>
                        <Col lg={10} className="mx-auto">
                            <Card>
                                <CardBody>

                                    {/* Alerts */}
                                    {error && <Alert color="danger">{error}</Alert>}
                                    {success && <Alert color="success">{success}</Alert>}

                                    <Form onSubmit={(e) => {
                                        e.preventDefault();
                                        formik.handleSubmit();
                                    }}>
                                        {/* BASIC INFO */}
                                        <div className="mb-4">
                                            <h5 className="font-size-14 mb-3 text-primary">
                                                <i className="bx bx-info-circle me-1"></i>
                                                اطلاعات پایه
                                            </h5>

                                            <Row>
                                                <Col md={6}>
                                                    <div className="mb-3">
                                                        <Label>نام کالا *</Label>
                                                        <Input
                                                            id="name"
                                                            name="name"
                                                            value={formik.values.name}
                                                            onChange={formik.handleChange}
                                                            onBlur={formik.handleBlur}
                                                            invalid={formik.touched.name && !!formik.errors.name}
                                                            disabled={saving}
                                                        />
                                                        <FormFeedback>{formik.errors.name}</FormFeedback>
                                                    </div>
                                                </Col>

                                                <Col md={6}>
                                                    <div className="mb-3">
                                                        <Label>کد کالا (SKU) *</Label>
                                                        <Input
                                                            id="sku"
                                                            name="sku"
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
                                                <Col md={6}>
                                                    <div className="mb-3">
                                                        <Label>دسته‌بندی *</Label>
                                                        <Input
                                                            id="category_id"
                                                            name="category_id"
                                                            type="select"
                                                            value={formik.values.category_id}
                                                            onChange={formik.handleChange}
                                                            invalid={formik.touched.category_id && !!formik.errors.category_id}
                                                            disabled={saving}
                                                        >
                                                            <option value="">انتخاب کنید...</option>
                                                            {categories.map((c) => (
                                                                <option key={c.id} value={c.id}>{c.name}</option>
                                                            ))}
                                                        </Input>
                                                        <FormFeedback>{formik.errors.category_id}</FormFeedback>
                                                    </div>
                                                </Col>

                                                <Col md={6}>
                                                    <div className="mb-3">
                                                        <Label>واحد *</Label>
                                                        <Input
                                                            id="unit_id"
                                                            name="unit_id"
                                                            type="select"
                                                            value={formik.values.unit_id}
                                                            onChange={formik.handleChange}
                                                            invalid={formik.touched.unit_id && !!formik.errors.unit_id}
                                                            disabled={saving}
                                                        >
                                                            <option value="">انتخاب کنید...</option>
                                                            {units.map((u) => (
                                                                <option key={u.id} value={u.id}>
                                                                    {u.name}
                                                                </option>
                                                            ))}
                                                        </Input>
                                                        <FormFeedback>{formik.errors.unit_id}</FormFeedback>
                                                    </div>
                                                </Col>
                                            </Row>
                                        </div>

                                        <hr />

                                        {/* STOCK & PRICE */}
                                        <div className="mb-4">
                                            <h5 className="font-size-14 mb-3 text-primary">
                                                <i className="bx bx-dollar-circle me-1"></i>
                                                موجودی هدف و قیمت
                                            </h5>

                                            <Row>
                                                <Col md={4}>
                                                    <div className="mb-3">
                                                        <Label>حداقل موجودی</Label>
                                                        <Input
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
                                                        <Label>حداکثر موجودی</Label>
                                                        <Input
                                                            name="max_stock"
                                                            type="number"
                                                            value={formik.values.max_stock}
                                                            onChange={formik.handleChange}
                                                            disabled={saving}
                                                        />
                                                    </div>
                                                </Col>
                                                <Col md={4}>
                                                    <div className="mb-3">
                                                        <Label>موقعیت انبار</Label>
                                                        <Input
                                                            name="location"
                                                            value={formik.values.location}
                                                            onChange={formik.handleChange}
                                                            disabled={saving}
                                                        />
                                                    </div>
                                                </Col>
                                            </Row>

                                            <Row>
                                                <Col md={4}>
                                                    <div className="mb-3">
                                                        <Label>قیمت فروش</Label>
                                                        <Input
                                                            name="price"
                                                            type="number"
                                                            value={formik.values.price}
                                                            onChange={formik.handleChange}
                                                            disabled={saving}
                                                        />
                                                    </div>
                                                </Col>
                                                <Col md={4}>
                                                    <div className="mb-3">
                                                        <Label>قیمت خرید</Label>
                                                        <Input
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
                                                        <Label>تاریخ انقضا</Label>
                                                        <Input
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

                                        <hr />

                                        {/* EXTRA INFO */}
                                        <div className="mb-4">
                                            <h5 className="font-size-14 mb-3 text-primary">
                                                <i className="bx bx-barcode me-1"></i>
                                                اطلاعات تکمیلی
                                            </h5>
                                            <Row>
                                                <Col md={4}>
                                                    <div className="mb-3">
                                                        <Label>بارکد</Label>
                                                        <Input
                                                            name="barcode"
                                                            value={formik.values.barcode}
                                                            onChange={formik.handleChange}
                                                            disabled={saving}
                                                        />
                                                    </div>
                                                </Col>
                                                <Col md={4}>
                                                    <div className="mb-3">
                                                        <Label>شماره دسته (Batch)</Label>
                                                        <Input
                                                            name="batch_number"
                                                            value={formik.values.batch_number}
                                                            onChange={formik.handleChange}
                                                            disabled={saving}
                                                        />
                                                    </div>
                                                </Col>
                                            </Row>

                                            <div className="mb-3">
                                                <Label>توضیحات</Label>
                                                <Input
                                                    type="textarea"
                                                    rows="3"
                                                    name="description"
                                                    value={formik.values.description}
                                                    onChange={formik.handleChange}
                                                    disabled={saving}
                                                />
                                            </div>
                                        </div>

                                        <div className="form-check form-switch mb-4">
                                            <Input
                                                type="checkbox"
                                                id="is_active"
                                                name="is_active"
                                                className="form-check-input"
                                                checked={formik.values.is_active}
                                                onChange={formik.handleChange}
                                                disabled={saving}
                                            />
                                            <Label className="form-check-label" htmlFor="is_active">
                                                این کالا فعال باشد
                                            </Label>
                                        </div>

                                        <div className="d-flex gap-2 justify-content-end">
                                            <Button type="button" color="secondary" onClick={() => navigate("/inventory/product-list")}>
                                                انصراف
                                            </Button>
                                            <Button type="submit" color="primary" disabled={saving}>
                                                {saving ? <Spinner size="sm" /> : "ذخیره تغییرات"}
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