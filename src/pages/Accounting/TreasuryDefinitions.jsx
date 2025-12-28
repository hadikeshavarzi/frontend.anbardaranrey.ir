import React, { useState, useEffect } from "react";
import {
    Container, Card, CardBody, Row, Col, Table, Button, Input, Modal, ModalHeader, ModalBody, ModalFooter, Label, Nav, NavItem, NavLink, TabContent, TabPane
} from "reactstrap";
import classnames from "classnames";
import { toast } from "react-toastify";
import {
    getBanks, createBank, updateBank, deleteBank,
    getCashes, createCash, updateCash,
    getPos, createPos,
    getCheckbooks, createCheckbook,
    getBaseBanks
} from "../../services/treasuryService";

export default function TreasuryDefinitions() {
    const [activeTab, setActiveTab] = useState("1");
    const [loading, setLoading] = useState(false);

    // Data
    const [baseBanks, setBaseBanks] = useState([]);
    const [banks, setBanks] = useState([]);
    const [cashes, setCashes] = useState([]);
    const [posList, setPosList] = useState([]);
    const [checkbooks, setCheckbooks] = useState([]);

    // Modal
    const [modal, setModal] = useState(false);
    const [modalType, setModalType] = useState("");
    const [formData, setFormData] = useState({});
    const [isEdit, setIsEdit] = useState(false); // وضعیت ویرایش

    // Fetch Data
    const fetchData = async () => {
        setLoading(true);
        try {
            const baseBankList = await getBaseBanks(); setBaseBanks(baseBankList);
            const b = await getBanks(); setBanks(b);
            const c = await getCashes(); setCashes(c);
            const p = await getPos(); setPosList(p);
            const ch = await getCheckbooks(); setCheckbooks(ch);
        } catch (err) { toast.error("خطا در دریافت اطلاعات"); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    // Open Modal for Create
    const toggleModal = (type = "") => {
        setModalType(type);
        setFormData({});
        setIsEdit(false);
        setModal(!modal);
    };

    // Open Modal for Edit
    const handleEdit = (item, type) => {
        setModalType(type);
        setFormData(item); // پر کردن فرم با دیتای موجود
        setIsEdit(true);
        setModal(true);
    };

    const handleSave = async () => {
        try {
            // --- BANK ---
            if (modalType === 'bank') {
                if(!formData.bank_name || !formData.account_no) return toast.warn("نام و شماره حساب الزامی است");

                if (isEdit) {
                    await updateBank(formData.id, formData);
                    toast.success("بانک ویرایش شد");
                } else {
                    await createBank(formData);
                    toast.success("بانک ثبت شد");
                }
            }
            // --- CASH ---
            else if (modalType === 'cash') {
                if(!formData.title) return toast.warn("عنوان صندوق الزامی است");

                if (isEdit) {
                    await updateCash(formData.id, formData);
                    toast.success("صندوق ویرایش شد");
                } else {
                    await createCash(formData);
                    toast.success("صندوق ثبت شد");
                }
            }
            // --- POS ---
            else if (modalType === 'pos') {
                if(!formData.title || !formData.bank_id) return toast.warn("عنوان و حساب متصل الزامی است");
                await createPos(formData); // (ویرایش پوز هنوز اضافه نشده)
                toast.success("کارتخوان ثبت شد");
            }
            // --- CHECK ---
            else if (modalType === 'check') {
                if(!formData.bank_id || !formData.serial_start) return toast.warn("اطلاعات ناقص است");
                await createCheckbook(formData);
                toast.success("دسته‌چک ثبت شد");
            }

            setModal(false);
            fetchData();
        } catch (err) {
            console.error(err);
            toast.error("خطا در ثبت اطلاعات");
        }
    };

    const handleDelete = async (id, type) => {
        if(!window.confirm("آیا حذف شود؟")) return;
        try {
            if(type === 'bank') await deleteBank(id);
            // ... بقیه حذف‌ها
            toast.success("حذف شد");
            fetchData();
        } catch(err) { toast.error("خطا در حذف"); }
    };

    return (
        <div className="page-content">
            <Container fluid>
                <h4 className="mb-4 font-size-18 fw-bold">تعاریف خزانه‌داری</h4>

                <Card>
                    <CardBody>
                        <Nav tabs className="nav-tabs-custom mb-4">
                            <NavItem><NavLink className={classnames({ active: activeTab === "1" })} onClick={() => setActiveTab("1")} style={{cursor:'pointer'}}>1. بانک‌ها</NavLink></NavItem>
                            <NavItem><NavLink className={classnames({ active: activeTab === "2" })} onClick={() => setActiveTab("2")} style={{cursor:'pointer'}}>2. صندوق‌ها</NavLink></NavItem>
                            <NavItem><NavLink className={classnames({ active: activeTab === "3" })} onClick={() => setActiveTab("3")} style={{cursor:'pointer'}}>3. کارتخوان</NavLink></NavItem>
                            <NavItem><NavLink className={classnames({ active: activeTab === "4" })} onClick={() => setActiveTab("4")} style={{cursor:'pointer'}}>4. دسته‌چک</NavLink></NavItem>
                        </Nav>

                        <TabContent activeTab={activeTab}>

                            {/* TAB 1: BANKS */}
                            <TabPane tabId="1">
                                <Button color="primary" className="mb-3" onClick={() => toggleModal('bank')}>+ افزودن حساب بانکی</Button>
                                <Table bordered hover responsive>
                                    <thead className="table-light"><tr><th>نام بانک</th><th>شماره حساب</th><th>شماره کارت</th><th>کد تفصیلی</th><th>عملیات</th></tr></thead>
                                    <tbody>
                                    {banks.map(item => (
                                        <tr key={item.id}>
                                            <td className="fw-bold">{item.bank_name} - {item.branch_name}</td>
                                            <td>{item.account_no}</td>
                                            <td>{item.card_no}</td>
                                            <td>
                                                {item.accounting_tafsili ? (
                                                    <span className="badge bg-success font-size-12">
                                                            {item.accounting_tafsili.code} - {item.accounting_tafsili.title}
                                                        </span>
                                                ) : <span className="text-muted">-</span>}
                                            </td>
                                            <td>
                                                <div className="d-flex gap-2">
                                                    <Button size="sm" color="warning" outline onClick={() => handleEdit(item, 'bank')}><i className="bx bx-edit"></i></Button>
                                                    <Button size="sm" color="danger" outline onClick={() => handleDelete(item.id, 'bank')}><i className="bx bx-trash"></i></Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </Table>
                            </TabPane>

                            {/* TAB 2: CASH */}
                            <TabPane tabId="2">
                                <Button color="primary" className="mb-3" onClick={() => toggleModal('cash')}>+ افزودن صندوق</Button>
                                <Table bordered hover responsive>
                                    <thead className="table-light"><tr><th>عنوان صندوق</th><th>مسئول</th><th>کد تفصیلی</th><th>عملیات</th></tr></thead>
                                    <tbody>
                                    {cashes.map(item => (
                                        <tr key={item.id}>
                                            <td className="fw-bold">{item.title}</td>
                                            <td>{item.keeper_name}</td>
                                            <td>
                                                {item.accounting_tafsili ? (
                                                    <span className="badge bg-success font-size-12">
                                                            {item.accounting_tafsili.code} - {item.accounting_tafsili.title}
                                                        </span>
                                                ) : <span className="text-muted">-</span>}
                                            </td>
                                            <td>
                                                <div className="d-flex gap-2">
                                                    <Button size="sm" color="warning" outline onClick={() => handleEdit(item, 'cash')}><i className="bx bx-edit"></i></Button>
                                                    <Button size="sm" color="danger" outline onClick={() => handleDelete(item.id, 'bank')}><i className="bx bx-trash"></i></Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </Table>
                            </TabPane>

                            {/* TAB 3 & 4 (بدون تغییر عمده) */}
                            <TabPane tabId="3">
                                <Button color="primary" className="mb-3" onClick={() => toggleModal('pos')}>+ تعریف کارتخوان</Button>
                                <Table bordered hover responsive>
                                    <thead className="table-light"><tr><th>عنوان</th><th>متصل به بانک</th><th>کد تفصیلی</th></tr></thead>
                                    <tbody>
                                    {posList.map(item => (
                                        <tr key={item.id}>
                                            <td className="fw-bold">{item.title}</td>
                                            <td>{item.treasury_banks?.bank_name} ({item.treasury_banks?.account_no})</td>
                                            <td><span className="badge bg-success font-size-12">{item.accounting_tafsili?.code}</span></td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </Table>
                            </TabPane>
                            <TabPane tabId="4">
                                <Button color="primary" className="mb-3" onClick={() => toggleModal('check')}>+ ثبت دسته‌چک</Button>
                                <Table bordered hover responsive>
                                    <thead className="table-light"><tr><th>بانک</th><th>سریال</th><th>وضعیت</th></tr></thead>
                                    <tbody>
                                    {checkbooks.map(item => (
                                        <tr key={item.id}>
                                            <td>{item.treasury_banks?.bank_name}</td>
                                            <td>{item.serial_start} تا {item.serial_end}</td>
                                            <td>{item.status}</td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </Table>
                            </TabPane>

                        </TabContent>
                    </CardBody>
                </Card>

                {/* MODAL */}
                <Modal isOpen={modal} toggle={() => setModal(!modal)} centered>
                    <ModalHeader toggle={() => setModal(!modal)}>
                        {isEdit ? 'ویرایش اطلاعات' : 'ثبت اطلاعات جدید'}
                    </ModalHeader>
                    <ModalBody>
                        <Row className="gy-3">

                            {/* --- Bank Form --- */}
                            {modalType === 'bank' && (
                                <>
                                    <Col md={6}>
                                        <Label>نام بانک <span className="text-danger">*</span></Label>
                                        <Input type="select" value={formData.bank_name || ''} onChange={e => setFormData({...formData, bank_name: e.target.value})}>
                                            <option value="">انتخاب کنید...</option>
                                            {baseBanks.map(bb => (
                                                <option key={bb.id} value={bb.name}>{bb.name}</option>
                                            ))}
                                        </Input>
                                    </Col>
                                    <Col md={6}><Label>نام شعبه</Label><Input value={formData.branch_name || ''} onChange={e => setFormData({...formData, branch_name: e.target.value})} /></Col>
                                    <Col md={12}><Label>شماره حساب <span className="text-danger">*</span></Label><Input value={formData.account_no || ''} onChange={e => setFormData({...formData, account_no: e.target.value})} /></Col>
                                    <Col md={12}><Label>شماره کارت</Label><Input value={formData.card_no || ''} onChange={e => setFormData({...formData, card_no: e.target.value})} /></Col>
                                    <Col md={12}><Label>شماره شبا</Label><Input value={formData.sheba_no || ''} onChange={e => setFormData({...formData, sheba_no: e.target.value})} placeholder="IR..." /></Col>
                                </>
                            )}

                            {/* --- Cash Form --- */}
                            {modalType === 'cash' && (
                                <>
                                    <Col md={12}><Label>عنوان صندوق <span className="text-danger">*</span></Label><Input value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="مثلا صندوق ریالی" /></Col>
                                    <Col md={12}><Label>مسئول صندوق</Label><Input value={formData.keeper_name || ''} onChange={e => setFormData({...formData, keeper_name: e.target.value})} /></Col>
                                </>
                            )}

                            {/* سایر فرم‌ها (pos, check) مانند قبل... */}
                            {modalType === 'pos' && (
                                <>
                                    <Col md={12}><Label>عنوان دستگاه</Label><Input value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} /></Col>
                                    <Col md={12}>
                                        <Label>متصل به حساب بانک</Label>
                                        <Input type="select" onChange={e => setFormData({...formData, bank_id: e.target.value})}>
                                            <option value="">انتخاب کنید...</option>
                                            {banks.map(b => <option key={b.id} value={b.id}>{b.bank_name} - {b.account_no}</option>)}
                                        </Input>
                                    </Col>
                                    <Col md={12}><Label>شماره ترمینال</Label><Input value={formData.terminal_id || ''} onChange={e => setFormData({...formData, terminal_id: e.target.value})} /></Col>
                                </>
                            )}
                            {modalType === 'check' && (
                                <>
                                    <Col md={12}>
                                        <Label>انتخاب بانک</Label>
                                        <Input type="select" onChange={e => setFormData({...formData, bank_id: e.target.value})}>
                                            <option value="">انتخاب کنید...</option>
                                            {banks.map(b => <option key={b.id} value={b.id}>{b.bank_name} - {b.account_no}</option>)}
                                        </Input>
                                    </Col>
                                    <Col md={6}><Label>سریال شروع</Label><Input type="number" value={formData.serial_start || ''} onChange={e => setFormData({...formData, serial_start: e.target.value})} /></Col>
                                    <Col md={6}><Label>سریال پایان</Label><Input type="number" value={formData.serial_end || ''} onChange={e => setFormData({...formData, serial_end: e.target.value})} /></Col>
                                </>
                            )}

                        </Row>
                    </ModalBody>
                    <ModalFooter>
                        <Button color="success" onClick={handleSave}>{isEdit ? 'ویرایش و ذخیره' : 'ثبت'}</Button>
                        <Button color="secondary" onClick={() => setModal(!modal)}>لغو</Button>
                    </ModalFooter>
                </Modal>
            </Container>
        </div>
    );
}