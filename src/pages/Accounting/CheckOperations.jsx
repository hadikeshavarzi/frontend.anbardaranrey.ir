import React, { useState, useEffect } from "react";
import {
    Container, Card, CardBody, Table, Button, Badge, Modal,
    ModalHeader, ModalBody, ModalFooter, Label, Row,
    Col, Nav, NavItem, NavLink, Spinner
} from "reactstrap";
import classnames from "classnames";
import { toast } from "react-toastify";
import Select from "react-select";
import DatePickerWithIcon from "../../components/Shared/DatePickerWithIcon";
import { supabase } from "../../helpers/supabase";
import { performCheckOperation, getBanks, getPeopleTafsilis } from "../../services/treasuryService";

export default function CheckOperations() {
    const [activeTab, setActiveTab] = useState("received");
    const [checks, setChecks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [btnLoading, setBtnLoading] = useState(false);

    // Modal State
    const [modal, setModal] = useState(false);
    const [selectedCheck, setSelectedCheck] = useState(null);
    const [operation, setOperation] = useState("");
    const [opDate, setOpDate] = useState(new Date().toISOString().slice(0, 10));
    const [targetId, setTargetId] = useState(null);

    // Options
    const [bankOptions, setBankOptions] = useState([]);
    const [personOptions, setPersonOptions] = useState([]);

    // ✅ تابع کمکی برای تبدیل تاریخ به شمسی بدون نیاز به پکیج خارجی
    const toPersianDate = (dateStr) => {
        if (!dateStr) return "-";
        const date = new Date(dateStr);
        return new Intl.DateTimeFormat('fa-IR').format(date);
    };

    const fetchChecks = async () => {
        setLoading(true);
        try {
            const type = activeTab === 'received' ? 'receive' : 'issue';
            const { data, error } = await supabase.from('treasury_checks')
                .select(`
                    *, 
                    owner:accounting_tafsili!owner_id(title),
                    target_bank:treasury_banks!target_bank_id(bank_name, account_no)
                `)
                .eq('type', type)
                .order('due_date', { ascending: true });

            if (error) throw error;
            setChecks(data || []);
        } catch (err) {
            toast.error("خطا در بارگذاری چک‌ها");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchOptions = async () => {
        try {
            const banks = await getBanks();
            setBankOptions(banks.map(b => ({ value: b.id, label: `${b.bank_name} (${b.account_no})` })));
            const people = await getPeopleTafsilis();
            setPersonOptions(people.map(p => ({ value: p.id, label: p.title })));
        } catch (err) {
            console.error("Error fetching options", err);
        }
    };

    useEffect(() => { fetchChecks(); }, [activeTab]);
    useEffect(() => { fetchOptions(); }, []);

    const openActionModal = (check, op) => {
        setSelectedCheck(check);
        setOperation(op);
        setTargetId(null);
        setModal(true);
    };

    const handleConfirm = async () => {
        if ((operation === 'deposit' || operation === 'spend') && !targetId) {
            return toast.warn("لطفا مقصد را انتخاب کنید");
        }

        setBtnLoading(true);
        try {
            const finalTargetId = (operation === 'clear' && selectedCheck?.status === 'deposited')
                ? selectedCheck.target_bank_id
                : (targetId ? targetId.value : null);

            await performCheckOperation({
                checkId: selectedCheck.id,
                operation,
                date: opDate,
                targetId: finalTargetId
            });

            toast.success("عملیات با موفقیت انجام شد");
            setModal(false);
            fetchChecks();
        } catch (err) {
            toast.error("خطا: " + err.message);
        } finally {
            setBtnLoading(false);
        }
    };

    const getStatusBadge = (check) => {
        const map = {
            'pending': { color: 'warning', text: check.type === 'receive' ? 'نزد صندوق' : 'صادر شده' },
            'deposited': { color: 'info', text: `واگذار شده به ${check.target_bank?.bank_name || 'بانک'}` },
            'cleared': { color: 'success', text: 'پاس شده' },
            'spent': { color: 'secondary', text: 'خرج شده' },
            'bounced': { color: 'danger', text: 'برگشتی' },
            'returned': { color: 'dark', text: 'عودت داده شده' },
        };
        const s = map[check.status] || { color: 'light', text: check.status };
        return <Badge color={s.color} className="p-2">{s.text}</Badge>;
    };

    return (
        <div className="page-content">
            <Container fluid>
                <div className="d-flex align-items-center justify-content-between mb-4">
                    <h4 className="mb-0 font-size-18 fw-bold">کارتابل مدیریت چک‌ها</h4>
                    {loading && <Spinner size="sm" color="primary" />}
                </div>

                <Card className="shadow-sm">
                    <CardBody>
                        <Nav tabs className="nav-tabs-custom mb-4">
                            <NavItem>
                                <NavLink
                                    className={classnames({ active: activeTab === "received" })}
                                    onClick={() => setActiveTab("received")}
                                    style={{cursor:'pointer'}}
                                >
                                    چک‌های دریافتی (مشتریان)
                                </NavLink>
                            </NavItem>
                            <NavItem>
                                <NavLink
                                    className={classnames({ active: activeTab === "issued" })}
                                    onClick={() => setActiveTab("issued")}
                                    style={{cursor:'pointer'}}
                                >
                                    چک‌های پرداختی (شرکت)
                                </NavLink>
                            </NavItem>
                        </Nav>

                        <Table responsive hover className="align-middle text-center border">
                            <thead className="table-light">
                            <tr>
                                <th>شماره چک / صیادی</th>
                                <th>مبلغ (ریال)</th>
                                <th>سررسید (شمسی)</th>
                                <th>بانک صادرکننده</th>
                                <th>طرف حساب</th>
                                <th>وضعیت</th>
                                <th>عملیات</th>
                            </tr>
                            </thead>
                            <tbody>
                            {checks.length > 0 ? checks.map(check => (
                                <tr key={check.id}>
                                    <td className="fw-bold">
                                        {check.cheque_no}
                                        <div className="small text-muted font-size-11">{check.sayadi_code}</div>
                                    </td>
                                    <td>{Number(check.amount).toLocaleString()}</td>
                                    <td>{toPersianDate(check.due_date)}</td>
                                    <td>{check.bank_name}</td>
                                    <td>{check.owner?.title || '-'}</td>
                                    <td>{getStatusBadge(check)}</td>
                                    <td>
                                        <div className="d-flex justify-content-center gap-1">
                                            {activeTab === 'received' && (
                                                <>
                                                    {check.status === 'pending' && (
                                                        <>
                                                            <Button size="sm" color="info" outline onClick={() => openActionModal(check, 'deposit')} title="خواباندن به حساب"><i className="bx bxs-bank"></i></Button>
                                                            <Button size="sm" color="secondary" outline onClick={() => openActionModal(check, 'spend')} title="خرج چک"><i className="bx bx-share"></i></Button>
                                                            <Button size="sm" color="success" outline onClick={() => openActionModal(check, 'clear')} title="وصول نقدی"><i className="bx bx-check"></i></Button>
                                                        </>
                                                    )}
                                                    {check.status === 'deposited' && (
                                                        <>
                                                            <Button size="sm" color="success" onClick={() => openActionModal(check, 'clear')}>اعلام وصول</Button>
                                                            <Button size="sm" color="danger" outline onClick={() => openActionModal(check, 'bounce')}>برگشت</Button>
                                                        </>
                                                    )}
                                                </>
                                            )}

                                            {activeTab === 'issued' && check.status === 'pending' && (
                                                <Button size="sm" color="success" outline onClick={() => openActionModal(check, 'clear')}>پاس شد (کسر از بانک)</Button>
                                            )}

                                            {(check.status === 'cleared' || check.status === 'spent') && (
                                                <Badge color="light" className="text-muted px-2 py-1">اتمام عملیات</Badge>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan="7" className="text-center py-4 text-muted">رکوردی یافت نشد</td></tr>
                            )}
                            </tbody>
                        </Table>
                    </CardBody>
                </Card>

                <Modal isOpen={modal} toggle={() => setModal(!modal)} centered>
                    <ModalHeader toggle={() => setModal(!modal)} className="bg-light">
                        {operation === 'deposit' ? 'واگذاری چک به بانک' :
                            operation === 'clear' ? 'اعلام وصول نهایی' :
                                operation === 'spend' ? 'واگذاری به شخص' : 'عملیات چک'}
                    </ModalHeader>
                    <ModalBody>
                        <div className="alert alert-warning border-0 p-2 font-size-13 text-center mb-3">
                            چک شماره <b>{selectedCheck?.cheque_no}</b> به مبلغ <b>{Number(selectedCheck?.amount).toLocaleString()}</b> ریال
                        </div>

                        <Row className="gy-3">
                            <Col md={12}>
                                <Label>تاریخ ثبت عملیات</Label>
                                <div style={{direction:'rtl'}}>
                                    <DatePickerWithIcon value={opDate} onChange={(d) => d?.toDate && setOpDate(d.toDate().toISOString().slice(0, 10))} />
                                </div>
                            </Col>

                            {operation === 'deposit' && (
                                <Col md={12}>
                                    <Label>بانک مقصد جهت خواباندن چک</Label>
                                    <Select options={bankOptions} onChange={setTargetId} placeholder="جستجوی بانک..." />
                                </Col>
                            )}

                            {operation === 'clear' && selectedCheck?.status === 'deposited' && (
                                <Col md={12}>
                                    <div className="bg-light p-3 rounded text-center border">
                                        <Label className="d-block text-muted small">چک به حساب زیر واریز می‌شود:</Label>
                                        <strong className="text-primary font-size-15">{selectedCheck.target_bank?.bank_name}</strong>
                                        <div className="small text-secondary">{selectedCheck.target_bank?.account_no}</div>
                                    </div>
                                </Col>
                            )}

                            {operation === 'spend' && (
                                <Col md={12}>
                                    <Label>گیرنده چک</Label>
                                    <Select options={personOptions} onChange={setTargetId} placeholder="انتخاب شخص..." />
                                </Col>
                            )}
                        </Row>
                    </ModalBody>
                    <ModalFooter className="bg-light">
                        <Button color="success" onClick={handleConfirm} disabled={btnLoading} className="px-4">
                            {btnLoading ? <Spinner size="sm" /> : "تایید و ثبت"}
                        </Button>
                        <Button color="secondary" outline onClick={() => setModal(false)}>انصراف</Button>
                    </ModalFooter>
                </Modal>
            </Container>
        </div>
    );
}