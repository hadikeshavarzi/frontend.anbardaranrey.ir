import React, { useState, useEffect } from "react";
import {
    Container, Card, CardBody, Row, Col, Table, Button, Input, Modal, ModalHeader, ModalBody, ModalFooter, Label, Nav, NavItem, NavLink, TabContent, TabPane, Badge, Spinner, Alert
} from "reactstrap";
import classnames from "classnames";
import { toast } from "react-toastify";
import {
    getGroups, createGroup, updateGroup, deleteGroup,
    getGLs, createGL, updateGL, deleteGL,
    getMoeins, createMoein, updateMoein, deleteMoein,
    getTafsilis, createTafsili, updateTafsili, deleteTafsili,
    generateNextCode
} from "../../services/codingService";
import { useNavigate } from "react-router-dom"; // برای لینک دادن به صفحات دیگر

export default function AccountingCoding() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("1");
    const [loading, setLoading] = useState(false);
    const [codeLoading, setCodeLoading] = useState(false);

    // Data States
    const [groups, setGroups] = useState([]);
    const [gls, setGls] = useState([]);
    const [moeins, setMoeins] = useState([]);
    const [tafsilis, setTafsilis] = useState([]);

    // Modal
    const [modal, setModal] = useState(false);
    const [modalType, setModalType] = useState("");
    const [formData, setFormData] = useState({});
    const [isEdit, setIsEdit] = useState(false);

    // --- Fetch Data ---
    const fetchData = async () => {
        setLoading(true);
        try {
            const groupData = await getGroups(); setGroups(groupData);
            const glData = await getGLs(); setGls(glData);
            const moeinData = await getMoeins(); setMoeins(moeinData);
            const tafsiliData = await getTafsilis(); setTafsilis(tafsiliData);
        } catch (err) { toast.error("خطا در دریافت اطلاعات"); } finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    // --- Handlers ---
    const toggleModal = async (type = "") => {
        setModalType(type);
        setFormData({});
        setIsEdit(false);
        setModal(!modal);

        if (type === 'group') {
            setCodeLoading(true);
            const next = await generateNextCode('group');
            setFormData(prev => ({ ...prev, code: next }));
            setCodeLoading(false);
        }
        if (type === 'tafsili') {
            // پیش‌فرض روی "سایر" باشد چون بانک و مشتری را بستیم
            const next = await generateNextCode('tafsili', 'other');
            setFormData(prev => ({ ...prev, tafsili_type: 'other', code: next }));
        }
    };

    const handleEdit = (item, type) => {
        // جلوگیری از ویرایش تفصیلی‌های سیستمی در اینجا
        if (type === 'tafsili' && (item.tafsili_type === 'bank_account' || item.tafsili_type === 'customer' || item.tafsili_type === 'cash')) {
            return toast.info("این تفصیلی سیستمی است و باید از بخش مربوطه (مشتریان/خزانه‌داری) ویرایش شود.");
        }

        setModalType(type);
        let data = { ...item };
        if (type === 'gl') data.group_id = item.group_id;
        if (type === 'moein') data.gl_id = item.gl_id;

        setFormData(data);
        setIsEdit(true);
        setModal(true);
    };

    const handleParentChange = async (e, level) => {
        const parentId = e.target.value;
        if(level === 'gl') setFormData(prev => ({ ...prev, group_id: parentId }));
        if(level === 'moein') setFormData(prev => ({ ...prev, gl_id: parentId }));

        if (parentId && !isEdit) {
            setCodeLoading(true);
            const nextCode = await generateNextCode(level, parentId);
            setFormData(prev => ({ ...prev, code: nextCode }));
            setCodeLoading(false);
        }
    };

    const handleTafsiliTypeChange = async (e) => {
        const type = e.target.value;
        setFormData(prev => ({ ...prev, tafsili_type: type }));
        if (type && !isEdit) {
            setCodeLoading(true);
            const nextCode = await generateNextCode('tafsili', type);
            setFormData(prev => ({ ...prev, code: nextCode }));
            setCodeLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.title || !formData.code) return toast.warn("کد و عنوان الزامی است");
        try {
            if (modalType === 'group') isEdit ? await updateGroup(formData.id, formData) : await createGroup(formData);
            else if (modalType === 'gl') isEdit ? await updateGL(formData.id, formData) : await createGL(formData);
            else if (modalType === 'moein') isEdit ? await updateMoein(formData.id, formData) : await createMoein(formData);
            else if (modalType === 'tafsili') isEdit ? await updateTafsili(formData.id, formData) : await createTafsili(formData);

            toast.success(isEdit ? "ویرایش شد" : "ثبت شد");
            setModal(false);
            fetchData();
        } catch (err) { console.error(err); toast.error("خطا در ثبت"); }
    };

    const handleDelete = async (id, type, item) => {
        // جلوگیری از حذف تفصیلی‌های سیستمی
        if (type === 'tafsili' && (item.tafsili_type === 'bank_account' || item.tafsili_type === 'customer' || item.tafsili_type === 'cash')) {
            return toast.warn("این حساب سیستمی است و حذف آن فقط از بخش مربوطه (مشتریان/خزانه‌داری) امکان‌پذیر است.");
        }

        if (!window.confirm("آیا حذف شود؟")) return;
        try {
            if (type === 'group') await deleteGroup(id);
            if (type === 'gl') await deleteGL(id);
            if (type === 'moein') await deleteMoein(id);
            if (type === 'tafsili') await deleteTafsili(id);
            toast.success("حذف شد");
            fetchData();
        } catch (err) {
            if (err.message === 'DEPENDENCY_ERROR') toast.error("خطا: این حساب گردش دارد و قابل حذف نیست.");
            else toast.error("خطا در حذف");
        }
    };

    // هلپر برای تشخیص نوع تفصیلی
    const getTafsiliBadge = (type) => {
        switch(type) {
            case 'customer': return <Badge color="success">مشتری (سیستمی)</Badge>;
            case 'bank_account': return <Badge color="warning">بانک (سیستمی)</Badge>;
            case 'cash': return <Badge color="warning">صندوق (سیستمی)</Badge>;
            case 'cost_center': return <Badge color="info">مرکز هزینه</Badge>;
            case 'project': return <Badge color="primary">پروژه</Badge>;
            default: return <Badge color="secondary">سایر</Badge>;
        }
    };

    return (
        <div className="page-content">
            <Container fluid>
                <h4 className="mb-4 font-size-18 fw-bold">مدیریت کدینگ حسابداری</h4>

                <Card>
                    <CardBody>
                        <Nav tabs className="nav-tabs-custom mb-4">
                            <NavItem><NavLink className={classnames({ active: activeTab === "1" })} onClick={() => setActiveTab("1")} style={{cursor:'pointer'}}>1. گروه حساب</NavLink></NavItem>
                            <NavItem><NavLink className={classnames({ active: activeTab === "2" })} onClick={() => setActiveTab("2")} style={{cursor:'pointer'}}>2. حساب کل</NavLink></NavItem>
                            <NavItem><NavLink className={classnames({ active: activeTab === "3" })} onClick={() => setActiveTab("3")} style={{cursor:'pointer'}}>3. حساب معین</NavLink></NavItem>
                            <NavItem><NavLink className={classnames({ active: activeTab === "4" })} onClick={() => setActiveTab("4")} style={{cursor:'pointer'}}>4. تفصیلی شناور</NavLink></NavItem>
                        </Nav>

                        <TabContent activeTab={activeTab}>

                            {/* ... (TAB 1, 2, 3 مثل قبل هستند بدون تغییر) ... */}
                            <TabPane tabId="1">
                                <Button color="primary" className="mb-3" onClick={() => toggleModal('group')}>+ افزودن گروه</Button>
                                <Table bordered hover responsive>
                                    <thead className="table-light"><tr><th>کد</th><th>عنوان</th><th>ماهیت</th><th>عملیات</th></tr></thead>
                                    <tbody>
                                    {groups.map(item => (
                                        <tr key={item.id}>
                                            <td className="fw-bold text-center">{item.code}</td>
                                            <td>{item.title}</td>
                                            <td>{item.nature==='debtor'?'بدهکار':'بستانکار'}</td>
                                            <td>
                                                <div className="d-flex gap-2">
                                                    <Button size="sm" color="warning" outline onClick={() => handleEdit(item, 'group')}><i className="bx bx-edit"></i></Button>
                                                    <Button size="sm" color="danger" outline onClick={() => handleDelete(item.id, 'group')}><i className="bx bx-trash"></i></Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </Table>
                            </TabPane>
                            <TabPane tabId="2">
                                <Button color="primary" className="mb-3" onClick={() => toggleModal('gl')}>+ افزودن کل</Button>
                                <Table bordered hover responsive>
                                    <thead className="table-light"><tr><th>کد</th><th>عنوان</th><th>گروه</th><th>عملیات</th></tr></thead>
                                    <tbody>
                                    {gls.map(item => (
                                        <tr key={item.id}>
                                            <td className="fw-bold text-center">{item.code}</td>
                                            <td>{item.title}</td>
                                            <td className="text-muted">{item.accounting_groups?.code}</td>
                                            <td>
                                                <div className="d-flex gap-2">
                                                    <Button size="sm" color="warning" outline onClick={() => handleEdit(item, 'gl')}><i className="bx bx-edit"></i></Button>
                                                    <Button size="sm" color="danger" outline onClick={() => handleDelete(item.id, 'gl')}><i className="bx bx-trash"></i></Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </Table>
                            </TabPane>
                            <TabPane tabId="3">
                                <Button color="primary" className="mb-3" onClick={() => toggleModal('moein')}>+ افزودن معین</Button>
                                <Table bordered hover responsive>
                                    <thead className="table-light"><tr><th>کد</th><th>عنوان</th><th>کل</th><th>عملیات</th></tr></thead>
                                    <tbody>
                                    {moeins.map(item => (
                                        <tr key={item.id}>
                                            <td className="fw-bold text-center">{item.code}</td>
                                            <td>{item.title}</td>
                                            <td className="text-muted">{item.accounting_gl?.code}</td>
                                            <td>
                                                <div className="d-flex gap-2">
                                                    <Button size="sm" color="warning" outline onClick={() => handleEdit(item, 'moein')}><i className="bx bx-edit"></i></Button>
                                                    <Button size="sm" color="danger" outline onClick={() => handleDelete(item.id, 'moein')}><i className="bx bx-trash"></i></Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </Table>
                            </TabPane>


                            {/* ✅✅ TAB 4: TAFSILI (اصلاح شده) ✅✅ */}
                            <TabPane tabId="4">
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <Button color="primary" onClick={() => toggleModal('tafsili')}>+ افزودن تفصیلی (سایر)</Button>
                                    <div className="d-flex gap-2">
                                        <Button size="sm" color="success" outline onClick={() => navigate('/customers/add')}>+ مشتری جدید</Button>
                                        <Button size="sm" color="warning" outline onClick={() => navigate('/accounting/treasury')}>+ بانک/صندوق جدید</Button>
                                    </div>
                                </div>

                                <Table bordered hover responsive>
                                    <thead className="table-light"><tr><th>کد</th><th>عنوان تفصیلی</th><th>نوع</th><th>عملیات</th></tr></thead>
                                    <tbody>
                                    {tafsilis.map(item => {
                                        const isSystem = ['customer', 'bank_account', 'cash'].includes(item.tafsili_type);
                                        return (
                                            <tr key={item.id}>
                                                <td className="fw-bold text-center">{item.code}</td>
                                                <td>{item.title}</td>
                                                <td>{getTafsiliBadge(item.tafsili_type)}</td>
                                                <td>
                                                    <div className="d-flex gap-2">
                                                        {/* اگر سیستمی بود دکمه‌ها غیرفعال یا محدود شوند */}
                                                        <Button
                                                            size="sm"
                                                            color="secondary"
                                                            outline
                                                            disabled={isSystem}
                                                            title={isSystem ? "ویرایش از بخش مربوطه" : "ویرایش"}
                                                            onClick={() => handleEdit(item, 'tafsili')}
                                                        >
                                                            <i className={`bx ${isSystem ? 'bx-lock-alt' : 'bx-edit'}`}></i>
                                                        </Button>

                                                        <Button
                                                            size="sm"
                                                            color="danger"
                                                            outline
                                                            disabled={isSystem}
                                                            title={isSystem ? "حذف از بخش مربوطه" : "حذف"}
                                                            onClick={() => handleDelete(item.id, 'tafsili', item)}
                                                        >
                                                            <i className={`bx ${isSystem ? 'bx-lock-alt' : 'bx-trash'}`}></i>
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                    </tbody>
                                </Table>
                            </TabPane>

                        </TabContent>
                    </CardBody>
                </Card>

                {/* --- MODAL --- */}
                <Modal isOpen={modal} toggle={() => setModal(!modal)} centered>
                    <ModalHeader toggle={() => setModal(!modal)}>
                        {modalType === 'group' && 'افزودن گروه'}
                        {modalType === 'gl' && 'افزودن حساب کل'}
                        {modalType === 'moein' && 'افزودن حساب معین'}
                        {modalType === 'tafsili' && 'افزودن تفصیلی آزاد (غیر سیستمی)'}
                    </ModalHeader>
                    <ModalBody>
                        <Row className="gy-3">

                            {/* ... (کدهای Group, GL, Moein ثابت است) ... */}
                            {modalType === 'gl' && (
                                <Col md={12}>
                                    <Label>گروه حساب (والد)</Label>
                                    <Input type="select" value={formData.group_id || ''} onChange={(e) => handleParentChange(e, 'gl')} disabled={isEdit}>
                                        <option value="">انتخاب کنید...</option>
                                        {groups.map(g => <option key={g.id} value={g.id}>{g.code} - {g.title}</option>)}
                                    </Input>
                                </Col>
                            )}
                            {modalType === 'moein' && (
                                <Col md={12}>
                                    <Label>حساب کل (والد)</Label>
                                    <Input type="select" value={formData.gl_id || ''} onChange={(e) => handleParentChange(e, 'moein')} disabled={isEdit}>
                                        <option value="">انتخاب کنید...</option>
                                        {gls.map(g => <option key={g.id} value={g.id}>{g.code} - {g.title}</option>)}
                                    </Input>
                                </Col>
                            )}


                            {/* ✅✅ تغییر مهم: محدود کردن انواع تفصیلی در مودال ✅✅ */}
                            {modalType === 'tafsili' && (
                                <Col md={12}>
                                    <Alert color="info" className="font-size-12">
                                        برای تعریف <b>مشتری، بانک یا صندوق</b> لطفاً به منوی مربوطه مراجعه کنید. در اینجا فقط تفصیلی‌های متفرقه تعریف می‌شوند.
                                    </Alert>
                                    <Label>نوع تفصیلی</Label>
                                    <Input type="select" value={formData.tafsili_type || 'other'} onChange={handleTafsiliTypeChange} disabled={isEdit}>
                                        <option value="other">سایر (عمومی)</option>
                                        <option value="cost_center">مرکز هزینه</option>
                                        <option value="project">پروژه</option>
                                        <option value="personnel">پرسنل (غیر مشتری)</option>
                                        {/* گزینه‌های بانک و مشتری حذف شدند */}
                                    </Input>
                                </Col>
                            )}

                            <Col md={12}>
                                <Label className="d-flex justify-content-between">
                                    کد حساب {codeLoading && <Spinner size="sm" color="primary" />}
                                </Label>
                                <Input
                                    value={formData.code || ''}
                                    onChange={e => setFormData({...formData, code: e.target.value})}
                                    className="fw-bold font-size-16"
                                />
                            </Col>

                            <Col md={12}>
                                <Label>عنوان حساب</Label>
                                <Input value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} />
                            </Col>

                            {modalType === 'group' && (
                                <>
                                    <Col md={6}>
                                        <Label>ماهیت</Label>
                                        <Input type="select" value={formData.nature || 'dual'} onChange={e => setFormData({...formData, nature: e.target.value})}>
                                            <option value="dual">دوطرفه</option>
                                            <option value="debtor">بدهکار</option>
                                            <option value="creditor">بستانکار</option>
                                        </Input>
                                    </Col>
                                    <Col md={6}>
                                        <Label>نوع</Label>
                                        <Input type="select" value={formData.category || 'asset'} onChange={e => setFormData({...formData, category: e.target.value})}>
                                            <option value="asset">دارایی</option>
                                            <option value="liability">بدهی</option>
                                            <option value="revenue">درآمد</option>
                                            <option value="expense">هزینه</option>
                                            <option value="equity">سرمایه</option>
                                        </Input>
                                    </Col>
                                </>
                            )}
                        </Row>
                    </ModalBody>
                    <ModalFooter>
                        <Button color="success" onClick={handleSave}>{isEdit ? "ویرایش و ذخیره" : "ثبت"}</Button>
                        <Button color="secondary" onClick={() => setModal(false)}>لغو</Button>
                    </ModalFooter>
                </Modal>
            </Container>
        </div>
    );
}