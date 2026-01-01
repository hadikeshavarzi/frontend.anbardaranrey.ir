import React, { useEffect, useState } from "react";
import {
    Container,
    Row,
    Col,
    Card,
    CardBody,
    Button,
    Table,
    Spinner,
    Alert,
    Input,
    InputGroup,
    InputGroupText,
    Badge // اگر از Badge استفاده نکنیم می‌توانیم حذفش کنیم، اما برای نقش‌ها هنوز لازم است
} from "reactstrap";
import { Link } from "react-router-dom";
import { supabase } from "../../helpers/supabase";

const MemberList = () => {
    // 🔹 State ها
    const [members, setMembers] = useState([]);
    const [filteredMembers, setFilteredMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // 🔹 فیلترها
    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");

    // 🔹 دریافت لیست اعضا
    const fetchMembers = async () => {
        setLoading(true);
        setError("");
        try {
            const { data, error } = await supabase
                .from("members")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;

            const dataList = data || [];
            setMembers(dataList);
            setFilteredMembers(dataList);

        } catch (err) {
            console.error(err);
            setError("خطا در دریافت لیست اعضا: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMembers();
    }, []);

    // 🔹 لاجیک فیلتر و جستجو
    useEffect(() => {
        let result = members;

        if (roleFilter !== "all") {
            result = result.filter((m) => m.role === roleFilter);
        }

        if (searchTerm.trim() !== "") {
            const lowerTerm = searchTerm.toLowerCase();
            result = result.filter((m) =>
                (m.full_name && m.full_name.toLowerCase().includes(lowerTerm)) ||
                (m.mobile && m.mobile.includes(lowerTerm)) ||
                (m.member_code && m.member_code.includes(lowerTerm)) ||
                (m.national_id && m.national_id.includes(lowerTerm)) ||
                (m.business_name && m.business_name.toLowerCase().includes(lowerTerm))
            );
        }

        setFilteredMembers(result);
    }, [searchTerm, roleFilter, members]);


    // 🔹 حذف عضو
    const handleDelete = async (id, name) => {
        if (!window.confirm(`آیا از حذف عضو "${name}" مطمئن هستید؟`)) return;

        try {
            const { error } = await supabase
                .from("members")
                .delete()
                .eq("id", id);

            if (error) throw error;

            const newList = members.filter((m) => m.id !== id);
            setMembers(newList);

        } catch (err) {
            alert("خطا در حذف: " + err.message);
        }
    };

    // ✅ اصلاح تابع وضعیت (رنگ‌ها به صورت دستی تنظیم شدند تا خوانا باشند)
    const renderStatus = (status) => {
        const styles = {
            active: {
                bg: "rgba(52, 195, 143, 0.18)", // سبز کمرنگ
                color: "#34c38f",               // سبز پررنگ
                label: "فعال"
            },
            inactive: {
                bg: "rgba(244, 106, 106, 0.18)", // قرمز کمرنگ
                color: "#f46a6a",                // قرمز پررنگ
                label: "غیرفعال"
            },
            pending: {
                bg: "rgba(241, 180, 76, 0.18)",  // زرد کمرنگ
                color: "#f1b44c",                // زرد پررنگ
                label: "در حال بررسی"
            },
            suspended: {
                bg: "rgba(80, 80, 80, 0.18)",    // خاکستری کمرنگ
                color: "#505050",                // خاکستری پررنگ
                label: "معلق"
            },
        };

        const current = styles[status] || { bg: "#eff2f7", color: "#74788d", label: status };

        return (
            <span
                className="badge rounded-pill font-size-12"
                style={{
                    backgroundColor: current.bg,
                    color: current.color,
                    padding: "5px 10px"
                }}
            >
            {current.label}
        </span>
        );
    };

    // 🔹 نمایش نقش
    const renderRole = (role) => {
        const map = {
            admin: { color: "danger", label: "مدیر کل" },
            employee: { color: "primary", label: "کارمند" },
            union_member: { color: "info", label: "عضو اتحادیه" },
            union_user: { color: "secondary", label: "کاربر عادی" },
            customer: { color: "success", label: "مشتری" },
        };
        const current = map[role] || { color: "light", label: role };
        // برای نقش‌ها از همان Badge استاندارد استفاده می‌کنیم چون معمولا سفید روی رنگی است و خواناست
        return <Badge color={current.color} className="font-size-12">{current.label}</Badge>;
    };

    return (
        <div className="page-content">
            <Container fluid>

                {/* === HEADER === */}
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-4">
                    <h4 className="font-size-18 mb-3 mb-md-0">لیست اعضا</h4>

                    <div className="d-flex gap-2">
                        <Button color="light" onClick={fetchMembers} title="بروزرسانی">
                            <i className={`bx bx-refresh font-size-18 ${loading ? 'bx-spin' : ''}`}></i>
                        </Button>
                        <Link to="/members/add" className="btn btn-success">
                            <i className="bx bx-plus me-1"></i> افزودن عضو جدید
                        </Link>
                    </div>
                </div>

                {error && <Alert color="danger" toggle={() => setError("")}>{error}</Alert>}

                <Row>
                    <Col lg={12}>
                        <Card>
                            <CardBody>

                                {/* === SEARCH & FILTER === */}
                                <Row className="mb-4 g-3">
                                    <Col md={4} sm={12}>
                                        <InputGroup>
                                            <InputGroupText className="bg-light border-end-0">
                                                <i className="bx bx-search-alt"></i>
                                            </InputGroupText>
                                            <Input
                                                type="text"
                                                className="border-start-0"
                                                placeholder="جستجو (نام، موبایل، کد ملی...)"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                        </InputGroup>
                                    </Col>
                                    <Col md={3} sm={6}>
                                        <Input
                                            type="select"
                                            value={roleFilter}
                                            onChange={(e) => setRoleFilter(e.target.value)}
                                        >
                                            <option value="all">همه نقش‌ها</option>
                                            <option value="admin">مدیر کل</option>
                                            <option value="employee">کارمند</option>
                                            <option value="union_member">عضو اتحادیه</option>
                                            <option value="union_user">کاربر عادی</option>
                                            <option value="customer">مشتری</option>
                                        </Input>
                                    </Col>
                                    <Col md={5} sm={6} className="d-flex align-items-center justify-content-md-end">
                        <span className="text-muted font-size-13">
                            نمایش <b>{filteredMembers.length}</b> از <b>{members.length}</b> عضو
                        </span>
                                    </Col>
                                </Row>

                                {/* === TABLE === */}
                                {loading ? (
                                    <div className="text-center py-5">
                                        <Spinner color="primary" />
                                        <p className="mt-2 text-muted">در حال بارگذاری...</p>
                                    </div>
                                ) : filteredMembers.length === 0 ? (
                                    <div className="text-center py-5">
                                        <div className="avatar-md mx-auto mb-3">
                        <span className="avatar-title rounded-circle bg-light text-secondary font-size-24">
                            <i className="bx bx-search"></i>
                        </span>
                                        </div>
                                        <h5>هیچ نتیجه‌ای یافت نشد!</h5>
                                        <p className="text-muted">لطفاً فیلترها را تغییر دهید یا عضو جدیدی اضافه کنید.</p>
                                    </div>
                                ) : (
                                    <div className="table-responsive">
                                        <Table className="table-hover align-middle table-nowrap mb-0">
                                            <thead className="table-light">
                                            <tr>
                                                <th>#</th>
                                                <th>مشخصات عضو</th>
                                                <th>کد عضویت</th>
                                                <th>تماس</th>
                                                <th>نقش</th>
                                                <th>وضعیت</th>
                                                <th className="text-center">عملیات</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {filteredMembers.map((member, index) => (
                                                <tr key={member.id}>
                                                    <td>{index + 1}</td>
                                                    <td>
                                                        <div className="d-flex align-items-center">
                                                            {member.member_image ? (
                                                                <img src={member.member_image} alt="" className="avatar-xs rounded-circle me-2 object-cover" />
                                                            ) : (
                                                                <div className="avatar-xs me-2">
                                            <span className="avatar-title rounded-circle bg-primary bg-soft text-primary font-size-12">
                                                {member.full_name ? member.full_name.charAt(0) : "U"}
                                            </span>
                                                                </div>
                                                            )}
                                                            <div>
                                                                <h5 className="font-size-14 mb-1">
                                                                    <Link to={`/members/edit/${member.id}`} className="text-dark">
                                                                        {member.full_name}
                                                                    </Link>
                                                                </h5>
                                                                {member.business_name && (
                                                                    <small className="text-muted d-block">{member.business_name}</small>
                                                                )}
                                                                {member.national_id && (
                                                                    <small className="text-muted">کد ملی: {member.national_id}</small>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className="fw-bold text-primary">{member.member_code}</span>
                                                    </td>
                                                    <td>
                                                        <div><i className="bx bx-mobile me-1 text-muted"></i>{member.mobile}</div>
                                                        {member.phone && (
                                                            <div className="font-size-11 text-muted"><i className="bx bx-phone me-1"></i>{member.phone}</div>
                                                        )}
                                                    </td>
                                                    <td>{renderRole(member.role)}</td>
                                                    <td>
                                                        {/* استفاده از تابع اصلاح شده */}
                                                        {renderStatus(member.member_status)}
                                                    </td>
                                                    <td className="text-center">
                                                        <div className="d-flex gap-2 justify-content-center">
                                                            <Link
                                                                to={`/members/edit/${member.id}`}
                                                                className="btn btn-sm btn-soft-primary"
                                                                title="ویرایش"
                                                            >
                                                                <i className="bx bx-edit-alt font-size-14"></i>
                                                            </Link>

                                                            <Button
                                                                size="sm"
                                                                color="soft-danger"
                                                                onClick={() => handleDelete(member.id, member.full_name)}
                                                                title="حذف"
                                                            >
                                                                <i className="bx bx-trash font-size-14"></i>
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
    );
};

export default MemberList;