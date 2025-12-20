import React, { useEffect, useState } from "react";
import {
    Container, Card, CardBody, Table, Button, Row, Col,
    Input, UncontrolledTooltip
} from "reactstrap";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";
import { getClearanceReport, deleteClearance } from "../../services/clearanceService";

export default function ClearanceReport() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    // استیت فیلترها
    const [filters, setFilters] = useState({
        customer: "",
        product: "",
        clearanceNo: "",
        batchNo: "",
        status: ""
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const result = await getClearanceReport(filters);
            setData(result);
        } catch (err) {
            toast.error("خطا در دریافت گزارش");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchData();
        }, 800);
        return () => clearTimeout(delayDebounceFn);
    }, [filters]);

    const handleDelete = async (id) => {
        if(!window.confirm("آیا از حذف این سند مطمئن هستید؟\n(موجودی کالا به انبار بازگردانده می‌شود)")) return;
        try {
            await deleteClearance(id);
            toast.success("سند با موفقیت حذف شد");
            fetchData();
        } catch (err) {
            toast.error(err.message || "خطا در حذف سند");
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const toPersianDate = (date) => date ? new Date(date).toLocaleDateString('fa-IR') : '-';

    // تابع برای استایل وضعیت
    const getStatusBadge = (status) => {
        if (status === 'آماده بارگیری') return "badge badge-soft-success font-size-12 p-2";
        if (status === 'دستور بارگیری صادر شده') return "badge badge-soft-warning font-size-12 p-2";
        return "badge badge-soft-secondary font-size-12 p-2";
    };

    return (
        <div className="page-content" style={{fontFamily:'inherit'}}>
            <Container fluid>

                {/* هدر صفحه */}
                <Row>
                    <Col xs={12}>
                        <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                            <h4 className="mb-sm-0 font-size-18">لیست اسناد خروج کالا</h4>
                            <div className="page-title-right">
                                <Link to="/clearances/form">
                                    <Button color="success" className="waves-effect waves-light shadow-sm">
                                        <i className="bx bx-plus font-size-16 align-middle me-2"></i> ثبت سند جدید
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </Col>
                </Row>

                <Row>
                    <Col xs={12}>
                        <Card>
                            <CardBody>
                                {/* فیلترها */}
                                <div className="bg-light p-3 rounded mb-4 border">
                                    <Row className="g-3 align-items-end">
                                        <Col lg={2} md={4}>
                                            <label className="font-size-12 text-muted mb-1">صاحب کالا</label>
                                            <Input bsSize="sm" className="form-control" placeholder="جستجو..." name="customer" value={filters.customer} onChange={handleFilterChange} />
                                        </Col>
                                        <Col lg={2} md={4}>
                                            <label className="font-size-12 text-muted mb-1">نام کالا</label>
                                            <Input bsSize="sm" className="form-control" placeholder="جستجو..." name="product" value={filters.product} onChange={handleFilterChange} />
                                        </Col>
                                        <Col lg={2} md={4}>
                                            <label className="font-size-12 text-muted mb-1">شماره سند</label>
                                            <Input bsSize="sm" className="form-control" placeholder="مثلا 1001" name="clearanceNo" value={filters.clearanceNo} onChange={handleFilterChange} />
                                        </Col>
                                        <Col lg={2} md={4}>
                                            <label className="font-size-12 text-muted mb-1">شماره ردیف</label>
                                            <Input bsSize="sm" className="form-control" placeholder="مثلا 110/14" name="batchNo" value={filters.batchNo} onChange={handleFilterChange} />
                                        </Col>
                                        <Col lg={2} md={4}>
                                            <label className="font-size-12 text-muted mb-1">وضعیت</label>
                                            <Input bsSize="sm" type="select" className="form-select" name="status" value={filters.status} onChange={handleFilterChange}>
                                                <option value="">همه</option>
                                                <option value="آماده بارگیری">آماده بارگیری</option>
                                                <option value="دستور بارگیری صادر شده">بارگیری شده</option>
                                            </Input>
                                        </Col>
                                        <Col lg={2} md={4}>
                                            <Button color="danger" outline block onClick={() => setFilters({customer:"", product:"", clearanceNo:"", batchNo:"", status:""})}>
                                                پاکسازی
                                            </Button>
                                        </Col>
                                    </Row>
                                </div>

                                {/* جدول داده‌ها */}
                                <div className="table-responsive">
                                    <Table className="table align-middle table-nowrap table-hover mb-0">
                                        <thead className="table-light">
                                        <tr>
                                            <th style={{width: '50px'}}>#</th>
                                            <th>شماره سند</th>
                                            <th>تاریخ</th>
                                            <th>صاحب کالا</th>
                                            <th>نام کالا</th>
                                            <th>شماره ردیف</th>
                                            <th>تعداد</th>
                                            <th>وزن (kg)</th>
                                            <th>وضعیت</th>
                                            <th className="text-end">عملیات</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {loading ? (
                                            <tr><td colSpan={10} className="text-center py-5"><div className="spinner-border text-primary m-1"></div></td></tr>
                                        ) : data.length === 0 ? (
                                            <tr><td colSpan={10} className="text-center py-5 text-muted">رکوردی یافت نشد</td></tr>
                                        ) : (
                                            data.map((row, idx) => (
                                                <tr key={row.item_id}>
                                                    <td>{idx + 1}</td>
                                                    <td className="fw-bold">{row.clearance_no}</td>
                                                    <td>{toPersianDate(row.clearance_date)}</td>
                                                    <td>
                                                        <span className="text-primary fw-medium">{row.customer_name}</span>
                                                    </td>
                                                    <td>
                                                        {row.product_name}
                                                    </td>
                                                    <td>
                                                        {(row.batch_no && row.batch_no !== 'بدون ردیف') ? (
                                                            <span className="badge badge-soft-info font-size-12 font-monospace">{row.batch_no}</span>
                                                        ) : (
                                                            <span className="text-muted small">---</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <span className="fw-bold">{Number(row.qty).toLocaleString()}</span>
                                                    </td>
                                                    <td>
                                                        {Number(row.weight).toLocaleString()}
                                                    </td>
                                                    <td>
                                                            <span className={getStatusBadge(row.operational_status)}>
                                                                {row.operational_status}
                                                            </span>
                                                    </td>
                                                    <td className="text-end">
                                                        <div className="d-flex justify-content-end gap-2">
                                                            {row.operational_status === 'آماده بارگیری' ? (
                                                                <>
                                                                    <Link to={`/clearances/edit/${row.clearance_id}`}>
                                                                        <Button color="primary" outline size="sm" id={`edit-${row.item_id}`}>
                                                                            <i className="bx bx-pencil"></i>
                                                                        </Button>
                                                                        <UncontrolledTooltip placement="top" target={`edit-${row.item_id}`}>
                                                                            ویرایش
                                                                        </UncontrolledTooltip>
                                                                    </Link>

                                                                    <Button color="danger" outline size="sm" id={`del-${row.item_id}`} onClick={() => handleDelete(row.clearance_id)}>
                                                                        <i className="bx bx-trash"></i>
                                                                    </Button>
                                                                    <UncontrolledTooltip placement="top" target={`del-${row.item_id}`}>
                                                                        حذف
                                                                    </UncontrolledTooltip>
                                                                </>
                                                            ) : (
                                                                <Button color="secondary" outline size="sm" disabled>
                                                                    <i className="bx bx-lock-alt"></i>
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                        </tbody>
                                    </Table>
                                </div>
                                <Row className="mt-3">
                                    <Col className="text-muted font-size-12">
                                        تعداد کل رکوردها: {data.length}
                                    </Col>
                                </Row>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </div>
    );
}