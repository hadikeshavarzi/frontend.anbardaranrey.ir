import React, { useEffect, useState } from "react";
import {
    Container,
    Row,
    Col,
    Card,
    CardBody,
    Table,
    Button,
    Spinner,
    Alert,
    Badge,
    Input,
} from "reactstrap";
import { Link } from "react-router-dom";
import { get, del } from "../../helpers/api_helper.jsx";

const ProductList = () => {
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [searchTerm, setSearchTerm] = useState("");

    const loadProducts = async () => {
        setLoading(true);
        setError("");

        console.log("🔍 Loading products list...");

        try {
            const res = await get("/products");
            console.log("✅ Products loaded successfully:", res);

            const productList = res?.docs || [];
            setProducts(productList);
            setFilteredProducts(productList);
        } catch (err) {
            console.error("❌ Error loading products:", err);
            setError(err.response?.data?.message || "خطا در دریافت لیست کالاها");
        }

        setLoading(false);
    };

    useEffect(() => {
        loadProducts();
    }, []);

    // جستجو
    useEffect(() => {
        if (searchTerm.trim() === "") {
            setFilteredProducts(products);
        } else {
            const filtered = products.filter(
                (p) =>
                    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (p.barcode && p.barcode.toLowerCase().includes(searchTerm.toLowerCase()))
            );
            setFilteredProducts(filtered);
        }
    }, [searchTerm, products]);

    const handleDelete = async (id, name) => {
        if (!window.confirm(`آیا از حذف کالای "${name}" مطمئن هستید؟`)) return;

        console.log("🗑️ Deleting product with ID:", id);

        try {
            await del(`/products/${id}`);
            console.log("✅ Delete successful");

            setProducts((prev) => prev.filter((p) => p.id !== id));
            setFilteredProducts((prev) => prev.filter((p) => p.id !== id));

            setSuccess(`کالای "${name}" با موفقیت حذف شد`);
            setError("");

            setTimeout(() => setSuccess(""), 3000);
        } catch (err) {
            console.error("❌ Delete error:", err);

            if (err.response?.status === 404) {
                setError("کالای مورد نظر یافت نشد.");
                setProducts((prev) => prev.filter((p) => p.id !== id));
                setFilteredProducts((prev) => prev.filter((p) => p.id !== id));
            } else if (err.response?.status === 400) {
                setError("این کالا دارای تراکنش‌های مرتبط است و قابل حذف نیست.");
            } else {
                setError(err.response?.data?.message || "خطا در حذف کالا");
            }
        }
    };

    // فرمت قیمت
    const formatPrice = (price) => {
        if (!price) return "-";
        return new Intl.NumberFormat("fa-IR").format(price) + " تومان";
    };

    // رنگ موجودی
    const getStockBadge = (product) => {
        const qty = product.quantity || 0;
        const min = product.min_stock || 0;

        if (qty === 0) {
            return <Badge color="danger" className="badge-soft-danger">ناموجود</Badge>;
        } else if (qty <= min) {
            return <Badge color="warning" className="badge-soft-warning">کمبود موجودی</Badge>;
        } else {
            return <Badge color="success" className="badge-soft-success">موجود</Badge>;
        }
    };

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    {/* Breadcrumb */}
                    <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                        <h4 className="mb-sm-0 font-size-18">کالاها</h4>

                        <div className="page-title-right">
                            <ol className="breadcrumb m-0">
                                <li className="breadcrumb-item">
                                    <Link to="/dashboard">داشبورد</Link>
                                </li>
                                <li className="breadcrumb-item active">کالاها</li>
                            </ol>
                        </div>
                    </div>

                    <Row>
                        <Col lg={12}>
                            <Card>
                                <CardBody>
                                    {/* Header */}
                                    <div className="d-flex flex-wrap align-items-center justify-content-between mb-4">
                                        <div>
                                            <h4 className="card-title mb-1">لیست کالاها</h4>
                                            <p className="card-title-desc mb-0">
                                                مدیریت کالاها و موجودی انبار
                                            </p>
                                        </div>

                                        <div className="d-flex flex-wrap gap-2">
                                            <Button
                                                color="light"
                                                onClick={loadProducts}
                                                disabled={loading}
                                            >
                                                <i className="bx bx-refresh me-1"></i>
                                                بروزرسانی
                                            </Button>

                                            <Link
                                                to="/inventory/add-product"
                                                className="btn btn-success"
                                            >
                                                <i className="bx bx-plus-circle me-1"></i>
                                                افزودن کالای جدید
                                            </Link>
                                        </div>
                                    </div>

                                    {/* Alerts */}
                                    {error && (
                                        <Alert
                                            color="danger"
                                            className="alert-dismissible fade show"
                                        >
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
                                        <Alert
                                            color="success"
                                            className="alert-dismissible fade show"
                                        >
                                            <i className="mdi mdi-check-all me-2"></i>
                                            {success}
                                            <button
                                                type="button"
                                                className="btn-close"
                                                onClick={() => setSuccess("")}
                                            ></button>
                                        </Alert>
                                    )}

                                    {/* Search & Stats */}
                                    {!loading && products.length > 0 && (
                                        <Row className="mb-3">
                                            <Col md={6}>
                                                <div className="search-box">
                                                    <div className="position-relative">
                                                        <Input
                                                            type="text"
                                                            className="form-control"
                                                            placeholder="جستجو بر اساس نام، کد یا بارکد..."
                                                            value={searchTerm}
                                                            onChange={(e) => setSearchTerm(e.target.value)}
                                                        />
                                                        <i className="bx bx-search-alt search-icon"></i>
                                                    </div>
                                                </div>
                                            </Col>
                                            <Col md={6} className="text-end">
                                                <div className="text-muted">
                                                    تعداد کل: <strong>{products.length}</strong> کالا
                                                    {searchTerm && (
                                                        <>
                                                            {" "}
                                                            | نتایج جستجو:{" "}
                                                            <strong>{filteredProducts.length}</strong>
                                                        </>
                                                    )}
                                                </div>
                                            </Col>
                                        </Row>
                                    )}

                                    {/* Table */}
                                    {loading ? (
                                        <div className="text-center py-5">
                                            <Spinner color="primary" />
                                            <div className="mt-3">
                                                <h5 className="text-muted">در حال بارگذاری...</h5>
                                            </div>
                                        </div>
                                    ) : products.length === 0 ? (
                                        <div className="text-center py-5">
                                            <div className="avatar-lg mx-auto mb-4">
                                                <div className="avatar-title bg-soft-warning text-warning rounded-circle font-size-24">
                                                    <i className="bx bx-info-circle"></i>
                                                </div>
                                            </div>
                                            <h5 className="text-muted">هیچ کالایی ثبت نشده است</h5>
                                            <p className="text-muted">
                                                برای شروع، کالای جدیدی اضافه کنید
                                            </p>
                                            <Link
                                                to="/inventory/add-product"
                                                className="btn btn-success mt-2"
                                            >
                                                <i className="bx bx-plus-circle me-1"></i>
                                                افزودن اولین کالا
                                            </Link>
                                        </div>
                                    ) : filteredProducts.length === 0 ? (
                                        <div className="text-center py-5">
                                            <div className="avatar-lg mx-auto mb-4">
                                                <div className="avatar-title bg-soft-info text-info rounded-circle font-size-24">
                                                    <i className="bx bx-search"></i>
                                                </div>
                                            </div>
                                            <h5 className="text-muted">نتیجه‌ای یافت نشد</h5>
                                            <p className="text-muted">
                                                کالایی با این مشخصات پیدا نشد
                                            </p>
                                            <Button color="light" onClick={() => setSearchTerm("")}>
                                                پاک کردن جستجو
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="table-responsive">
                                            <Table className="table table-hover table-nowrap align-middle mb-0">
                                                <thead className="table-light">
                                                <tr>
                                                    <th style={{ width: "60px" }}>#</th>
                                                    <th>نام کالا</th>
                                                    <th>کد کالا</th>
                                                    <th>دسته‌بندی</th>
                                                    <th>واحد</th>
                                                    <th>موجودی</th>
                                                    <th>قیمت</th>
                                                    <th style={{ width: "100px" }}>وضعیت</th>
                                                    <th style={{ width: "160px" }}>عملیات</th>
                                                </tr>
                                                </thead>
                                                <tbody>
                                                {filteredProducts.map((product, index) => (
                                                    <tr key={product.id}>
                                                        <td>
                                                            <div className="avatar-xs">
                                  <span className="avatar-title rounded-circle bg-soft-primary text-primary">
                                    {index + 1}
                                  </span>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <h5 className="font-size-14 mb-0">
                                                                {product.name}
                                                            </h5>
                                                            {product.barcode && (
                                                                <small className="text-muted">
                                                                    <i className="bx bx-barcode"></i> {product.barcode}
                                                                </small>
                                                            )}
                                                        </td>
                                                        <td>
                                                            <Badge color="info" className="badge-soft-info" pill>
                                                                {product.sku}
                                                            </Badge>
                                                        </td>
                                                        <td>
                                <span className="text-muted">
                                  {product.category?.name || "-"}
                                </span>
                                                        </td>
                                                        <td>
                                <span className="text-muted">
                                  {product.unit?.name || "-"}
                                </span>
                                                        </td>
                                                        <td>
                                                            <strong>{product.quantity || 0}</strong>
                                                        </td>
                                                        <td>
                                <span className="text-muted">
                                  {formatPrice(product.price)}
                                </span>
                                                        </td>
                                                        <td>
                                                            {getStockBadge(product)}
                                                        </td>
                                                        <td>
                                                            <div className="d-flex gap-2">
                                                                <Link
                                                                    to={`/inventory/edit-product/${product.id}`}
                                                                    className="btn btn-sm btn-soft-primary"
                                                                >
                                                                    <i className="bx bx-edit-alt"></i>
                                                                </Link>
                                                                <Button
                                                                    size="sm"
                                                                    color="soft-danger"
                                                                    onClick={() =>
                                                                        handleDelete(product.id, product.name)
                                                                    }
                                                                >
                                                                    <i className="bx bx-trash"></i>
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                                </tbody>
                                            </Table>
                                        </div>
                                    )}
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>
        </React.Fragment>
    );
};

export default ProductList;