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

const MemberList = () => {
    const [members, setMembers] = useState([]);
    const [filteredMembers, setFilteredMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [searchTerm, setSearchTerm] = useState("");

    const loadMembers = async () => {
        setLoading(true);
        setError("");


        try {
            const res = await get("/members"); // Payload returns {docs: [...]}
            const list = res?.docs || [];

            setMembers(list);
            setFilteredMembers(list);

        } catch (err) {
            setError("خطا در دریافت لیست اعضا");
        }

        setLoading(false);
    };

    useEffect(() => {
        loadMembers();
    }, []);

    // 🔍 جستجو
    useEffect(() => {
        if (searchTerm.trim() === "") {
            setFilteredMembers(members);
        } else {
            const filtered = members.filter((m) => {
                const name = (m.full_name || "").toLowerCase();
                const code = (m.member_code || "").toLowerCase();
                const mobile = (m.mobile || "").toLowerCase();
                const nid = (m.national_id || "").toLowerCase();

                return (
                    name.includes(searchTerm.toLowerCase()) ||
                    code.includes(searchTerm.toLowerCase()) ||
                    mobile.includes(searchTerm.toLowerCase()) ||
                    nid.includes(searchTerm.toLowerCase())
                );
            });

            setFilteredMembers(filtered);
        }
    }, [searchTerm, members]);

    // 🔥 حذف عضو
    const handleDelete = async (id, full_name) => {
        if (!window.confirm(`آیا از حذف "${full_name}" مطمئن هستید؟`)) return;


        try {
            await del(`/members/${id}`);

            setMembers((prev) => prev.filter((m) => m.id !== id));
            setFilteredMembers((prev) => prev.filter((m) => m.id !== id));

            setSuccess(`عضو "${full_name}" با موفقیت حذف شد`);
            setTimeout(() => setSuccess(""), 3000);
        } catch (err) {
            setError("خطا در حذف عضو");
        }
    };

    // 🎨 Badge وضعیت
    const getStatusBadge = (status) => {
        switch (status) {
            case "active":
                return <Badge color="success" className="badge-soft-success">فعال</Badge>;
            case "inactive":
                return <Badge color="secondary" className="badge-soft-secondary">غیرفعال</Badge>;
            case "pending":
                return <Badge color="warning" className="badge-soft-warning">در حال بررسی</Badge>;
            case "suspended":
                return <Badge color="danger" className="badge-soft-danger">تعلیق</Badge>;
            default:
                return <Badge color="light">ناشناخته</Badge>;
        }
    };

    // 📅 تاریخ شمسی
    const toPersianDate = (date) => {
        if (!date) return "-";
        try {
            return new Date(date).toLocaleDateString("fa-IR");
        } catch {
            return "-";
        }
    };

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    {/* Breadcrumb */}
                    <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                        <h4 className="mb-sm-0 font-size-18">لیست اعضا</h4>

                        <div className="page-title-right">
                            <ol className="breadcrumb m-0">
                                <li className="breadcrumb-item">
                                    <Link to="/dashboard">داشبورد</Link>
                                </li>
                                <li className="breadcrumb-item active">اعضا</li>
                            </ol>
                        </div>
                    </div>

                    <Row>
                        <Col lg={12}>
                            <Card>
                                <CardBody>
                                    {/* Header */}
                                    <div className="d-flex flex-wrap justify-content-between align-items-center mb-4">
                                        <div>
                                            <h4 className="card-title mb-1">مدیریت اعضا</h4>
                                            <p className="card-title-desc mb-0">
                                                مشاهده، جستجو، و مدیریت اعضای اتحادیه
                                            </p>
                                        </div>

                                        <div className="d-flex gap-2">
                                            <Button
                                                color="light"
                                                onClick={loadMembers}
                                                disabled={loading}
                                            >
                                                <i className="bx bx-refresh me-1" />
                                                بروزرسانی
                                            </Button>

                                            <Link to="/members/add" className="btn btn-success">
                                                <i className="bx bx-plus-circle me-1" />
                                                افزودن عضو جدید
                                            </Link>
                                        </div>
                                    </div>

                                    {/* Alerts */}
                                    {error && (
                                        <Alert color="danger" className="alert-dismissible fade show">
                                            {error}
                                            <button type="button" className="btn-close" onClick={() => setError("")}></button>
                                        </Alert>
                                    )}

                                    {success && (
                                        <Alert color="success" className="alert-dismissible fade show">
                                            {success}
                                            <button type="button" className="btn-close" onClick={() => setSuccess("")}></button>
                                        </Alert>
                                    )}

                                    {/* Search */}
                                    {!loading && members.length > 0 && (
                                        <Row className="mb-3">
                                            <Col md={6}>
                                                <div className="search-box">
                                                    <div className="position-relative">
                                                        <Input
                                                            type="text"
                                                            className="form-control"
                                                            placeholder="جستجو بر اساس نام، موبایل یا کد عضویت..."
                                                            value={searchTerm}
                                                            onChange={(e) => setSearchTerm(e.target.value)}
                                                        />
                                                        <i className="bx bx-search-alt search-icon"></i>
                                                    </div>
                                                </div>
                                            </Col>

                                            <Col md={6} className="text-end">
                                                <div className="text-muted">
                                                    تعداد کل: <strong>{members.length}</strong>
                                                    {searchTerm && (
                                                        <>
                                                            {" "} | نتایج: <strong>{filteredMembers.length}</strong>
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
                                            <h5 className="text-muted mt-3">در حال بارگذاری...</h5>
                                        </div>
                                    ) : members.length === 0 ? (
                                        <div className="text-center py-5">
                                            <h5 className="text-muted">هیچ عضوی ثبت نشده است</h5>
                                            <Link to="/members/add" className="btn btn-success mt-2">
                                                افزودن اولین عضو
                                            </Link>
                                        </div>
                                    ) : filteredMembers.length === 0 ? (
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
                                                    <th style={{ width: "55px" }}>#</th>
                                                    <th>نام</th>
                                                    <th>کد عضویت</th>
                                                    <th>موبایل</th>
                                                    <th>کد ملی</th>
                                                    <th>وضعیت</th>
                                                    <th>تاریخ انقضا</th>
                                                    <th style={{ width: "150px" }}>عملیات</th>
                                                </tr>
                                                </thead>

                                                <tbody>
                                                {filteredMembers.map((member, index) => (
                                                    <tr key={member.id}>
                                                        <td>
                                                            <div className="avatar-xs">
                                                                    <span className="avatar-title rounded-circle bg-soft-primary text-primary">
                                                                        {index + 1}
                                                                    </span>
                                                            </div>
                                                        </td>

                                                        <td>
                                                            <strong>{member.full_name}</strong>
                                                            <br />
                                                            <small className="text-muted">
                                                                {member.category}
                                                            </small>
                                                        </td>

                                                        <td>
                                                            <Badge color="info" className="badge-soft-info" pill>
                                                                {member.member_code}
                                                            </Badge>
                                                        </td>

                                                        <td>{member.mobile}</td>

                                                        <td>{member.national_id || "-"}</td>

                                                        <td>{getStatusBadge(member.member_status)}</td>

                                                        <td>{toPersianDate(member.license_expire_date)}</td>

                                                        <td>
                                                            <div className="d-flex gap-2">
                                                                <Link
                                                                    to={`/members/edit/${member.id}`}
                                                                    className="btn btn-sm btn-soft-primary"
                                                                >
                                                                    <i className="bx bx-edit"></i>
                                                                </Link>

                                                                <Button
                                                                    color="soft-danger"
                                                                    size="sm"
                                                                    onClick={() =>
                                                                        handleDelete(member.id, member.full_name)
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

export default MemberList;
