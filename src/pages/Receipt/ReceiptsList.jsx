import React, { useEffect, useState, useMemo } from "react";
import {
  Container, Row, Col, Card, CardBody, CardHeader, Table, Button, Spinner, Badge, Input, UncontrolledTooltip,
} from "reactstrap";
import { Link, useNavigate } from "react-router-dom";
import moment from "moment-jalaali";
import { supabase } from "../../helpers/supabase";

const ReceiptList = () => {
  const navigate = useNavigate();

  // ==================================================================
  // 1. تعریف تمام هوک‌ها در ابتدای تابع (بسیار مهم: ترتیب را حفظ کنید)
  // ==================================================================
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // هوک useEffect برای دریافت اطلاعات
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        let { data, error } = await supabase
            .from('receipts')
            .select(`
            *,
            owner:customers!fk_receipts_customer ( id, name, mobile ),
            items:receipt_items!fk_items_receipt ( id, weights_net )
          `)
            .order('id', { ascending: false });

        if (error) {
          console.warn("Retrying fetch with simple join...");
          const res = await supabase.from('receipts').select(`*, owner:customers(id, name), items:receipt_items(id, weights_net)`).order('id', { ascending: false });
          if (res.error) throw res.error;
          data = res.data;
        }

        setReceipts(data || []);
      } catch (err) {
        console.error("Supabase Error:", err);
      }
      setLoading(false);
    };

    loadData();
  }, []);

  // هوک useMemo برای فیلتر (همیشه باید اجرا شود)
  const filteredReceipts = useMemo(() => {
    if (!searchTerm) return receipts;
    const lower = searchTerm.toLowerCase();

    return receipts.filter(r => {
      const rNo = String(r.receipt_no || r.id);
      const ownerName = r.owner?.name || "";
      const driver = r.driver_name || "";

      return (
          rNo.includes(lower) ||
          ownerName.toLowerCase().includes(lower) ||
          driver.toLowerCase().includes(lower)
      );
    });
  }, [searchTerm, receipts]);

  // هوک useMemo برای آمار (همیشه باید اجرا شود)
  const stats = useMemo(() => {
    const totalCount = receipts.length;
    const finalCount = receipts.filter(r => r.status === 'final').length;

    const totalWeight = receipts.reduce((sum, r) => {
      const receiptWeight = r.items?.reduce((s, i) => s + (i.weights_net || 0), 0) || 0;
      return sum + receiptWeight;
    }, 0);

    return { totalCount, finalCount, totalWeight };
  }, [receipts]);

  // ==================================================================
  // 2. توابع کمکی (بدون هوک)
  // ==================================================================

  const handleDelete = async (id, receiptNo) => {
    if (!window.confirm(`آیا از حذف رسید شماره "${receiptNo}" مطمئن هستید؟`)) return;

    try {
      const { error } = await supabase.from('receipts').delete().eq('id', id);
      if (error) throw error;
      setReceipts(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      console.error(err);
      alert("خطا در حذف: " + err.message);
    }
  };

  const formatDate = (date) => date ? moment(date).format("jYYYY/jMM/jDD") : "-";

  const getStatusBadge = (status) => {
    switch (status) {
      case "final": return <Badge color="success" className="font-size-12"><i className="bx bx-check-double me-1"></i>نهایی</Badge>;
      case "draft": return <Badge color="warning" className="font-size-12"><i className="bx bx-pencil me-1"></i>پیش‌نویس</Badge>;
      default: return <Badge color="secondary">نامشخص</Badge>;
    }
  };

  const renderPlate = (row) => {
    if (!row.plate_mid3) return <span className="text-muted">-</span>;
    return (
        <div dir="ltr" className="d-inline-flex align-items-center bg-light border rounded px-2 py-1" style={{fontSize: '0.75rem'}}>
          <span className="fw-bold mx-1">{row.plate_left2}</span>
          <span className="mx-1">{row.plate_letter}</span>
          <span className="fw-bold mx-1">{row.plate_mid3}</span>
          <span className="border-start ps-1 ms-1 text-muted" style={{fontSize: '0.65rem'}}>IR {row.plate_iran_right}</span>
        </div>
    );
  };

  // ==================================================================
  // 3. خروجی JSX (مدیریت لودینگ فقط در اینجا مجاز است)
  // ==================================================================
  return (
      <div className="page-content">
        <Container fluid>
          <div className="page-title-box d-sm-flex align-items-center justify-content-between mb-4">
            <h4 className="mb-sm-0 font-size-18">لیست رسیدهای انبار</h4>
            <div className="page-title-right">
              <ol className="breadcrumb m-0">
                <li className="breadcrumb-item"><Link to="/dashboard">داشبورد</Link></li>
                <li className="breadcrumb-item active">رسیدها</li>
              </ol>
            </div>
          </div>

          <Row className="mb-3">
            <Col md={4}><Card className="mini-stats-wid"><CardBody><div className="d-flex"><div className="flex-grow-1"><p className="text-muted fw-medium">تعداد کل رسیدها</p><h4 className="mb-0">{stats.totalCount}</h4></div><div className="flex-shrink-0 align-self-center"><div className="avatar-sm rounded-circle bg-primary mini-stat-icon"><span className="avatar-title rounded-circle bg-primary"><i className="bx bx-file font-size-24"></i></span></div></div></div></CardBody></Card></Col>
            <Col md={4}><Card className="mini-stats-wid"><CardBody><div className="d-flex"><div className="flex-grow-1"><p className="text-muted fw-medium">رسیدهای نهایی</p><h4 className="mb-0">{stats.finalCount}</h4></div><div className="flex-shrink-0 align-self-center"><div className="avatar-sm rounded-circle bg-success mini-stat-icon"><span className="avatar-title rounded-circle bg-success"><i className="bx bx-check-circle font-size-24"></i></span></div></div></div></CardBody></Card></Col>
            <Col md={4}><Card className="mini-stats-wid"><CardBody><div className="d-flex"><div className="flex-grow-1"><p className="text-muted fw-medium">مجموع وزن وارده</p><h4 className="mb-0">{stats.totalWeight.toLocaleString()} <span className="font-size-12 text-muted">kg</span></h4></div><div className="flex-shrink-0 align-self-center"><div className="avatar-sm rounded-circle bg-info mini-stat-icon"><span className="avatar-title rounded-circle bg-info"><i className="bx bx-weight font-size-24"></i></span></div></div></div></CardBody></Card></Col>
          </Row>

          <Row>
            <Col lg={12}>
              <Card>
                <CardHeader className="bg-transparent border-bottom">
                  <div className="d-flex flex-wrap align-items-center justify-content-between">
                    <h5 className="card-title mb-0">مدیریت رسیدها</h5>
                    <div className="d-flex gap-2">
                      {/* دکمه بروزرسانی فقط استیت لودینگ را تغییر می‌دهد */}
                      <Button color="light" onClick={() => window.location.reload()}><i className="bx bx-refresh font-size-16 align-middle me-1"></i> بروزرسانی</Button>
                      <Button color="primary" onClick={() => navigate("/receipt/form")}><i className="bx bx-plus font-size-16 align-middle me-1"></i> ثبت رسید جدید</Button>
                    </div>
                  </div>
                </CardHeader>

                <CardBody>
                  <Row className="mb-4"><Col md={4}><div className="search-box me-2 mb-2 d-inline-block w-100"><div className="position-relative"><Input type="text" className="form-control" placeholder="جستجو (شماره، مالک، راننده)..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /><i className="bx bx-search-alt search-icon"></i></div></div></Col></Row>

                  {loading ? (
                      <div className="text-center py-5">
                        <Spinner color="primary" />
                        <p className="mt-2">در حال دریافت اطلاعات...</p>
                      </div>
                  ) : filteredReceipts.length === 0 ? (
                      <div className="text-center py-5 text-muted">
                        <i className="bx bx-folder-open display-4"></i>
                        <p className="mt-3">هیچ رسیدی یافت نشد.</p>
                      </div>
                  ) : (
                      <div className="table-responsive">
                        <Table className="table align-middle table-nowrap table-hover mb-0">
                          <thead className="table-light">
                          <tr>
                            <th style={{width: '70px'}}>شماره</th><th>تاریخ</th><th>مالک کالا</th><th>پلاک خودرو</th><th>تعداد</th><th>وزن (kg)</th><th>وضعیت</th><th style={{width: '150px'}}>عملیات</th>
                          </tr>
                          </thead>
                          <tbody>
                          {filteredReceipts.map((row) => {
                            const weight = row.items?.reduce((s, i) => s + (i.weights_net || 0), 0) || 0;
                            const count = row.items?.length || 0;

                            return (
                                <tr key={row.id}>
                                  <td><span className="fw-bold text-primary">#{row.receipt_no || row.id}</span></td>
                                  <td><i className="bx bx-calendar text-muted me-1"></i>{formatDate(row.doc_date)}</td>
                                  <td><h5 className="font-size-14 mb-1 text-dark">{row.owner?.name || "ناشناس"}</h5></td>
                                  <td>{renderPlate(row)}</td>
                                  <td><Badge color="soft-primary" className="font-size-12 badge-soft-primary">{count} قلم</Badge></td>
                                  <td><span className="fw-bold">{weight.toLocaleString()}</span></td>
                                  <td>{getStatusBadge(row.status)}</td>
                                  <td>
                                    <div className="d-flex gap-2">
                                      <Link to={`/receipt/form/edit/${row.id}`} className="btn btn-sm btn-soft-info" id={`edit-${row.id}`}><i className="bx bx-edit-alt font-size-14"></i></Link>
                                      <UncontrolledTooltip placement="top" target={`edit-${row.id}`}>ویرایش / مشاهده</UncontrolledTooltip>

                                      <button className="btn btn-sm btn-soft-danger" onClick={() => handleDelete(row.id, row.receipt_no)} id={`del-${row.id}`}>
                                        <i className="bx bx-trash font-size-14"></i>
                                      </button>
                                      <UncontrolledTooltip placement="top" target={`del-${row.id}`}>حذف</UncontrolledTooltip>
                                    </div>
                                  </td>
                                </tr>
                            );
                          })}
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

export default ReceiptList;