import React, { useEffect, useState } from "react";
import {
    Container, Card, CardBody, Table, Badge, Input, Row, Col, Spinner,
    Button, Modal, ModalHeader, ModalBody, ModalFooter
} from "reactstrap";
import { getCustomerBalances, getTafsiliLedger } from "../../../services/reportService";
import { formatNumber, toPersianDate } from "../../../helpers/utils";

export default function CustomerBalance() {
    // --- State برای لیست اصلی ---
    const [customers, setCustomers] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);

    // --- State برای مودال ریز گردش ---
    const [modalOpen, setModalOpen] = useState(false);
    const [ledgerData, setLedgerData] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [ledgerLoading, setLedgerLoading] = useState(false);

    // دریافت لیست مشتریان در ابتدای کار
    useEffect(() => {
        getCustomerBalances().then(data => {
            setCustomers(data);
            setFiltered(data);
        }).catch(err => {
            console.error(err);
        }).finally(() => {
            setLoading(false);
        });
    }, []);

    // جستجو در لیست مشتریان
    const handleSearch = (e) => {
        const val = e.target.value.toLowerCase();
        setSearch(val);
        const res = customers.filter(c =>
            c.title.toLowerCase().includes(val) ||
            c.code?.includes(val)
        );
        setFiltered(res);
    };

    // --- باز کردن مودال ریز گردش ---
    const handleShowLedger = async (customer) => {
        setSelectedCustomer(customer);
        setModalOpen(true);
        setLedgerLoading(true);
        setLedgerData([]); // پاک کردن دیتای قبلی

        try {
            // استفاده از سرویس موجود برای گرفتن گردش حساب
            const data = await getTafsiliLedger(customer.id);
            setLedgerData(data);
        } catch (error) {
            console.error("Error fetching ledger:", error);
        } finally {
            setLedgerLoading(false);
        }
    };

    // متغیر کمکی برای محاسبه مانده در لحظه داخل مودال
    let runningBalance = 0;

    return (
        <div className="page-content">
            <Container fluid>
                <h4 className="fw-bold mb-4 font-size-18">مانده حساب اشخاص و شرکت‌ها</h4>

                <Card>
                    <CardBody>
                        <Row className="mb-4">
                            <Col md={4}>
                                <div className="search-box">
                                    <div className="position-relative">
                                        <Input
                                            className="form-control"
                                            placeholder="جستجو نام مشتری یا کد..."
                                            value={search}
                                            onChange={handleSearch}
                                        />
                                        <i className="bx bx-search-alt search-icon" />
                                    </div>
                                </div>
                            </Col>
                        </Row>

                        {loading ? (
                            <div className="text-center py-5"><Spinner color="primary" /></div>
                        ) : (
                            <Table hover responsive className="align-middle text-center border table-striped">
                                <thead className="table-light">
                                <tr>
                                    <th>کد</th>
                                    <th>نام طرف حساب</th>
                                    <th>گردش بدهکار</th>
                                    <th>گردش بستانکار</th>
                                    <th>مانده نهایی</th>
                                    <th>وضعیت</th>
                                    <th>عملیات</th> {/* ستون جدید */}
                                </tr>
                                </thead>
                                <tbody>
                                {filtered.map(c => (
                                    <tr key={c.id}>
                                        <td><Badge color="light" className="text-dark">{c.code}</Badge></td>
                                        <td className="fw-bold text-start">{c.title}</td>
                                        <td className="text-muted">{formatNumber(c.totalBed)}</td>
                                        <td className="text-muted">{formatNumber(c.totalBes)}</td>
                                        <td className="fw-bold font-size-15" style={{color: c.balance > 0 ? '#198754' : c.balance < 0 ? '#dc3545' : 'black'}}>
                                            {formatNumber(Math.abs(c.balance))}
                                        </td>
                                        <td>
                                            <Badge
                                                className="font-size-11 p-2"
                                                color={c.balance > 0 ? 'success' : c.balance < 0 ? 'danger' : 'secondary'}
                                            >
                                                {c.status}
                                            </Badge>
                                        </td>
                                        <td>
                                            <Button
                                                color="primary"
                                                size="sm"
                                                outline
                                                onClick={() => handleShowLedger(c)}
                                                title="مشاهده ریز گردش حساب"
                                            >
                                                <i className="bx bx-list-ul me-1"></i>
                                                ریز گردش
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                                {filtered.length === 0 && <tr><td colSpan="7" className="py-5 text-muted">موردی یافت نشد</td></tr>}
                                </tbody>
                            </Table>
                        )}
                    </CardBody>
                </Card>

                {/* --- مودال نمایش ریز گردش --- */}
                <Modal isOpen={modalOpen} toggle={() => setModalOpen(!modalOpen)} size="xl" centered>
                    <ModalHeader toggle={() => setModalOpen(!modalOpen)}>
                        <i className="bx bx-history me-2 text-primary"></i>
                        ریز گردش حساب: <span className="fw-bold text-dark ms-2">{selectedCustomer?.title}</span>
                    </ModalHeader>
                    <ModalBody>
                        {ledgerLoading ? (
                            <div className="text-center py-5"><Spinner color="primary" /> <p className="mt-2">در حال دریافت تراکنش‌ها...</p></div>
                        ) : (
                            <div className="table-responsive">
                                <Table bordered hover className="text-center align-middle font-size-13 mb-0">
                                    <thead className="table-light">
                                    <tr>
                                        <th>#</th>
                                        <th>تاریخ</th>
                                        <th>شماره سند</th>
                                        <th>شرح عملیات</th>
                                        <th>بدهکار</th>
                                        <th>بستانکار</th>
                                        <th>مانده</th>
                                        <th>تشخیص</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {ledgerData.length > 0 ? ledgerData.map((row, index) => {
                                        const bed = Number(row.bed) || 0;
                                        const bes = Number(row.bes) || 0;
                                        runningBalance += (bed - bes);

                                        return (
                                            <tr key={row.id}>
                                                <td>{index + 1}</td>
                                                <td>{toPersianDate(row.document?.doc_date)}</td>
                                                <td><Badge color="light" className="text-dark">{row.document?.id}</Badge></td>
                                                <td className="text-start" style={{maxWidth: '350px'}}>{row.description}</td>
                                                <td className="text-success">{bed > 0 ? formatNumber(bed) : '-'}</td>
                                                <td className="text-danger">{bes > 0 ? formatNumber(bes) : '-'}</td>
                                                <td className="fw-bold bg-light">{formatNumber(Math.abs(runningBalance))}</td>
                                                <td>
                                                    {runningBalance > 0 ? <span className="text-success">بدهکار</span> :
                                                        runningBalance < 0 ? <span className="text-danger">بستانکار</span> : '-'}
                                                </td>
                                            </tr>
                                        );
                                    }) : (
                                        <tr>
                                            <td colSpan="8" className="py-4 text-muted">
                                                هیچ تراکنشی برای این مشتری ثبت نشده است.
                                            </td>
                                        </tr>
                                    )}
                                    </tbody>
                                    {ledgerData.length > 0 && (
                                        <tfoot>
                                        <tr className="table-secondary fw-bold">
                                            <td colSpan="4" className="text-end">جمع کل:</td>
                                            <td className="text-success">{formatNumber(ledgerData.reduce((s,x)=>s+(x.bed||0),0))}</td>
                                            <td className="text-danger">{formatNumber(ledgerData.reduce((s,x)=>s+(x.bes||0),0))}</td>
                                            <td className="text-primary font-size-15">{formatNumber(Math.abs(runningBalance))}</td>
                                            <td>{runningBalance > 0 ? 'بد' : runningBalance < 0 ? 'بس' : '-'}</td>
                                        </tr>
                                        </tfoot>
                                    )}
                                </Table>
                            </div>
                        )}
                    </ModalBody>
                    <ModalFooter>
                        <Button color="secondary" onClick={() => setModalOpen(false)}>بستن</Button>
                    </ModalFooter>
                </Modal>
            </Container>
        </div>
    );
}