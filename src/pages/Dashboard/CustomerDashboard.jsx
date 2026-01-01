import React, { useEffect, useState } from "react";
import { Container, Row, Col, Card, CardBody, CardTitle, Spinner, Table, Badge } from "reactstrap";
import { supabase } from "../../helpers/supabase";
import { formatNumber, toPersianDate } from "../../helpers/utils";

const CustomerDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        activeRentals: 0,
        totalInventory: 0,
        balance: 0, // مانده حساب
        lastTransactions: []
    });
    const [rentals, setRentals] = useState([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // ۱. دریافت قراردادهای فعال (RLS خودکار فیلتر می‌کند)
            const { data: rentalData, error: rentalError } = await supabase
                .from('warehouse_rentals')
                .select('*')
                .eq('status', 'active');

            // ۲. دریافت مانده حساب (از جدول اسناد مالی)
            // تمام بدهکارها و بستانکارهای من را می‌گیرد
            const { data: financialData, error: finError } = await supabase
                .from('financial_entries')
                .select('bed, bes, created_at, description')
                .order('created_at', { ascending: false });

            // ۳. محاسبه مانده
            let totalBed = 0;
            let totalBes = 0;
            if (financialData) {
                financialData.forEach(row => {
                    totalBed += Number(row.bed || 0);
                    totalBes += Number(row.bes || 0);
                });
            }
            const currentBalance = totalBes - totalBed; // اگر مثبت باشد یعنی بستانکار است (پول داده)، اگر منفی یعنی بدهکار

            // ۴. ذخیره در State
            setStats({
                activeRentals: rentalData?.length || 0,
                totalInventory: 0, // اینجا می‌توانید کوئری رسید انبار را اضافه کنید
                balance: currentBalance,
                lastTransactions: financialData?.slice(0, 5) || [] // ۵ تراکنش آخر
            });
            setRentals(rentalData || []);

        } catch (error) {
            console.error("Error fetching dashboard data:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="text-center p-5"><Spinner color="primary" /></div>;
    }

    return (
        <div className="page-content">
            <Container fluid>
                {/*  */}
                <h4 className="fw-bold font-size-18 mb-4">داشبورد کاربری من</h4>

                {/* کارت‌های آمار */}
                <Row>
                    <Col md={4}>
                        <Card className="mini-stats-wid">
                            <CardBody>
                                <div className="d-flex">
                                    <div className="flex-grow-1">
                                        <p className="text-muted fw-medium">قراردادهای فعال</p>
                                        <h4 className="mb-0">{stats.activeRentals} مورد</h4>
                                    </div>
                                    <div className="flex-shrink-0 align-self-center">
                                        <div className="avatar-sm rounded-circle bg-primary mini-stat-icon">
                                            <span className="avatar-title rounded-circle bg-primary">
                                                <i className="bx bx-building-house font-size-24"></i>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    </Col>

                    <Col md={4}>
                        <Card className="mini-stats-wid">
                            <CardBody>
                                <div className="d-flex">
                                    <div className="flex-grow-1">
                                        <p className="text-muted fw-medium">وضعیت مالی</p>
                                        <h4 className={`mb-0 ${stats.balance < 0 ? 'text-danger' : 'text-success'}`} dir="ltr">
                                            {formatNumber(Math.abs(stats.balance))} {stats.balance < 0 ? 'بدهکار' : 'ریال'}
                                        </h4>
                                    </div>
                                    <div className="flex-shrink-0 align-self-center">
                                        <div className={`avatar-sm rounded-circle ${stats.balance < 0 ? 'bg-danger' : 'bg-success'} mini-stat-icon`}>
                                            <span className={`avatar-title rounded-circle ${stats.balance < 0 ? 'bg-danger' : 'bg-success'}`}>
                                                <i className="bx bx-wallet font-size-24"></i>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    </Col>

                    <Col md={4}>
                        <Card className="mini-stats-wid">
                            <CardBody>
                                <div className="d-flex">
                                    <div className="flex-grow-1">
                                        <p className="text-muted fw-medium">پیام‌های سیستم</p>
                                        <h4 className="mb-0">۰ پیام جدید</h4>
                                    </div>
                                    <div className="flex-shrink-0 align-self-center">
                                        <div className="avatar-sm rounded-circle bg-warning mini-stat-icon">
                                            <span className="avatar-title rounded-circle bg-warning">
                                                <i className="bx bx-bell font-size-24"></i>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>

                <Row>
                    {/* جدول قراردادهای فعال */}
                    <Col lg={6}>
                        <Card>
                            <CardBody>
                                <CardTitle className="mb-4 h5">قراردادهای فعال من</CardTitle>
                                <div className="table-responsive">
                                    <Table className="table-nowrap align-middle mb-0">
                                        <thead className="table-light">
                                        <tr>
                                            <th>محل اجاره</th>
                                            <th>شروع</th>
                                            <th>مبلغ (ریال)</th>
                                            <th>وضعیت</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {rentals.length > 0 ? rentals.map((item, idx) => (
                                            <tr key={idx}>
                                                <td>{item.location_name}</td>
                                                <td>{toPersianDate(item.start_date)}</td>
                                                <td>{formatNumber(item.monthly_rent)}</td>
                                                <td><Badge color="success">فعال</Badge></td>
                                            </tr>
                                        )) : (
                                            <tr><td colSpan="4" className="text-center">هیچ قرارداد فعالی یافت نشد</td></tr>
                                        )}
                                        </tbody>
                                    </Table>
                                </div>
                            </CardBody>
                        </Card>
                    </Col>

                    {/* جدول آخرین تراکنش‌های مالی */}
                    <Col lg={6}>
                        <Card>
                            <CardBody>
                                <CardTitle className="mb-4 h5">آخرین گردش‌های مالی</CardTitle>
                                <div className="table-responsive">
                                    <Table className="table-nowrap align-middle mb-0">
                                        <thead className="table-light">
                                        <tr>
                                            <th>تاریخ</th>
                                            <th>شرح</th>
                                            <th>مبلغ (ریال)</th>
                                            <th>نوع</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {stats.lastTransactions.map((tx, idx) => {
                                            const amount = Number(tx.bed) > 0 ? tx.bed : tx.bes;
                                            const type = Number(tx.bed) > 0 ? 'بدهکار' : 'بستانکار';
                                            return (
                                                <tr key={idx}>
                                                    <td>{toPersianDate(tx.created_at)}</td>
                                                    <td className="text-truncate" style={{maxWidth: '150px'}} title={tx.description}>{tx.description}</td>
                                                    <td>{formatNumber(amount)}</td>
                                                    <td>
                                                        <Badge color={type === 'بدهکار' ? 'danger' : 'success'}>
                                                            {type}
                                                        </Badge>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {stats.lastTransactions.length === 0 && (
                                            <tr><td colSpan="4" className="text-center">تراکنشی یافت نشد</td></tr>
                                        )}
                                        </tbody>
                                    </Table>
                                </div>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </div>
    );
};

export default CustomerDashboard;