import React, { useEffect, useState } from "react";
import { Container, Row, Col, Card, CardBody, Table, Badge, Button, Nav, NavItem, NavLink } from "reactstrap";
import { Link } from "react-router-dom";
import { getAllLoadingOrders } from "../../services/loadingService"; // مسیر را چک کنید
import classnames from "classnames";

export default function LoadingList() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("1"); // 1: فعال (منتظر خروج), 2: بایگانی (خارج شده)

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const data = await getAllLoadingOrders();
            setOrders(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // فیلتر کردن بر اساس تب انتخاب شده
    const filteredOrders = orders.filter(o => {
        if (activeTab === "1") return !o.is_exited; // فقط آنهایی که خارج نشده‌اند
        if (activeTab === "2") return o.is_exited;  // فقط خارج شده‌ها
        return true;
    });

    return (
        <div className="page-content">
            <Container fluid>
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h4 className="font-size-18">لیست دستورهای بارگیری</h4>
                    <Link to="/loading/create" className="btn btn-primary btn-rounded shadow-sm">
                        <i className="bx bx-plus me-1"></i> صدور دستور جدید
                    </Link>
                </div>

                <Card>
                    <CardBody>
                        {/* تب‌بندی وضعیت */}
                        <Nav tabs className="nav-tabs-custom mb-4">
                            <NavItem>
                                <NavLink
                                    style={{ cursor: "pointer" }}
                                    className={classnames({ active: activeTab === "1" })}
                                    onClick={() => setActiveTab("1")}
                                >
                                    <span className="d-block d-sm-none"><i className="fas fa-truck"></i></span>
                                    <span className="d-none d-sm-block">منتظر خروج (فعال)</span>
                                </NavLink>
                            </NavItem>
                            <NavItem>
                                <NavLink
                                    style={{ cursor: "pointer" }}
                                    className={classnames({ active: activeTab === "2" })}
                                    onClick={() => setActiveTab("2")}
                                >
                                    <span className="d-block d-sm-none"><i className="fas fa-check-circle"></i></span>
                                    <span className="d-none d-sm-block">خارج شده (بایگانی)</span>
                                </NavLink>
                            </NavItem>
                        </Nav>

                        <div className="table-responsive">
                            <Table className="table align-middle table-nowrap table-hover">
                                <thead className="table-light">
                                <tr>
                                    <th>شماره دستور</th>
                                    <th>تاریخ</th>
                                    <th>راننده / پلاک</th>
                                    <th>صاحب کالا</th>
                                    <th className="text-center">اقلام</th>
                                    <th className="text-center">وزن کل (kg)</th>
                                    <th>وضعیت</th>
                                    <th>عملیات</th>
                                </tr>
                                </thead>
                                <tbody>
                                {loading ? (
                                    <tr><td colSpan={8} className="text-center py-4">در حال بارگذاری...</td></tr>
                                ) : filteredOrders.length === 0 ? (
                                    <tr><td colSpan={8} className="text-center py-4 text-muted">موردی یافت نشد.</td></tr>
                                ) : (
                                    filteredOrders.map((order) => (
                                        <tr key={order.id}>
                                            <td><span className="badge badge-soft-dark font-size-12">{order.order_no}</span></td>
                                            <td>{new Date(order.loading_date).toLocaleDateString('fa-IR')}</td>
                                            <td>
                                                <div className="fw-bold">{order.driver_name}</div>
                                                <small className="text-muted" dir="ltr">{order.plate_number}</small>
                                            </td>
                                            <td>{order.customer_name}</td>
                                            <td className="text-center">{order.items_count}</td>
                                            <td className="text-center">{Number(order.total_weight).toLocaleString()}</td>
                                            <td>
                                                {order.is_exited ? (
                                                    <Badge color="success" className="p-2">
                                                        <i className="bx bx-check-double me-1"></i>
                                                        خروج شده (سند {order.exit_permit_no})
                                                    </Badge>
                                                ) : (
                                                    <Badge color="warning" className="p-2 text-dark">
                                                        <i className="bx bx-time-five me-1"></i>
                                                        در حال بارگیری
                                                    </Badge>
                                                )}
                                            </td>
                                            <td>
                                                <Link to={`/loading/print/${order.id}`} className="btn btn-sm btn-soft-info me-2" title="چاپ">
                                                    <i className="bx bx-printer font-size-16"></i>
                                                </Link>

                                                {/* اگر هنوز خارج نشده، دکمه ثبت خروج را نشان بده */}
                                                {!order.is_exited && (
                                                    <Link to={`/exit/create?orderNo=${order.order_no}`} className="btn btn-sm btn-primary">
                                                        <i className="bx bx-door-open me-1"></i> ثبت خروج
                                                    </Link>
                                                )}
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