import React, { useEffect, useState, useCallback, useMemo } from "react";
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
import PlateDisplay from "../../components/PlateDisplay"; // ✅ کامپوننت جدید پلاک
import "../../assets/scss/ReceiptView.scss";

const ReceiptView = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Custom hook برای استخراج داده‌ها
  const useReceiptData = (receiptData) => {
    const driver = useMemo(() => {
      if (!receiptData?.driver) return null;
      const d = receiptData.driver;
      return {
        name: d.name && d.name.trim() ? d.name : null,
        nationalId: d.nationalId && d.nationalId.trim() ? d.nationalId : null,
        birthDate: d.birthDate || null,
      };
    }, [receiptData?.driver]);

    const plate = useMemo(() => {
      if (!receiptData?.plate) return null;
      const p = receiptData.plate;
      return {
        // ✅ Mapping دقیق با PlateDisplay component
        left2: p.left2 || "",        // کد استان (راست)
        middle3: p.mid3 || "",       // 3 رقم وسط  
        letter: p.letter || "",      // حرف وسط
        right2: p.right2 || "",      // 2 رقم راست
        iranRight: p.iranRight || "",
      };
    }, [receiptData?.plate]);

    const refDoc = useMemo(() => {
      if (!receiptData?.refDocument) return { refType: "none" };
      const ref = receiptData.refDocument;
      return {
        refType: ref.refType || "none",
        barnamehNumber: ref.barnamehNumber && ref.barnamehNumber.trim() ? ref.barnamehNumber : null,
        barnamehDate: ref.barnamehDate || null,
        barnamehTracking: ref.barnamehTracking && ref.barnamehTracking.trim() ? ref.barnamehTracking : null,
        pettehNumber: ref.pettehNumber && ref.pettehNumber.trim() ? ref.pettehNumber : null,
        havaleNumber: ref.havaleNumber && ref.havaleNumber.trim() ? ref.havaleNumber : null,
        productionNumber: ref.productionNumber && ref.productionNumber.trim() ? ref.productionNumber : null,
      };
    }, [receiptData?.refDocument]);

    const finance = useMemo(() => {
      if (!receiptData?.finance) return null;
      const fin = receiptData.finance;
      return {
        loadCost: fin.loadCost || 0,
        unloadCost: fin.unloadCost || 0,
        warehouseCost: fin.warehouseCost || 0,
        tax: fin.tax || 0,
        returnFreight: fin.returnFreight || 0,
        loadingFee: fin.loadingFee || 0,
        miscCost: fin.miscCost || 0,
        miscDescription: fin.miscDescription && fin.miscDescription.trim() ? fin.miscDescription : null,
      };
    }, [receiptData?.finance]);

    const payment = useMemo(() => {
      if (!receiptData?.payment) return null;
      const pay = receiptData.payment;
      return {
        paymentBy: pay.paymentBy || null,
        cardNumber: pay.cardNumber && pay.cardNumber.trim() ? pay.cardNumber : null,
        accountNumber: pay.accountNumber && pay.accountNumber.trim() ? pay.accountNumber : null,
        bankName: pay.bankName && pay.bankName.trim() ? pay.bankName : null,
        ownerName: pay.ownerName && pay.ownerName.trim() ? pay.ownerName : null,
        trackingCode: pay.trackingCode && pay.trackingCode.trim() ? pay.trackingCode : null,
      };
    }, [receiptData?.payment]);

    const activeColumns = useMemo(() => {
      if (!receiptData?.items || receiptData.items.length === 0) {
        return [allPossibleColumns[0]];
      }
      return allPossibleColumns.filter((col) => {
        if (col.key === "rowNumber") return true;
        return hasDataInPath(receiptData.items, col.path, col.isCheckbox);
      });
    }, [receiptData?.items]);

    return { driver, plate, refDoc, finance, payment, activeColumns };
  };

  // بارگذاری داده‌ها با useCallback
  const loadReceipt = useCallback(async () => {
    setLoading(true);
    setError("");

    console.log("🔍 Loading receipt with ID:", id);

    try {
      const res = await get(`/receipts/${id}?depth=3`);
      console.log("✅ Receipt loaded:", res);
      setReceipt(res);
    } catch (err) {
      console.error("❌ Error loading receipt:", err);
      setError(err.response?.data?.message || err.message || "خطا در دریافت اطلاعات رسید");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadReceipt();
  }, [loadReceipt]);

  // Helper functions
  const formatDate = useCallback((date) => {
    if (!date) return "-";
    return moment(date).format("jYYYY/jMM/jDD");
  }, []);

  const formatDateTime = useCallback((date) => {
    if (!date) return "-";
    return moment(date).format("jYYYY/jMM/jDD - HH:mm");
  }, []);

  const formatNumber = useCallback((num) => {
    if (!num && num !== 0) return "0";
    return new Intl.NumberFormat("fa-IR").format(num);
  }, []);

  const getStatusBadge = useCallback((status) => {
    if (status === "final") {
      return <Badge color="success">ثبت قطعی</Badge>;
    } else if (status === "draft") {
      return <Badge color="warning">پیش‌نویس</Badge>;
    }
    return <Badge color="secondary">نامشخص</Badge>;
  }, []);

  const hasPlateData = useCallback((plate) => {
    if (!plate) return false;
    const hasData = (
      (plate.left2 && plate.left2.trim() !== "") ||
      (plate.middle3 && plate.middle3.trim() !== "") ||
      (plate.letter && plate.letter.trim() !== "") ||
      (plate.right2 && plate.right2.trim() !== "")
    );
    return hasData;
  }, []);

  const getProductionTypeLabel = useCallback((type) => {
    if (type === "domestic") return "داخلی";
    if (type === "import") return "وارداتی";
    return "-";
  }, []);

  const getRefTypeLabel = useCallback((refType) => {
    const labels = {
      none: "بدون مرجع",
      barnameh: "بارنامه",
      petteh: "پته گمرکی",
      havale: "حواله سامانه جامع",
      production: "اظهار تولید",
    };
    return labels[refType] || "-";
  }, []);

  const hasRefDocument = useCallback(() => {
    const ref = receipt?.refDocument;
    if (!ref || !ref.refType || ref.refType === "none") return false;

    switch (ref.refType) {
      case "barnameh":
        return !!(ref.barnamehNumber || ref.barnamehDate || ref.barnamehTracking);
      case "petteh":
        return !!ref.pettehNumber;
      case "havale":
        return !!ref.havaleNumber;
      case "production":
        return !!ref.productionNumber;
      default:
        return false;
    }
  }, [receipt?.refDocument]);

  const hasDriverOrPlateData = useCallback(() => {
    const driverData = receipt?.driver;
    const plateData = receipt?.plate;
    return !!(
      driverData?.name?.trim() ||
      driverData?.nationalId?.trim() ||
      driverData?.birthDate ||
      hasPlateData(plateData)
    );
  }, [receipt?.driver, receipt?.plate, hasPlateData]);

  const allPossibleColumns = [
    {
      key: "rowNumber",
      label: "ردیف",
      path: null,
      className: "text-center",
      width: "40px",
    },
    { key: "row", label: "ردیف کالا", path: "row", className: "text-center", width: "60px" },
    {
      key: "product",
      label: "نام کالا",
      path: "product.name",
      className: "fw-bold",
    },
    {
      key: "productCategory",
      label: "گروه",
      path: "product.category.name",
      className: "",
    },
    {
      key: "unit",
      label: "واحد",
      path: "product.unit",
      className: "text-center",
      width: "60px",
    },
    {
      key: "nationalProductId",
      label: "کد ملی",
      path: "national_product_id",
      width: "80px",
    },
    {
      key: "productDescription",
      label: "شرح کالا",
      path: "product_description",
    },
    { key: "count", label: "تعداد", path: "count", className: "text-center", width: "60px" },
    {
      key: "productionType",
      label: "نوع",
      path: "productionType",
      className: "text-center",
      width: "60px",
    },
    {
      key: "isUsed",
      label: "مستعمل",
      path: "isUsed",
      className: "text-center",
      width: "60px",
      isCheckbox: true,
    },
    {
      key: "isDefective",
      label: "معیوب",
      path: "isDefective",
      className: "text-center",
      width: "60px",
      isCheckbox: true,
    },
    {
      key: "fullWeight",
      label: "وزن پر",
      path: "weights.fullWeight",
      className: "text-end",
      width: "80px",
    },
    {
      key: "emptyWeight",
      label: "وزن خالی",
      path: "weights.emptyWeight",
      className: "text-end",
      width: "80px",
    },
    {
      key: "netWeight",
      label: "وزن خالص",
      path: "weights.netWeight",
      className: "text-end",
      width: "80px",
    },
    {
      key: "originWeight",
      label: "وزن مبدا",
      path: "weights.originWeight",
      className: "text-end",
      width: "80px",
    },
    {
      key: "weightDiff",
      label: "اختلاف",
      path: "weights.weightDiff",
      className: "text-end",
      width: "80px",
    },
    {
      key: "length",
      label: "طول",
      path: "dimensions.length",
      className: "text-center",
      width: "60px",
    },
    {
      key: "width",
      label: "عرض",
      path: "dimensions.width",
      className: "text-center",
      width: "60px",
    },
    {
      key: "thickness",
      label: "ضخامت",
      path: "dimensions.thickness",
      className: "text-center",
      width: "60px",
    },
    { key: "heatNumber", label: "Heat No", path: "heatNumber", width: "80px" },
    { key: "bundleNo", label: "بسته", path: "bundleNo", width: "70px" },
    { key: "brand", label: "برند", path: "brand", width: "80px" },
    { key: "orderNo", label: "سفارش", path: "orderNo", width: "80px" },
    { key: "depoLocation", label: "دپو", path: "depoLocation", width: "80px" },
    { key: "descriptionNotes", label: "توضیحات", path: "descriptionNotes" },
  ];

  const hasDataInPath = useCallback((items, path, isCheckbox = false) => {
    if (!items || items.length === 0) return false;

    return items.some((item) => {
      if (!path) return true;

      const fields = path.split('.');
      let value = item;

      for (const field of fields) {
        if (value && typeof value === 'object' && field in value) {
          value = value[field];
        } else {
          return false;
        }
      }

      if (value === null || value === undefined) return false;
      
      if (isCheckbox) return value === true;
      
      if (typeof value === "boolean") return true;
      if (typeof value === "number") return value !== 0;
      if (typeof value === "string") return value.trim() !== "";
      if (typeof value === "object" && value !== null) return true;

      return false;
    });
  }, []);

  const getCellValue = useCallback((item, column) => {
    if (column.key === "rowNumber") return null;

    if (column.key === "product") {
      if (typeof item.product === 'object' && item.product !== null) {
        return item.product.name || "-";
      }
      return "-";
    }

    if (column.key === "productCategory") {
      if (typeof item.product === 'object' && item.product !== null) {
        if (typeof item.product.category === 'object' && item.product.category !== null) {
          return item.product.category.name || "-";
        }
        return item.product.category || "-";
      }
      return "-";
    }

    if (column.key === "unit") {
      if (typeof item.product === 'object' && item.product !== null) {
        const unit = item.product.unit;
        if (typeof unit === 'object' && unit !== null) {
          return unit.name || unit.symbol || "-";
        }
        return unit || "-";
      }
      return "-";
    }

    if (column.key === "productionType") {
      return getProductionTypeLabel(item.productionType);
    }

    if (column.key === "isUsed" || column.key === "isDefective") {
      const value = item[column.key];
      return value ? (
        <span className="text-success fw-bold" aria-label="بله">✓</span>
      ) : (
        <span className="text-muted" aria-label="خیر">-</span>
      );
    }

    const fields = column.path.split('.');
    let value = item;

    for (const field of fields) {
      if (value && typeof value === 'object' && field in value) {
        value = value[field];
      } else {
        value = null;
        break;
      }
    }

    if (typeof value === "number") return formatNumber(value);
    if (typeof value === "string" && value.trim()) return value;

    return "-";
  }, [formatNumber, getProductionTypeLabel]);

  const getColumnTotal = useCallback((column, items) => {
    if (!items || items.length === 0) return null;

    const numericColumns = [
      "count", "fullWeight", "emptyWeight", "netWeight", 
      "originWeight", "weightDiff", "length", "width", "thickness"
    ];

    if (!numericColumns.includes(column.key)) return null;

    const total = items.reduce((sum, item) => {
      const fields = column.path.split('.');
      let value = item;

      for (const field of fields) {
        if (value && typeof value === 'object' && field in value) {
          value = value[field];
        } else {
          return sum;
        }
      }

      return sum + (typeof value === "number" ? value : 0);
    }, 0);

    return total;
  }, []);

  const calculateTotalCost = useCallback((financeData) => {
    if (!financeData) return 0;
    return (
      (financeData.loadCost || 0) +
      (financeData.unloadCost || 0) +
      (financeData.warehouseCost || 0) +
      (financeData.tax || 0) +
      (financeData.returnFreight || 0) +
      (financeData.loadingFee || 0) +
      (financeData.miscCost || 0)
    );
  }, []);

  const printReceipt = useCallback(() => {
    window.print();
  }, []);

  const getReceiptUrl = useCallback(() => {
    return `${window.location.origin}/receipts/view/${id}`;
  }, [id]);

  const QRCode = useCallback(({ value, size = 100 }) => {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}`;
    return (
      <div className="qr-code-box" role="img" aria-label="کد QR رسید">
        <img src={qrUrl} alt="QR Code" style={{ width: size, height: size }} />
        <div className="qr-text">اسکن کنید</div>
      </div>
    );
  }, []);

  // استفاده از custom hook
  const { driver, plate, refDoc, finance, payment, activeColumns } = useReceiptData(receipt);
  const columnCount = activeColumns.length;
  const tableClass = 
    columnCount > 8 ? "table items-table very-many-columns" :
    columnCount > 6 ? "table items-table many-columns" :
    "table items-table";

  // Loading State
  if (loading) {
    return (
      <div className="page-content">
        <Container fluid>
          <div className="text-center py-5" role="status" aria-live="polite">
            <Spinner color="primary" />
            <div className="mt-3">
              <h5 className="text-muted">در حال بارگذاری...</h5>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="page-content">
        <Container fluid>
          <Alert color="danger" className="d-flex align-items-center">
            <i className="mdi mdi-block-helper me-2" aria-hidden="true"></i>
            <div>{error}</div>
          </Alert>
          <Button 
            color="primary" 
            onClick={() => navigate("/receipts")}
            aria-label="بازگشت به لیست رسیدها"
          >
            <i className="bx bx-arrow-back me-1" aria-hidden="true"></i>
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
          <Alert color="warning" role="alert">
            رسید یافت نشد
          </Alert>
          <Button 
            color="primary" 
            onClick={() => navigate("/receipts")}
            aria-label="بازگشت به لیست رسیدها"
          >
            <i className="bx bx-arrow-back me-1" aria-hidden="true"></i>
            بازگشت به لیست
          </Button>
        </Container>
      </div>
    );
  }

  return (
    <div className="page-content">
      <Container fluid>
        <div className="page-title-box d-sm-flex align-items-center justify-content-between print-hide">
          <h4 className="mb-sm-0 font-size-18">جزئیات رسید</h4>

          <div className="page-title-right">
            <ol className="breadcrumb m-0">
              <li className="breadcrumb-item">
                <Link to="/dashboard">داشبورد</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to="/receipts">رسیدها</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">جزئیات رسید</li>
            </ol>
          </div>
        </div>

        <div className="d-flex flex-wrap gap-2 mb-3 print-hide">
          <Button 
            color="light" 
            onClick={() => navigate("/receipts")}
            aria-label="بازگشت به لیست"
          >
            <i className="bx bx-arrow-back me-1" aria-hidden="true"></i>
            بازگشت
          </Button>

          <Button 
            color="info" 
            onClick={printReceipt}
            aria-label="چاپ رسید"
          >
            <i className="bx bx-printer me-1" aria-hidden="true"></i>
            چاپ
          </Button>

          <Link
            to={`/receipts/edit/${receipt.id}`}
            className="btn btn-primary"
            aria-label="ویرایش رسید"
          >
            <i className="bx bx-edit-alt me-1" aria-hidden="true"></i>
            ویرایش
          </Link>
        </div>

        <div className="receipt-print-wrapper">
          <Card className="receipt-card mb-3">
            <CardBody>
              <div className="receipt-header">
                <div className="header-content">
                  <h3 className="receipt-title">رسید انبار</h3>
                  <div className="receipt-info">
                    <span><strong>شماره:</strong> {receipt.receiptNo || receipt.receipt_no || receipt.id}</span>
                    <span className="mx-2">|</span>
                    <span><strong>تاریخ:</strong> {formatDate(receipt.docDate || receipt.doc_date)}</span>
                    <span className="mx-2">|</span>
                    {getStatusBadge(receipt.status)}
                  </div>
                </div>
                <div className="header-qr">
                  <QRCode value={getReceiptUrl()} size={90} />
                </div>
              </div>
            </CardBody>
          </Card>

          <Row>
            <Col md={hasRefDocument() ? 6 : 12} className="mb-3">
              <Card className="receipt-card h-100">
                <CardBody>
                  <h6 className="section-title">
                    <i className="ri-user-line me-2" aria-hidden="true"></i>
                    اطلاعات طرفین
                  </h6>
                  <table className="detail-table" role="table" aria-label="اطلاعات طرفین">
                    <tbody>
                      <tr>
                        <th scope="row">مالک:</th>
                        <td>{receipt.owner?.name || receipt.owner?.full_name || "-"}</td>
                      </tr>
                      <tr>
                        <th scope="row">تحویل دهنده:</th>
                        <td>{receipt.deliverer?.name || receipt.deliverer?.full_name || "-"}</td>
                      </tr>
                      <tr>
                        <th scope="row">ثبت کننده:</th>
                        <td>{receipt.member?.full_name || receipt.member?.name || "-"}</td>
                      </tr>
                      <tr className="print-hide">
                        <th scope="row">تاریخ ثبت:</th>
                        <td>{formatDateTime(receipt.createdAt || receipt.created_at)}</td>
                      </tr>
                    </tbody>
                  </table>
                </CardBody>
              </Card>
            </Col>

            {hasRefDocument() && (
              <Col md={6} className="mb-3">
                <Card className="receipt-card h-100">
                  <CardBody>
                    <h6 className="section-title">
                      <i className="ri-file-copy-line me-2" aria-hidden="true"></i>
                      سند مرجع
                    </h6>
                    <table className="detail-table" role="table" aria-label="اطلاعات سند مرجع">
                      <tbody>
                        <tr>
                          <th scope="row">نوع:</th>
                          <td>
                            <Badge color="info">
                              {getRefTypeLabel(refDoc.refType)}
                            </Badge>
                          </td>
                        </tr>
                        {refDoc.refType === "barnameh" && (
                          <>
                            {refDoc.barnamehNumber && (
                              <tr>
                                <th scope="row">شماره بارنامه:</th>
                                <td>{refDoc.barnamehNumber}</td>
                              </tr>
                            )}
                            {refDoc.barnamehDate && (
                              <tr>
                                <th scope="row">تاریخ:</th>
                                <td>{formatDate(refDoc.barnamehDate)}</td>
                              </tr>
                            )}
                            {refDoc.barnamehTracking && (
                              <tr>
                                <th scope="row">کد رهگیری:</th>
                                <td>{refDoc.barnamehTracking}</td>
                              </tr>
                            )}
                          </>
                        )}
                        {refDoc.refType === "petteh" && refDoc.pettehNumber && (
                          <tr>
                            <th scope="row">شماره پته:</th>
                            <td>{refDoc.pettehNumber}</td>
                          </tr>
                        )}
                        {refDoc.refType === "havale" && refDoc.havaleNumber && (
                          <tr>
                            <th scope="row">شماره حواله:</th>
                            <td>{refDoc.havaleNumber}</td>
                          </tr>
                        )}
                        {refDoc.refType === "production" && refDoc.productionNumber && (
                          <tr>
                            <th scope="row">شماره اظهار:</th>
                            <td>{refDoc.productionNumber}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </CardBody>
                </Card>
              </Col>
            )}
          </Row>

          {hasDriverOrPlateData() && (
            <Card className="receipt-card mb-3">
              <CardBody>
                <h6 className="section-title">
                  <i className="ri-truck-line me-2" aria-hidden="true"></i>
                  اطلاعات خودرو و راننده
                </h6>
                <Row>
                  {driver && (driver.name || driver.nationalId || driver.birthDate) && (
                    <Col md={hasPlateData(plate) ? 6 : 12}>
                      <table className="detail-table" role="table" aria-label="اطلاعات راننده">
                        <tbody>
                          {driver.name && (
                            <tr>
                              <th scope="row">نام راننده:</th>
                              <td>{driver.name}</td>
                            </tr>
                          )}
                          {driver.nationalId && (
                            <tr>
                              <th scope="row">کد ملی:</th>
                              <td>{driver.nationalId}</td>
                            </tr>
                          )}
                          {driver.birthDate && (
                            <tr>
                              <th scope="row">تاریخ تولد:</th>
                              <td>{formatDate(driver.birthDate)}</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </Col>
                  )}
                  
                  {hasPlateData(plate) && (
                    <Col md={driver && (driver.name || driver.nationalId || driver.birthDate) ? 6 : 12}>
                      <table className="detail-table" role="table" aria-label="اطلاعات پلاک">
                        <tbody>
                          <tr>
                            <th scope="row">شماره پلاک:</th>
                            <td>
                              {/* ✅ PlateDisplay کامپوننت جدید - کاملاً هماهنگ */}
                              <PlateDisplay 
                                plateData={plate}
                                aria-label={`پلاک خودرو: ${plate?.left2 || ''}${plate?.letter || ''}${plate?.middle3 || ''}${plate?.right2 || ''}`}
                              />
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </Col>
                  )}
                </Row>
              </CardBody>
            </Card>
          )}

          <Card className="receipt-card mb-3">
            <CardBody>
              <h6 className="section-title">
                <i className="ri-inbox-line me-2" aria-hidden="true"></i>
                اقلام کالا
                <Badge color="primary" className="ms-2">
                  {receipt.items?.length || 0} قلم
                </Badge>
              </h6>

              <div className="table-responsive">
                <Table 
                  className={`${tableClass} table-bordered table-sm mb-0`} 
                  role="table"
                  aria-label="جدول اقلام کالا"
                >
                  <thead>
                    <tr>
                      {activeColumns.map((column) => (
                        <th
                          key={column.key}
                          scope="col"
                          className={column.className}
                          style={column.width ? { width: column.width } : {}}
                          aria-label={column.label}
                        >
                          {column.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {receipt.items && receipt.items.length > 0 ? (
                      <>
                        {receipt.items.map((item, index) => (
                          <tr key={item.id || index}>
                            {activeColumns.map((column) => (
                              <td
                                key={column.key}
                                className={column.className}
                                style={column.width ? { width: column.width } : {}}
                              >
                                {column.key === "rowNumber"
                                  ? index + 1
                                  : getCellValue(item, column)}
                              </td>
                            ))}
                          </tr>
                        ))}
                        <tr className="table-success fw-bold">
                          {activeColumns.map((column) => {
                            const total = getColumnTotal(column, receipt.items);
                            return (
                              <td
                                key={column.key}
                                className={column.className}
                                style={column.width ? { width: column.width } : {}}
                              >
                                {column.key === "rowNumber"
                                  ? "جمع کل"
                                  : total !== null
                                  ? formatNumber(total)
                                  : ""}
                              </td>
                            );
                          })}
                        </tr>
                      </>
                    ) : (
                      <tr>
                        <td colSpan={columnCount} className="text-center text-muted py-4">
                          اطلاعاتی برای نمایش وجود ندارد
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
            </CardBody>
          </Card>

          <Row>
            <Col md={6} className="mb-3">
              <Card className="receipt-card h-100">
                <CardBody>
                  <h6 className="section-title">
                    <i className="ri-money-dollar-circle-line me-2" aria-hidden="true"></i>
                    اطلاعات مالی
                  </h6>
                  {finance ? (
                    <>
                      <table className="detail-table" role="table" aria-label="اطلاعات مالی">
                        <tbody>
                          {finance.loadCost > 0 && (
                            <tr>
                              <th scope="row">هزینه بارگیری:</th>
                              <td>{formatNumber(finance.loadCost)} ریال</td>
                            </tr>
                          )}
                          {finance.unloadCost > 0 && (
                            <tr>
                              <th scope="row">هزینه باراندازی:</th>
                              <td>{formatNumber(finance.unloadCost)} ریال</td>
                            </tr>
                          )}
                          {finance.warehouseCost > 0 && (
                            <tr>
                              <th scope="row">هزینه انبارداری:</th>
                              <td>{formatNumber(finance.warehouseCost)} ریال</td>
                            </tr>
                          )}
                          {finance.tax > 0 && (
                            <tr>
                              <th scope="row">مالیات:</th>
                              <td>{formatNumber(finance.tax)} ریال</td>
                            </tr>
                          )}
                          {finance.returnFreight > 0 && (
                            <tr>
                              <th scope="row">کرایه برگشت:</th>
                              <td>{formatNumber(finance.returnFreight)} ریال</td>
                            </tr>
                          )}
                          {finance.loadingFee > 0 && (
                            <tr>
                              <th scope="row">حق بارگیری:</th>
                              <td>{formatNumber(finance.loadingFee)} ریال</td>
                            </tr>
                          )}
                          {finance.miscCost > 0 && (
                            <tr>
                              <th scope="row">هزینه متفرقه:</th>
                              <td>{formatNumber(finance.miscCost)} ریال</td>
                            </tr>
                          )}
                          {finance.miscDescription && (
                            <tr>
                              <th scope="row">شرح متفرقه:</th>
                              <td>{finance.miscDescription}</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                      <div className="total-section mt-3" role="contentinfo">
                        <div className="total-row">
                          <span className="fw-bold">جمع کل:</span>
                          <strong className="text-success fs-5">
                            {formatNumber(calculateTotalCost(finance))} ریال
                          </strong>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-muted text-center py-3" role="status">
                      اطلاعات مالی ثبت نشده است
                    </div>
                  )}
                </CardBody>
              </Card>
            </Col>

            <Col md={6} className="mb-3">
              <Card className="receipt-card h-100">
                <CardBody>
                  <h6 className="section-title">
                    <i className="ri-bank-card-line me-2" aria-hidden="true"></i>
                    اطلاعات پرداخت
                  </h6>
                  {payment ? (
                    <table className="detail-table" role="table" aria-label="اطلاعات پرداخت">
                      <tbody>
                        {payment.paymentBy && (
                          <tr>
                            <th scope="row">پرداخت توسط:</th>
                            <td>
                              <Badge
                                color={
                                  payment.paymentBy === "cash"
                                    ? "success"
                                    : payment.paymentBy === "warehouse"
                                    ? "info"
                                    : "secondary"
                                }
                              >
                                {payment.paymentBy === "cash"
                                  ? "نقد"
                                  : payment.paymentBy === "warehouse"
                                  ? "انبار"
                                  : payment.paymentBy}
                              </Badge>
                            </td>
                          </tr>
                        )}
                        {payment.cardNumber && (
                          <tr>
                            <th scope="row">شماره کارت:</th>
                            <td>{payment.cardNumber}</td>
                          </tr>
                        )}
                        {payment.accountNumber && (
                          <tr>
                            <th scope="row">شماره حساب:</th>
                            <td>{payment.accountNumber}</td>
                          </tr>
                        )}
                        {payment.bankName && (
                          <tr>
                            <th scope="row">نام بانک:</th>
                            <td>{payment.bankName}</td>
                          </tr>
                        )}
                        {payment.ownerName && (
                          <tr>
                            <th scope="row">صاحب حساب:</th>
                            <td>{payment.ownerName}</td>
                          </tr>
                        )}
                        {payment.trackingCode && (
                          <tr>
                            <th scope="row">کد پیگیری:</th>
                            <td>{payment.trackingCode}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  ) : (
                    <div className="text-muted text-center py-3" role="status">
                      اطلاعات پرداخت ثبت نشده است
                    </div>
                  )}
                </CardBody>
              </Card>
            </Col>
          </Row>

          <div className="receipt-footer">
            <div className="footer-left" aria-label="لینک رسید">
              {getReceiptUrl()}
            </div>
            <div className="footer-right">1/1</div>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default ReceiptView;
