import React, { useEffect, useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  CardBody,
  Table,
  Button,
  Spinner,
  Alert,
  Badge,
} from "reactstrap";
import { Link, useParams, useNavigate } from "react-router-dom";
import { get } from "../../helpers/api_helper";
import moment from "moment-jalaali";

const ReceiptView = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadReceipt();
  }, [id]);


const loadReceipt = async () => {
  setLoading(true);
  setError("");

  console.log("🔍 Loading receipt with ID:", id);

  try {
    // ✅ اول receipt رو با depth=2 بگیر
    const res = await get(`/receipts/${id}?depth=2`);
    console.log("✅ Receipt loaded:", res);
    console.log("📦 Items raw:", res.items);

    // ✅ بررسی و دریافت جزئیات items
    if (res.items && Array.isArray(res.items) && res.items.length > 0) {
      const firstItem = res.items[0];

      // اگر items آرایه‌ای از ID ها باشد (number یا string)
      if (typeof firstItem === 'number' || typeof firstItem === 'string') {
        console.log("📦 Items are IDs, trying alternative methods...");
        
        // ✅ روش 1: امتحان depth=3
        try {
          console.log("📦 Trying depth=3...");
          const detailedReceipt = await get(`/receipts/${id}?depth=3`);
          if (detailedReceipt.items && typeof detailedReceipt.items[0] === 'object') {
            console.log("✅ Items loaded via depth=3");
            res.items = detailedReceipt.items;
          } else {
            throw new Error("depth=3 didn't help");
          }
        } catch (depthErr) {
          console.log("❌ depth=3 failed:", depthErr.message);
          
          // ✅ روش 2: امتحان /receipts/:id/items
          try {
            console.log("📦 Trying /receipts/:id/items...");
            const itemsResponse = await get(`/receipts/${id}/items`);
            res.items = itemsResponse.docs || itemsResponse;
            console.log("✅ Items loaded via /receipts/:id/items");
          } catch (itemsErr) {
            console.log("❌ /receipts/:id/items failed:", itemsErr.message);
            
            // ✅ روش 3: امتحان query items با where
            try {
              console.log("📦 Trying query with where...");
              const itemsQuery = await get(`/receiptitems?where[receipt][equals]=${id}`);
              res.items = itemsQuery.docs || [];
              console.log("✅ Items loaded via query:", res.items);
            } catch (queryErr) {
              console.log("❌ Query failed:", queryErr.message);
              console.log("⚠️ All methods failed - keeping items as IDs");
              // در صورت خطا در همه روش‌ها، items رو خالی می‌کنیم
              res.items = [];
            }
          }
        }
      } else {
        console.log("✅ Items already populated as objects");
      }
    } else {
      console.log("📦 No items found");
    }

    console.log("📦 Final receipt:", res);
    setReceipt(res);
  } catch (err) {
    console.error("❌ Error loading receipt:", err);
    setError(err.response?.data?.message || "خطا در دریافت اطلاعات رسید");
  }

  setLoading(false);
};


  const formatDate = (date) => {
    if (!date) return "-";
    return moment(date).format("jYYYY/jMM/jDD");
  };

  const formatNumber = (num) => {
    if (!num) return "0";
    return new Intl.NumberFormat("fa-IR").format(num);
  };

  const getStatusBadge = (status) => {
    if (status === "final") {
      return <Badge color="success">ثبت قطعی</Badge>;
    } else if (status === "draft") {
      return <Badge color="warning">پیش‌نویس</Badge>;
    }
    return <Badge color="secondary">نامشخص</Badge>;
  };

  const formatPlate = (plate) => {
    if (!plate || !plate.iranRight) return "-";
    return `${plate.iranRight || ""} | ${plate.mid3 || ""} ${plate.letter || ""} ${plate.left2 || ""}`;
  };

  const printReceipt = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="page-content">
        <Container fluid>
          <div className="text-center py-5">
            <Spinner color="primary" />
            <div className="mt-3">
              <h5 className="text-muted">در حال بارگذاری...</h5>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-content">
        <Container fluid>
          <Alert color="danger" className="d-flex align-items-center">
            <i className="mdi mdi-block-helper me-2"></i>
            <div>{error}</div>
          </Alert>
          <Button color="primary" onClick={() => navigate("/receipts")}>
            <i className="bx bx-arrow-back me-1"></i>
            بازگشت به لیست
          </Button>
        </Container>
      </div>
    );
  }

  if (!receipt) {
    return (
      <div className="page-content">
        <Container fluid>
          <Alert color="warning">رسید یافت نشد</Alert>
          <Button color="primary" onClick={() => navigate("/receipts")}>
            <i className="bx bx-arrow-back me-1"></i>
            بازگشت به لیست
          </Button>
        </Container>
      </div>
    );
  }

  return (
    <div className="page-content">
      <Container fluid>
        {/* Breadcrumb */}
        <div className="page-title-box d-sm-flex align-items-center justify-content-between">
          <h4 className="mb-sm-0 font-size-18">جزئیات رسید</h4>

          <div className="page-title-right">
            <ol className="breadcrumb m-0">
              <li className="breadcrumb-item">
                <Link to="/dashboard">داشبورد</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to="/receipts">رسیدها</Link>
              </li>
              <li className="breadcrumb-item active">جزئیات رسید</li>
            </ol>
          </div>
        </div>

        <Row>
          <Col lg={12}>
            <Card>
              <CardBody>
                {/* Header */}
                <div className="d-flex flex-wrap align-items-center justify-content-between mb-4 print-hide">
                  <div>
                    <h4 className="card-title mb-1">
                      رسید شماره #{receipt.receiptNo || receipt.id}
                    </h4>
                    <p className="card-title-desc mb-0">
                      مشاهده جزئیات کامل رسید ورود کالا
                    </p>
                  </div>

                  <div className="d-flex flex-wrap gap-2">
                    <Button color="light" onClick={() => navigate("/receipts")}>
                      <i className="bx bx-arrow-back me-1"></i>
                      بازگشت
                    </Button>

                    <Button color="info" onClick={printReceipt}>
                      <i className="bx bx-printer me-1"></i>
                      چاپ
                    </Button>

                    <Link
                      to={`/receipts/edit/${receipt.id}`}
                      className="btn btn-primary"
                    >
                      <i className="bx bx-edit-alt me-1"></i>
                      ویرایش
                    </Link>
                  </div>
                </div>

                {/* Receipt Info */}
                <Row className="mb-4">
                  <Col md={6}>
                    <div className="mb-3">
                      <h5 className="font-size-15 mb-3">اطلاعات اصلی</h5>

                      <div className="table-responsive">
                        <table className="table table-borderless table-sm mb-0">
                          <tbody>
                            <tr>
                              <td className="text-muted" style={{ width: "40%" }}>
                                شماره رسید:
                              </td>
                              <td className="fw-medium">
                                <Badge color="primary" pill>
                                  #{receipt.receiptNo || receipt.id}
                                </Badge>
                              </td>
                            </tr>
                            <tr>
                              <td className="text-muted">تاریخ سند:</td>
                              <td className="fw-medium">
                                {formatDate(receipt.docDate)}
                              </td>
                            </tr>
                            <tr>
                              <td className="text-muted">وضعیت:</td>
                              <td>{getStatusBadge(receipt.status)}</td>
                            </tr>
                            <tr>
                              <td className="text-muted">ثبت کننده:</td>
                              <td className="fw-medium">
                                {receipt.member?.full_name ||
                                  receipt.member?.name ||
                                  "-"}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </Col>

                  <Col md={6}>
                    <div className="mb-3">
                      <h5 className="font-size-15 mb-3">اطلاعات مالک و تحویل دهنده</h5>

                      <div className="table-responsive">
                        <table className="table table-borderless table-sm mb-0">
                          <tbody>
                            <tr>
                              <td className="text-muted" style={{ width: "40%" }}>
                                مالک:
                              </td>
                              <td className="fw-medium">
                                {receipt.owner?.name ||
                                  receipt.owner?.full_name ||
                                  "-"}
                              </td>
                            </tr>
                            {receipt.owner?.mobile && (
                              <tr>
                                <td className="text-muted">موبایل مالک:</td>
                                <td className="fw-medium">
                                  {receipt.owner.mobile}
                                </td>
                              </tr>
                            )}
                            <tr>
                              <td className="text-muted">تحویل دهنده:</td>
                              <td className="fw-medium">
                                {receipt.deliverer?.name ||
                                  receipt.deliverer?.full_name ||
                                  "-"}
                              </td>
                            </tr>
                            {receipt.deliverer?.mobile && (
                              <tr>
                                <td className="text-muted">موبایل تحویل دهنده:</td>
                                <td className="fw-medium">
                                  {receipt.deliverer.mobile}
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </Col>
                </Row>

                {/* Driver & Plate */}
                {(receipt.driver?.name || receipt.plate?.iranRight) && (
                  <Row className="mb-4">
                    <Col md={6}>
                      {receipt.driver?.name && (
                        <div className="mb-3">
                          <h5 className="font-size-15 mb-3">اطلاعات راننده</h5>

                          <div className="table-responsive">
                            <table className="table table-borderless table-sm mb-0">
                              <tbody>
                                <tr>
                                  <td className="text-muted" style={{ width: "40%" }}>
                                    نام راننده:
                                  </td>
                                  <td className="fw-medium">
                                    {receipt.driver.name}
                                  </td>
                                </tr>
                                {receipt.driver.nationalId && (
                                  <tr>
                                    <td className="text-muted">کد ملی:</td>
                                    <td className="fw-medium">
                                      {receipt.driver.nationalId}
                                    </td>
                                  </tr>
                                )}
                                {receipt.driver.birthDate && (
                                  <tr>
                                    <td className="text-muted">تاریخ تولد:</td>
                                    <td className="fw-medium">
                                      {formatDate(receipt.driver.birthDate)}
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </Col>

                    <Col md={6}>
                      {receipt.plate?.iranRight && (
                        <div className="mb-3">
                          <h5 className="font-size-15 mb-3">پلاک خودرو</h5>

                          <div className="table-responsive">
                            <table className="table table-borderless table-sm mb-0">
                              <tbody>
                                <tr>
                                  <td className="text-muted" style={{ width: "40%" }}>
                                    پلاک:
                                  </td>
                                  <td className="fw-medium">
                                    {formatPlate(receipt.plate)}
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </Col>
                  </Row>
                )}

                {/* Items Table */}
                <div className="mb-4">
                  <h5 className="font-size-15 mb-3">اقلام کالا</h5>

                  <div className="table-responsive">
                    <Table className="table table-bordered table-hover align-middle mb-0">
                      <thead className="table-light">
                        <tr>
                          <th style={{ width: "50px" }}>#</th>
                          <th>گروه کالا</th>
                          <th>نام کالا</th>
                          <th>تعداد</th>
                          <th>واحد</th>
                          <th>وزن خالص</th>
                          <th>ابعاد</th>
                        </tr>
                      </thead>
                      <tbody>
                        {receipt.items && receipt.items.length > 0 ? (
                          receipt.items.map((item, index) => (
                            <tr key={item.id || index}>
                              <td>{index + 1}</td>
                              <td>{item.group || "-"}</td>
                              <td className="fw-medium">{item.description || "-"}</td>
                              <td>{formatNumber(item.count)}</td>
                              <td>{item.unit || "-"}</td>
                              <td>
                                {item.weights?.netWeight
                                  ? formatNumber(item.weights.netWeight) + " کیلوگرم"
                                  : "-"}
                              </td>
                              <td>
                                {item.dimensions?.length &&
                                item.dimensions?.width &&
                                item.dimensions?.thickness
                                  ? `${item.dimensions.length} × ${item.dimensions.width} × ${item.dimensions.thickness}`
                                  : "-"}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="7" className="text-center text-muted">
                              هیچ کالایی ثبت نشده است
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </Table>
                  </div>
                </div>

                {/* Finance Info */}
                {receipt.finance && (
                  <Row className="mb-4">
                    <Col md={6}>
                      <div className="mb-3">
                        <h5 className="font-size-15 mb-3">هزینه‌ها</h5>

                        <div className="table-responsive">
                          <table className="table table-borderless table-sm mb-0">
                            <tbody>
                              <tr>
                                <td className="text-muted" style={{ width: "50%" }}>
                                  هزینه بارگیری:
                                </td>
                                <td className="fw-medium text-end">
                                  {formatNumber(receipt.finance.loadCost)} تومان
                                </td>
                              </tr>
                              <tr>
                                <td className="text-muted">هزینه تخلیه:</td>
                                <td className="fw-medium text-end">
                                  {formatNumber(receipt.finance.unloadCost)} تومان
                                </td>
                              </tr>
                              <tr>
                                <td className="text-muted">هزینه انبارداری:</td>
                                <td className="fw-medium text-end">
                                  {formatNumber(receipt.finance.warehouseCost)}{" "}
                                  تومان
                                </td>
                              </tr>
                              <tr>
                                <td className="text-muted">مالیات:</td>
                                <td className="fw-medium text-end">
                                  {formatNumber(receipt.finance.tax)} تومان
                                </td>
                              </tr>
                              <tr>
                                <td className="text-muted">کرایه برگشت:</td>
                                <td className="fw-medium text-end">
                                  {formatNumber(receipt.finance.returnFreight)}{" "}
                                  تومان
                                </td>
                              </tr>
                              <tr>
                                <td className="text-muted">دستمزد بارگیری:</td>
                                <td className="fw-medium text-end">
                                  {formatNumber(receipt.finance.loadingFee)} تومان
                                </td>
                              </tr>
                              <tr>
                                <td className="text-muted">سایر هزینه‌ها:</td>
                                <td className="fw-medium text-end">
                                  {formatNumber(receipt.finance.miscCost)} تومان
                                </td>
                              </tr>
                              <tr className="border-top">
                                <td className="fw-bold">جمع کل:</td>
                                <td className="fw-bold text-end text-primary">
                                  {formatNumber(
                                    (receipt.finance.loadCost || 0) +
                                      (receipt.finance.unloadCost || 0) +
                                      (receipt.finance.warehouseCost || 0) +
                                      (receipt.finance.tax || 0) +
                                      (receipt.finance.returnFreight || 0) +
                                      (receipt.finance.loadingFee || 0) +
                                      (receipt.finance.miscCost || 0)
                                  )}{" "}
                                  تومان
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        {receipt.finance.miscDescription && (
                          <div className="mt-3">
                            <small className="text-muted">
                              شرح سایر هزینه‌ها:
                            </small>
                            <p className="mb-0">
                              {receipt.finance.miscDescription}
                            </p>
                          </div>
                        )}
                      </div>
                    </Col>

                    {/* Payment Info */}
                    {receipt.payment && (
                      <Col md={6}>
                        <div className="mb-3">
                          <h5 className="font-size-15 mb-3">اطلاعات پرداخت</h5>

                          <div className="table-responsive">
                            <table className="table table-borderless table-sm mb-0">
                              <tbody>
                                <tr>
                                  <td className="text-muted" style={{ width: "50%" }}>
                                    پرداخت توسط:
                                  </td>
                                  <td className="fw-medium">
                                    {receipt.payment.paymentBy === "customer"
                                      ? "مشتری"
                                      : receipt.payment.paymentBy === "warehouse"
                                      ? "انبار"
                                      : "-"}
                                  </td>
                                </tr>
                                {receipt.payment.cardNumber && (
                                  <tr>
                                    <td className="text-muted">شماره کارت:</td>
                                    <td className="fw-medium">
                                      {receipt.payment.cardNumber}
                                    </td>
                                  </tr>
                                )}
                                {receipt.payment.accountNumber && (
                                  <tr>
                                    <td className="text-muted">شماره حساب:</td>
                                    <td className="fw-medium">
                                      {receipt.payment.accountNumber}
                                    </td>
                                  </tr>
                                )}
                                {receipt.payment.bankName && (
                                  <tr>
                                    <td className="text-muted">نام بانک:</td>
                                    <td className="fw-medium">
                                      {receipt.payment.bankName}
                                    </td>
                                  </tr>
                                )}
                                {receipt.payment.ownerName && (
                                  <tr>
                                    <td className="text-muted">نام صاحب حساب:</td>
                                    <td className="fw-medium">
                                      {receipt.payment.ownerName}
                                    </td>
                                  </tr>
                                )}
                                {receipt.payment.trackingCode && (
                                  <tr>
                                    <td className="text-muted">کد پیگیری:</td>
                                    <td className="fw-medium">
                                      {receipt.payment.trackingCode}
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </Col>
                    )}
                  </Row>
                )}
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Print Styles */}
      <style>
        {`
          @media print {
            .print-hide {
              display: none !important;
            }
            
            body {
              font-size: 12pt;
            }
            
            .card {
              border: none !important;
              box-shadow: none !important;
            }
            
            .table {
              font-size: 11pt;
            }
          }
        `}
      </style>
    </div>
  );
};

export default ReceiptView;