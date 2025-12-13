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

const CustomerList = () => {
    const [customers, setCustomers] = useState([]);
    const [filteredCustomers, setFilteredCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [searchTerm, setSearchTerm] = useState("");

    // --------------------------
    // Load Customers
    // --------------------------
    const loadCustomers = async () => {
        setLoading(true);
        setError("");

        try {
            const res = await get("/customers"); // {success, data:[...]}
            const list = res?.data || [];

            setCustomers(list);
            setFilteredCustomers(list);
        } catch (err) {
            console.error("❌ Load error:", err);
            setError("خطا در دریافت لیست مشتریان");
        }

        setLoading(false);
    };

    useEffect(() => {
        loadCustomers();
    }, []);

    // --------------------------
    // Search Filter
    // --------------------------
    useEffect(() => {
        if (!searchTerm.trim()) {
            setFilteredCustomers(customers);
            return;
        }

        const s = searchTerm.toLowerCase();

        const filtered = customers.filter((c) =>
            (c.name || "").toLowerCase().includes(s) ||
            (c.mobile || "").toLowerCase().includes(s) ||
            (c.national_id || "").toLowerCase().includes(s)
        );

        setFilteredCustomers(filtered);
    }, [searchTerm, customers]);

    // --------------------------
    // DELETE Customer
    // --------------------------
    const handleDelete = async (id, name) => {
        if (!window.confirm(`حذف "${name}"؟`)) return;

        try {
            await del(`/customers/${id}`);

            setCustomers(prev => prev.filter(c => c.id !== id));
            setFilteredCustomers(prev => prev.filter(c => c.id !== id));

            setSuccess(`مشتری "${name}" با موفقیت حذف شد`);
            setTimeout(() => setSuccess(""), 3000);

        } catch (err) {
            const msg = err.response?.data?.message || "خطا در حذف مشتری";

            setError(msg);
            setTimeout(() => setError(""), 4000);
        }
    };


    // --------------------------
    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>

                    {/* Breadcrumb */}
                    <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                        <h4 className="mb-sm-0 font-size-18">لیست مشتریان</h4>

                        <div className="page-title-right">
                            <ol className="breadcrumb m-0">
                                <li className="breadcrumb-item">
                                    <Link to="/dashboard">داشبورد</Link>
                                </li>
                                <li className="breadcrumb-item active">مشتریان</li>
                            </ol>
                        </div>
                    </div>

                    <Row>
                        <Col lg={12}>
                            <Card>
                                <CardBody>

                                    {/* Header */}
                                    <div className="d-flex flex-wrap align-items-center justify-content-between mb-4">
                                        <div className="d-flex align-items-center">
                                            <div className="avatar-sm me-3">
                                                <div className="avatar-title rounded-circle bg-soft-primary text-primary font-size-20">
                                                    <i className="ri-user-3-line"></i>
                                                </div>
                                            </div>
                                            <div>
                                                <h5 className="card-title mb-1">مدیریت مشتریان</h5>
                                                <p className="text-muted mb-0">
                                                    مشاهده، ویرایش و حذف مشتریان
                                                </p>
                                            </div>
                                        </div>

                                        <div className="d-flex flex-wrap gap-2">
                                            <Button
                                                color="light"
                                                className="btn-label"
                                                onClick={loadCustomers}
                                                disabled={loading}
                                            >
                                                <i className="bx bx-refresh label-icon"></i>
                                                بروزرسانی
                                            </Button>

                                            <Link
                                                to="/customers/add"
                                                className="btn btn-success btn-label"
                                            >
                                                <i className="bx bx-plus-circle label-icon"></i>
                                                افزودن مشتری
                                            </Link>
                                        </div>
                                    </div>

                                    {/* Alerts */}
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

                                    {/* Search */}
                                    {!loading && customers.length > 0 && (
                                        <Row className="mb-3">
                                            <Col md={6}>
                                                <div className="search-box">
                                                    <div className="position-relative">
                                                        <Input
                                                            type="text"
                                                            className="form-control"
                                                            placeholder="جستجو نام، موبایل، کد ملی..."
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
                                                    تعداد کل: <strong>{customers.length}</strong>
                                                    {searchTerm && (
                                                        <>
                                                            {" "} | نتایج:{" "}
                                                            <strong>{filteredCustomers.length}</strong>
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
                                    ) : filteredCustomers.length === 0 ? (
                                        <div className="text-center py-5">
                                            <h5 className="text-muted">نتیجه‌ای یافت نشد</h5>
                                            <Button color="light" onClick={() => setSearchTerm("")}>
                                                پاک کردن جستجو
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="table-responsive">
                                            <Table className="table table-hover table-nowrap align-middle mb-0">
                                                <thead className="table-light">
                                                <tr>
                                                    <th style={{ width: 60 }}>#</th>
                                                    <th>نام</th>
                                                    <th>نوع</th>
                                                    <th>موبایل</th>
                                                    <th>کد ملی / شناسه</th>
                                                    <th className="text-center" style={{ width: 120 }}>
                                                        عملیات
                                                    </th>
                                                </tr>
                                                </thead>

                                                <tbody>
                                                {filteredCustomers.map((c, index) => (
                                                    <tr key={c.id}>

                                                        {/* index */}
                                                        <td>
                                                            <div className="avatar-xs">
                                                                <span className="avatar-title rounded-circle bg-soft-primary text-primary">
                                                                    {index + 1}
                                                                </span>
                                                            </div>
                                                        </td>

                                                        {/* name */}
                                                        <td>
                                                            <strong>{c.name}</strong>
                                                            <div className="text-muted small">
                                                                {c.address ? (
                                                                    c.address.length > 40
                                                                        ? c.address.slice(0, 40) + "..."
                                                                        : c.address
                                                                ) : "-"}
                                                            </div>
                                                        </td>

                                                        {/* type */}
                                                        <td>
                                                            {c.customer_type === "real" || c.customer_type === "person" ? (
                                                                <Badge color="info" className="badge-soft-info">
                                                                    حقیقی
                                                                </Badge>
                                                            ) : (
                                                                <Badge color="warning" className="badge-soft-warning">
                                                                    حقوقی
                                                                </Badge>
                                                            )}
                                                        </td>

                                                        {/* mobile */}
                                                        <td>{c.mobile || "-"}</td>

                                                        {/* national id */}
                                                        <td>{c.national_id || "-"}</td>

                                                        {/* actions */}
                                                        <td className="text-center">
                                                            <div className="d-flex gap-2 justify-content-center">
                                                                <Link
                                                                    to={`/customers/edit/${c.id}`}
                                                                    className="btn btn-sm btn-soft-primary"
                                                                >
                                                                    <i className="bx bx-edit-alt"></i>
                                                                </Link>

                                                                <Button
                                                                    size="sm"
                                                                    color="soft-danger"
                                                                    onClick={() => handleDelete(c.id, c.name)}
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

export default CustomerList;
