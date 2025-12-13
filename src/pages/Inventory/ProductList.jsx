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

    /* -------------------------------------------------
       Load Products
    ------------------------------------------------- */
    const loadProducts = async () => {
        setLoading(true);
        setError("");

        try {
            const res = await get("/products");


            // نتیجه می‌تواند آرایه یا {data: [...]} باشد
            let rawList = Array.isArray(res)
                ? res
                : Array.isArray(res?.data)
                    ? res.data
                    : [];

            // فقط رکوردهایی که واقعاً کالا هستند (SKU دارند) را نگه می‌داریم
            let productList = rawList.filter((p) => !!(p.sku && String(p.sku).trim()));

            // مرتب‌سازی الفبایی بر اساس نام
            productList.sort((a, b) => {
                const an = (a.name || "").toString();
                const bn = (b.name || "").toString();
                return an.localeCompare(bn, "fa");
            });

            setProducts(productList);
            setFilteredProducts(productList);
        } catch (err) {

            setError("خطا در دریافت لیست کالاها");
        }

        setLoading(false);
    };

    useEffect(() => {
        loadProducts();
    }, []);

    /* -------------------------------------------------
       Search Filter
    ------------------------------------------------- */
    useEffect(() => {
        if (!searchTerm.trim()) {
            setFilteredProducts(products);
            return;
        }

        const lower = searchTerm.toLowerCase();

        const filtered = products.filter((p) => {
            const categoryName =
                p.category?.name ||
                p.product_categories?.name ||
                "";
            const unitName =
                p.unit?.name ||
                p.product_units?.name ||
                "";

            return (
                p.name?.toLowerCase().includes(lower) ||
                p.sku?.toLowerCase().includes(lower) ||
                p.barcode?.toLowerCase().includes(lower) ||
                categoryName.toLowerCase().includes(lower) ||
                unitName.toLowerCase().includes(lower)
            );
        });

        setFilteredProducts(filtered);
    }, [searchTerm, products]);

    /* -------------------------------------------------
       Delete Product
    ------------------------------------------------- */
    const handleDelete = async (id, name) => {
        if (!window.confirm(`آیا از حذف "${name}" مطمئن هستید؟`)) return;

        try {
            await del(`/products/${id}`);

            setProducts((prev) => prev.filter((p) => p.id !== id));
            setFilteredProducts((prev) => prev.filter((p) => p.id !== id));

            setSuccess(`کالا "${name}" حذف شد.`);
            setTimeout(() => setSuccess(""), 2500);
        } catch (err) {
         

            if (err.response?.status === 409) {
                setError("این کالا دارای تراکنش مرتبط است و قابل حذف نیست.");
            } else {
                setError("خطا در حذف کالا");
            }
        }
    };

    /* -------------------------------------------------
       Helpers
    ------------------------------------------------- */
    const formatPrice = (price) =>
        price ? new Intl.NumberFormat("fa-IR").format(price) + " تومان" : "-";

    const renderStockBadge = (product) => {
        const min = product.min_stock || 0;

        return (
            <Badge color="warning" className="badge-soft-warning">
                حداقل موجودی: {min}
            </Badge>
        );
    };

    const getCategoryName = (product) =>
        product.category?.name ||
        product.product_categories?.name ||
        "-";

    const getUnitName = (product) =>
        product.unit?.name ||
        product.product_units?.name ||
        "-";

    /* -------------------------------------------------
       UI
    ------------------------------------------------- */
    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    {/* عنوان صفحه */}
                    <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                        <h4 className="mb-sm-0 font-size-18">کالاها</h4>
                        <div className="page-title-right">
                            <ol className="breadcrumb m-0">
                                <li className="breadcrumb-item">
                                    <Link to="/dashboard">داشبورد</Link>
                                </li>
                                <li className="breadcrumb-item active">لیست کالاها</li>
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
                                                مدیریت کالاها و دسته‌بندی آنها
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
                                            {success}
                                            <button
                                                type="button"
                                                className="btn-close"
                                                onClick={() => setSuccess("")}
                                            ></button>
                                        </Alert>
                                    )}

                                    {/* Search */}
                                    {!loading && products.length > 0 && (
                                        <Row className="mb-3">
                                            <Col md={6}>
                                                <div className="search-box">
                                                    <div className="position-relative">
                                                        <Input
                                                            type="text"
                                                            className="form-control"
                                                            placeholder="جستجو بر اساس نام، کد، بارکد، دسته یا واحد..."
                                                            value={searchTerm}
                                                            onChange={(e) =>
                                                                setSearchTerm(e.target.value)
                                                            }
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
                                                            | نتایج:{" "}
                                                            <strong>
                                                                {filteredProducts.length}
                                                            </strong>
                                                        </>
                                                    )}
                                                </div>
                                            </Col>
                                        </Row>
                                    )}

                                    {/* Table */}
                                    {loading ? (
                                        <div className="text-center py-5">
                                            <Spinner />
                                            <h5 className="mt-3 text-muted">
                                                در حال بارگذاری...
                                            </h5>
                                        </div>
                                    ) : filteredProducts.length === 0 ? (
                                        <div className="text-center py-5">
                                            <h5 className="text-muted">کالایی یافت نشد</h5>
                                        </div>
                                    ) : (
                                        <div className="table-responsive">
                                            <Table className="table table-hover align-middle">
                                                <thead className="table-light">
                                                <tr>
                                                    <th>#</th>
                                                    <th>نام کالا</th>
                                                    <th>کد کالا</th>
                                                    <th>دسته</th>
                                                    <th>واحد</th>
                                                    <th>حداقل موجودی</th>
                                                    <th>قیمت</th>
                                                    <th>وضعیت</th>
                                                    <th>عملیات</th>
                                                </tr>
                                                </thead>

                                                <tbody>
                                                {filteredProducts.map((product, index) => (
                                                    <tr key={product.id}>
                                                        <td>{index + 1}</td>

                                                        <td>
                                                            <strong>{product.name}</strong>
                                                            <br />
                                                            {product.barcode && (
                                                                <small className="text-muted">
                                                                    <i className="bx bx-barcode"></i>{" "}
                                                                    {product.barcode}
                                                                </small>
                                                            )}
                                                        </td>

                                                        <td>
                                                            <Badge
                                                                pill
                                                                color="info"
                                                                className="badge-soft-info"
                                                            >
                                                                {product.sku}
                                                            </Badge>
                                                        </td>

                                                        <td>{getCategoryName(product)}</td>
                                                        <td>{getUnitName(product)}</td>

                                                        <td>
                                                            <Badge
                                                                color="warning"
                                                                className="badge-soft-warning"
                                                            >
                                                                {product.min_stock || 0}
                                                            </Badge>
                                                        </td>

                                                        <td>{formatPrice(product.price)}</td>

                                                        <td>{renderStockBadge(product)}</td>

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
                                                                        handleDelete(
                                                                            product.id,
                                                                            product.name
                                                                        )
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
