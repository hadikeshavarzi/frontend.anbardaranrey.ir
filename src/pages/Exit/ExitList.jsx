import React, { useEffect, useState } from "react";
import {
    Container, Card, CardBody, Row, Col, Table, Button, Input, Badge, UncontrolledTooltip
} from "reactstrap";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { getExitsList, deleteExit } from "../../services/exitService";

export default function ExitList() {
    const navigate = useNavigate();
    const [data, setData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // بارگیری اولیه
    const fetchData = async () => {
        setLoading(true);
        try {
            const result = await getExitsList();
            setData(result);
            setFilteredData(result);
        } catch (err) {
            toast.error("خطا در دریافت لیست خروج‌ها");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // لاجیک جستجو (اصلاح شده)
    useEffect(() => {
        if (!searchTerm) {
            setFilteredData(data);
        } else {
            const lowerTerm = searchTerm.toLowerCase();
            const filtered = data.filter(item => {
                // دریافت نام راننده و پلاک از هر جایی که موجود است
                const driver = item.driver_name || item.loading_orders?.driver_name || "";
                const plate = item.plate_number || item.loading_orders?.plate_number || "";
                // ✅ اصلاح مهم: دریافت نام مشتری از ارتباط مستقیم
                const customer = item.customers?.name || "";

                return (
                    String(item.id).includes(lowerTerm) ||
                    String(item.exit_no || "").includes(lowerTerm) ||
                    driver.includes(searchTerm) ||
                    plate.includes(searchTerm) ||
                    customer.includes(searchTerm)
                );
            });
            setFilteredData(filtered);
        }
    }, [searchTerm, data]);

    // هندلر حذف
    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'آیا مطمئن هستید؟',
            text: "این سند و تمام اقلام آن حذف خواهند شد!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'بله، حذف کن',
            cancelButtonText: 'انصراف'
        });

        if (result.isConfirmed) {
            try {
                await deleteExit(id);
                toast.success("سند با موفقیت حذف شد.");
                fetchData(); // رفرش لیست
            } catch (err) {
                toast.error("خطا در حذف سند.");
            }
        }
    };

    // هندلر پرینت (باز کردن در تب جدید)
    const handlePrint = (id) => {
        window.open(`/exit/print/${id}`, '_blank');
    };

    // محاسبه مبلغ کل هر ردیف
    const calculateTotal = (item) => {
        return (item.total_fee || 0) +
            (item.total_loading_fee || 0) +
            (item.weighbridge_fee || 0) +
            (item.extra_fee || 0) +
            (item.vat_fee || 0);
    };

    return (
        <div className="page-content">
            <Container fluid>
                {/* --- Header --- */}
                <Row className="mb-3">
                    <Col sm={6}>
                        <h4 className="font-size-18 fw-bold">لیست اسناد خروج و باسکول</h4>
                    </Col>
                    <Col sm={6} className="text-sm-end">
                        <Link to="/exit/create" className="btn btn-primary">
                            <i className="bx bx-plus me-1"></i> ثبت خروج جدید
                        </Link>
                    </Col>
                </Row>

                {/* --- Filter & Search --- */}
                <Card>
                    <CardBody>
                        <Row className="g-3">
                            <Col md={4}>
                                <div className="search-box position-relative">
                                    <Input
                                        type="text"
                                        className="form-control rounded-pill ps-5"
                                        placeholder="جستجو (راننده، پلاک، مشتری...)"
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                    />
                                    <i className="bx bx-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted font-size-16"></i>
                                </div>
                            </Col>
                            <Col md={8} className="text-end">
                                <Button color="light" onClick={fetchData} title="بروزرسانی">
                                    <i className={`bx bx-refresh font-size-20 ${loading ? 'bx-spin' : ''}`}></i>
                                </Button>
                            </Col>
                        </Row>
                    </CardBody>
                </Card>

                {/* --- Table --- */}
                <Card>
                    <CardBody>
                        <div className="table-responsive">
                            <Table className="table align-middle table-nowrap table-hover mb-0">
                                <thead className="table-light">
                                <tr>
                                    <th>شناسه</th>
                                    <th>وضعیت</th>
                                    <th>تاریخ</th>
                                    <th>راننده / پلاک</th>
                                    <th>صاحب کالا</th>
                                    <th>مبلغ کل (ریال)</th>
                                    <th className="text-center">عملیات</th>
                                </tr>
                                </thead>
                                <tbody>
                                {loading ? (
                                    <tr><td colSpan="7" className="text-center p-4">در حال بارگذاری...</td></tr>
                                ) : filteredData.length === 0 ? (
                                    <tr><td colSpan="7" className="text-center p-4 text-muted">سندی یافت نشد.</td></tr>
                                ) : (
                                    filteredData.map((item) => (
                                        <tr key={item.id}>
                                            <td className="fw-bold text-primary">#{item.id}</td>
                                            <td>
                                                <Badge
                                                    color={item.status === 'final' ? 'success' : 'warning'}
                                                    className="font-size-12 px-2 py-1"
                                                >
                                                    {item.status === 'final' ? 'نهایی' : 'پیش‌نویس'}
                                                </Badge>
                                            </td>
                                            <td>{new Date(item.exit_date).toLocaleDateString('fa-IR')}</td>
                                            <td>
                                                {/* نمایش راننده و پلاک (اولویت با دیتای ذخیره شده در خروج) */}
                                                <h5 className="font-size-13 mb-1">
                                                    {item.driver_name || item.loading_orders?.driver_name || "---"}
                                                </h5>
                                                <p className="text-muted mb-0 font-size-12" dir="ltr">
                                                    {item.plate_number || item.loading_orders?.plate_number || "---"}
                                                </p>
                                            </td>

                                            {/* ✅ اصلاح نام مشتری: خواندن مستقیم از ریلیشن customers */}
                                            <td>{item.customers?.name || "---"}</td>

                                            <td className="fw-bold text-secondary">
                                                {calculateTotal(item).toLocaleString()}
                                            </td>
                                            <td className="text-center">
                                                <div className="d-flex justify-content-center gap-2">
                                                    {/* دکمه ویرایش/مشاهده */}
                                                    <Button
                                                        color="soft-info"
                                                        size="sm"
                                                        className="btn-rounded"
                                                        // برای ویرایش، شماره بارگیری را پاس میدهیم
                                                        onClick={() => navigate(`/exit/create?orderNo=${item.loading_orders?.order_no || item.id}`)}
                                                        id={`edit-${item.id}`}
                                                    >
                                                        <i className={`bx ${item.status === 'final' ? 'bx-show' : 'bx-edit'} font-size-16`}></i>
                                                    </Button>
                                                    <UncontrolledTooltip target={`edit-${item.id}`}>
                                                        {item.status === 'final' ? 'مشاهده جزئیات' : 'ویرایش پیش‌نویس'}
                                                    </UncontrolledTooltip>

                                                    {/* دکمه پرینت */}
                                                    <Button
                                                        color="soft-primary"
                                                        size="sm"
                                                        className="btn-rounded"
                                                        onClick={() => handlePrint(item.id)}
                                                        id={`print-${item.id}`}
                                                    >
                                                        <i className="bx bx-printer font-size-16"></i>
                                                    </Button>
                                                    <UncontrolledTooltip target={`print-${item.id}`}>چاپ فاکتور</UncontrolledTooltip>

                                                    {/* دکمه حذف */}
                                                    <Button
                                                        color="soft-danger"
                                                        size="sm"
                                                        className="btn-rounded"
                                                        onClick={() => handleDelete(item.id)}
                                                        id={`del-${item.id}`}
                                                    >
                                                        <i className="bx bx-trash font-size-16"></i>
                                                    </Button>
                                                    <UncontrolledTooltip target={`del-${item.id}`}>حذف سند</UncontrolledTooltip>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                                </tbody>
                            </Table>
                        </div>
                    </CardBody>
                </Card>
            </Container>
        </div>
    );
}