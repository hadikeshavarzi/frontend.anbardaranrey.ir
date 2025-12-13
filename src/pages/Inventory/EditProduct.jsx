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
        LOAD UNIT & CATEGORY DATA
    ------------------------------*/
    useEffect(() => {
        async function loadData() {
            setLoadingData(true);
            setError("");

            try {
                const [unitsRes, catsRes] = await Promise.all([
                    get("/product-units"),
                    get("/product-categories"),
                ]);

                console.log("🔥 Units:", unitsRes);
                console.log("🔥 Categories:", catsRes);

                // --- Sort ---
                const unitsList = (Array.isArray(unitsRes) ? unitsRes : unitsRes?.data || [])
                    .sort((a, b) => a.name.localeCompare(b.name, "fa"));

                const catList = (catsRes?.data || [])
                    .sort((a, b) => a.name.localeCompare(b.name, "fa"));

                setUnits(unitsList);
                setCategories(catList);
            } catch (err) {
                console.error("❌ Error loading initial data:", err);
                setError("خطا در بارگذاری اطلاعات اولیه (واحدها و دسته‌بندی‌ها)");
            }

            setLoadingData(false);
        }

        loadData();
    }, []);


    /* -----------------------------
        LOAD PRODUCT INFO
    ------------------------------*/
    const loadProduct = async () => {
        setLoading(true);
        setError("");

        try {
            const res = await get(`/products/${id}`);

            const p = res?.data || res;

            setInitialData({
                name: p.name || "",
                sku: p.sku || "",
                category_id: p.category_id || "",
                unit_id: p.unit_id || "",
                min_stock: p.min_stock ?? "",
                max_stock: p.max_stock ?? "",
                location: p.location ?? "",
                price: p.price ?? "",
                cost_price: p.cost_price ?? "",
                barcode: p.barcode ?? "",
                batch_number: p.batch_number ?? "",
                expire_date: p.expire_date ?? "",
                description: p.description ?? "",
                specifications: p.specifications ?? "",
                is_active: p.is_active ?? true,
                notes: p.notes ?? ""
            });

        } catch (err) {
            console.error("❌ Error loading product:", err);
            setError("کالای مورد نظر یافت نشد.");
        }

        setLoading(false);
    };

    useEffect(() => {
        loadProduct();
    }, [id]);

    /* -----------------------------
                FORM
    ------------------------------*/
    const formik = useFormik({
        enableReinitialize: true,
        initialValues: initialData,
        validationSchema: Yup.object({
            name: Yup.string()
                .required("نام کالا الزامی است")
                .min(2, "حداقل ۲ کاراکتر"),
            sku: Yup.string()
                .required("کد کالا الزامی است"),
            category_id: Yup.string().required("انتخاب دسته‌بندی الزامی است"),
            unit_id: Yup.string().required("انتخاب واحد الزامی است"),
            price: Yup.number()
                .nullable()
                .typeError("قیمت باید عدد باشد")
                .min(0, "قیمت نمی‌تواند منفی باشد"),
        }),
        onSubmit: async (values) => {
            setSaving(true);
            setError("");
            setSuccess("");

            try {
                // CHECK DUPLICATE SKU (EXCLUDING CURRENT PRODUCT)
                const allProductsRes = await get("/products");
                const allProducts = Array.isArray(allProductsRes)
                    ? allProductsRes
                    : allProductsRes?.data || [];

                const exists = allProducts.some((p) =>
                    p.id !== Number(id) &&
                    (p.sku || "").trim().toLowerCase() === values.sku.trim().toLowerCase()
                );

                if (exists) {
                    setError("کالای دیگری با همین کد (SKU) وجود دارد.");
                    setSaving(false);
                    return;
                }

                // FINAL PAYLOAD (MATCHES SUPABASE TABLE EXACTLY)
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
                    notes: values.notes || null
                };

                const result = await patch(`/products/${id}`, payload);

                if (result?.data?.id || result?.id) {
                    setSuccess("تغییرات با موفقیت ذخیره شد.");
                    setTimeout(() => navigate("/inventory/product-list"), 1200);
                } else {
                    setError("خطا در ذخیره تغییرات");
                }

            } catch (err) {
                console.error("❌ Update error:", err);
                setError(err?.response?.data?.message || "خطای غیرمنتظره");
            }

            setSaving(false);
        },
    });

    /* -----------------------------
        LOADING SCREEN
    ------------------------------*/
    if (loading || loadingData) {
        return (
            <div className="page-content">
                <Container fluid>
                    <Card>
                        <CardBody className="text-center py-5">
                            <Spinner color="primary" />
                            <h5 className="text-muted mt-3">در حال بارگذاری...</h5>
                        </CardBody>
                    </Card>
                </Container>
            </div>
        );
    }

    /* -----------------------------
                FORM UI
    ------------------------------*/
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
                                    {error && (
                                        <Alert color="danger">{error}</Alert>
                                    )}
                                    {success && (
                                        <Alert color="success">{success}</Alert>
                                    )}

                                    <Form
                                        onSubmit={(e) => {
                                            e.preventDefault();
                                            formik.handleSubmit();
                                        }}
                                    >
                                        {/* BASIC INFO */}
                                        <div className="mb-4">
                                            <h5 className="font-size-14 mb-3">
                                                <i className="bx bx-info-circle me-1"></i>
                                                اطلاعات پایه
                                            </h5>

                                            <Row>
                                                <Col md={6}>
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
                                                </Col>

                                                <Col md={6}>
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
                                                </Col>
                                            </Row>

                                            <Row className="mt-3">
                                                <Col md={6}>
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
                                                            <option key={c.id} value={c.id}>
                                                                {c.name}
                                                            </option>
                                                        ))}
                                                    </Input>
                                                    <FormFeedback>{formik.errors.category_id}</FormFeedback>
                                                </Col>

                                                <Col md={6}>
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
                                                                {u.name} {u.symbol ? `(${u.symbol})` : ""}
                                                            </option>
                                                        ))}
                                                    </Input>
                                                    <FormFeedback>{formik.errors.unit_id}</FormFeedback>
                                                </Col>
                                            </Row>
                                        </div>

                                        {/* STOCK & PRICE */}
                                        <div className="mb-4">
                                            <h5 className="font-size-14 mb-3">
                                                <i className="bx bx-dollar-circle me-1"></i>
                                                موجودی هدف و قیمت
                                            </h5>

                                            <Row>
                                                <Col md={4}>
                                                    <Label>حداقل موجودی</Label>
                                                    <Input
                                                        id="min_stock"
                                                        name="min_stock"
                                                        type="number"
                                                        value={formik.values.min_stock}
                                                        onChange={formik.handleChange}
                                                        disabled={saving}
                                                    />
                                                </Col>

                                                <Col md={4}>
                                                    <Label>حداکثر موجودی</Label>
                                                    <Input
                                                        id="max_stock"
                                                        name="max_stock"
                                                        type="number"
                                                        value={formik.values.max_stock}
                                                        onChange={formik.handleChange}
                                                        disabled={saving}
                                                    />
                                                </Col>

                                                <Col md={4}>
                                                    <Label>موقعیت انبار</Label>
                                                    <Input
                                                        id="location"
                                                        name="location"
                                                        type="text"
                                                        value={formik.values.location}
                                                        onChange={formik.handleChange}
                                                        disabled={saving}
                                                    />
                                                </Col>
                                            </Row>

                                            <Row className="mt-3">
                                                <Col md={4}>
                                                    <Label>قیمت فروش</Label>
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
                                                </Col>

                                                <Col md={4}>
                                                    <Label>قیمت خرید</Label>
                                                    <Input
                                                        id="cost_price"
                                                        name="cost_price"
                                                        type="number"
                                                        value={formik.values.cost_price}
                                                        onChange={formik.handleChange}
                                                        disabled={saving}
                                                    />
                                                </Col>

                                                <Col md={4}>
                                                    <Label>تاریخ انقضا</Label>
                                                    <Input
                                                        id="expire_date"
                                                        name="expire_date"
                                                        type="date"
                                                        value={formik.values.expire_date}
                                                        onChange={formik.handleChange}
                                                        disabled={saving}
                                                    />
                                                </Col>
                                            </Row>
                                        </div>

                                        {/* EXTRA INFO */}
                                        <div className="mb-4">
                                            <h5 className="font-size-14 mb-3">
                                                <i className="bx bx-barcode me-1"></i>
                                                اطلاعات تکمیلی
                                            </h5>

                                            <Row>
                                                <Col md={4}>
                                                    <Label>بارکد</Label>
                                                    <Input
                                                        id="barcode"
                                                        name="barcode"
                                                        value={formik.values.barcode}
                                                        onChange={formik.handleChange}
                                                        disabled={saving}
                                                    />
                                                </Col>

                                                <Col md={4}>
                                                    <Label>شماره دسته</Label>
                                                    <Input
                                                        id="batch_number"
                                                        name="batch_number"
                                                        value={formik.values.batch_number}
                                                        onChange={formik.handleChange}
                                                        disabled={saving}
                                                    />
                                                </Col>

                                                <Col md={4}>
                                                    <Label>یادداشت‌ها</Label>
                                                    <Input
                                                        id="notes"
                                                        name="notes"
                                                        value={formik.values.notes}
                                                        onChange={formik.handleChange}
                                                        disabled={saving}
                                                    />
                                                </Col>
                                            </Row>

                                            <Row className="mt-3">
                                                <Col md={6}>
                                                    <Label>توضیحات</Label>
                                                    <Input
                                                        id="description"
                                                        name="description"
                                                        type="textarea"
                                                        rows="3"
                                                        value={formik.values.description}
                                                        onChange={formik.handleChange}
                                                        disabled={saving}
                                                    />
                                                </Col>

                                                <Col md={6}>
                                                    <Label>مشخصات فنی</Label>
                                                    <Input
                                                        id="specifications"
                                                        name="specifications"
                                                        type="textarea"
                                                        rows="3"
                                                        value={formik.values.specifications}
                                                        onChange={formik.handleChange}
                                                        disabled={saving}
                                                    />
                                                </Col>
                                            </Row>
                                        </div>

                                        {/* ACTIVE */}
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
                                                فعال باشد
                                            </Label>
                                        </div>

                                        {/* BUTTONS */}
                                        <div className="d-flex gap-2">
                                            <Button color="primary" type="submit" disabled={saving}>
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

export default EditProduct;
