import React, { useEffect, useState } from "react";
import { Container, Card, CardBody, Table, Badge, Button, Collapse } from "reactstrap";
import { toast } from "react-toastify";
import { getFinancialDocuments, deleteFinancialDocument } from "../../services/financialService";
import { useNavigate } from "react-router-dom";

export default function AccountingList() {
    const [docs, setDocs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openRow, setOpenRow] = useState(null);
    const navigate = useNavigate();

    const fetchDocs = async () => {
        setLoading(true);
        try {
            const data = await getFinancialDocuments();
            setDocs(data);
        } catch (err) {
            toast.error("خطا در بارگیری اسناد");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchDocs(); }, []);

    const handleDelete = async (id, type) => {
        if (type === 'system') return toast.warn("اسناد سیستمی (انبار) قابل حذف نیستند.");
        if (!window.confirm("آیا از حذف این سند و تمام ردیف‌های آن اطمینان دارید؟")) return;

        try {
            await deleteFinancialDocument(id);
            toast.success("سند حذف شد");
            fetchDocs(); // رفرش لیست
        } catch (err) {
            toast.error("خطا در حذف سند");
        }
    };

    const handleEdit = (id, type) => {
        if (type === 'system') return toast.warn("اسناد سیستمی باید از بخش انبار ویرایش شوند.");
        navigate(`/accounting/edit/${id}`);
    };

    const fmt = (num) => Number(num).toLocaleString();
    const getDocTotal = (entries) => entries.reduce((acc, curr) => acc + (Number(curr.bed) || 0), 0);

    return (
        <div className="page-content">
            <Container fluid>
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h4 className="font-size-18 fw-bold">دفتر اسناد حسابداری</h4>
                    <Button color="primary" onClick={() => navigate("/accounting/new")}>
                        <i className="bx bx-plus me-1"></i> ثبت سند جدید
                    </Button>
                </div>

                <Card>
                    <CardBody>
                        {loading ? <div className="text-center p-5"><div className="spinner-border text-primary"></div></div> : (
                            <div className="table-responsive">
                                <Table className="align-middle table-nowrap table-hover">
                                    <thead className="table-light">
                                    <tr>
                                        <th>#</th>
                                        <th>شماره سند</th>
                                        <th>تاریخ</th>
                                        <th>شرح سند</th>
                                        <th>نوع</th>
                                        <th>مبلغ کل</th>
                                        <th>وضعیت</th>
                                        <th>عملیات</th>
                                        <th>جزئیات</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {docs.map((doc, idx) => (
                                        <React.Fragment key={doc.id}>
                                            <tr className={openRow === doc.id ? "table-active" : ""}>
                                                <td>{idx + 1}</td>
                                                <td className="fw-bold">{doc.doc_no}</td>
                                                <td>{new Date(doc.doc_date).toLocaleDateString('fa-IR')}</td>
                                                <td style={{maxWidth: '250px'}} className="text-truncate" title={doc.description}>{doc.description}</td>
                                                <td>{doc.doc_type === 'system' ? <Badge color="info">سیستمی</Badge> : <Badge color="warning">دستی</Badge>}</td>
                                                <td className="fw-bold">{fmt(getDocTotal(doc.financial_entries))}</td>
                                                <td>{doc.status === 'final' ? <i className="bx bx-check-circle text-success font-size-18"></i> : <i className="bx bx-time-five text-warning font-size-18"></i>}</td>
                                                <td>
                                                    <div className="d-flex gap-2">
                                                        <Button size="sm" color="warning" outline
                                                                disabled={doc.doc_type === 'system'}
                                                                onClick={(e) => { e.stopPropagation(); handleEdit(doc.id, doc.doc_type); }}>
                                                            <i className="bx bx-edit"></i>
                                                        </Button>
                                                        <Button size="sm" color="danger" outline
                                                                disabled={doc.doc_type === 'system'}
                                                                onClick={(e) => { e.stopPropagation(); handleDelete(doc.id, doc.doc_type); }}>
                                                            <i className="bx bx-trash"></i>
                                                        </Button>
                                                    </div>
                                                </td>
                                                <td onClick={() => setOpenRow(openRow === doc.id ? null : doc.id)} style={{cursor: 'pointer'}}>
                                                    <i className={`bx ${openRow === doc.id ? 'bx-chevron-up' : 'bx-chevron-down'} font-size-20`}></i>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td colSpan="9" className="p-0 border-0">
                                                    <Collapse isOpen={openRow === doc.id}>
                                                        <div className="p-3 bg-light border-bottom">
                                                            <Table size="sm" bordered className="mb-0 bg-white text-center" style={{fontSize: '13px'}}>
                                                                <thead className="table-secondary">
                                                                <tr><th>کد معین</th><th>شرح حساب</th><th>تفصیلی</th><th>شرح ردیف</th><th>بدهکار</th><th>بستانکار</th></tr>
                                                                </thead>
                                                                <tbody>
                                                                {doc.financial_entries.map((entry, eIdx) => (
                                                                    <tr key={eIdx}>
                                                                        <td>{entry.accounting_moein?.code}</td>
                                                                        <td className="fw-bold text-start">{entry.accounting_moein?.title}</td>
                                                                        <td className="text-start">{entry.accounting_tafsili?.title || "-"}</td>
                                                                        <td className="text-start text-muted">{entry.description}</td>
                                                                        <td className={entry.bed > 0 ? "text-dark" : "text-muted"}>{entry.bed > 0 ? fmt(entry.bed) : "-"}</td>
                                                                        <td className={entry.bes > 0 ? "text-dark" : "text-muted"}>{entry.bes > 0 ? fmt(entry.bes) : "-"}</td>
                                                                    </tr>
                                                                ))}
                                                                </tbody>
                                                            </Table>
                                                        </div>
                                                    </Collapse>
                                                </td>
                                            </tr>
                                        </React.Fragment>
                                    ))}
                                    </tbody>
                                </Table>
                            </div>
                        )}
                    </CardBody>
                </Card>
            </Container>
        </div>
    );
}