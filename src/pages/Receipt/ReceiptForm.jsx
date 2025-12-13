import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Card,
  CardBody,
  Button,
  Spinner,
  Row,
  Col,
  Input,
  Label,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "reactstrap";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { post, get, del } from "../../helpers/api_helper";

// --- Components ---
import DatePickerWithIcon from "../../components/Shared/DatePickerWithIcon";
import ReceiptOwnerSection from "../../components/Receipt/ReceiptOwnerSection";
import ReceiptHeader from "../../components/Receipt/ReceiptHeader";
import ReceiptRefSection from "../../components/Receipt/ReceiptRefSection";
import ReceiptItemsTable from "../../components/Receipt/ReceiptItemsTable";
import ReceiptPaymentSection from "../../components/Receipt/ReceiptPaymentSection";

// --- Print Component ---
// Ensure this path is correct based on your project structure
import ReceiptPrintTemplate from "../../components/Prints/ReceiptPrint"; 

/* =========================================================
   Utils
========================================================= */
const fixDate = (d) => {
  if (!d) return null;
  if (typeof d === "string") return d;
  if (d?.toDate) return d.toDate().toISOString();
  return null;
};

/* =========================================================
   Main Component: ReceiptForm
========================================================= */
export default function ReceiptForm({ mode = "create" }) {
  const navigate = useNavigate();
  const { id } = useParams();

  /* Prevent double load in StrictMode */
  const loadedRef = useRef(false);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Receipt State
  const [receiptId, setReceiptId] = useState(null);
  const [receiptNo, setReceiptNo] = useState(null);
  const [isFinal, setIsFinal] = useState(false);

  const [showSuccessModal, setShowSuccessModal] = useState(false);

  /* ---------------- Form State ---------------- */
  const [form, setForm] = useState({
    docDate: null,
    trackingCode: "",

    owner: {},
    deliverer: {},

    header: {
      driver: {},
      plate: {},
      birthDateDriver: null,
      dischargeDate: null,
    },

    ref: {
      type: "none",
      barnamehNumber: "",
      barnamehDate: null,
      barnamehTracking: "",
      pettehNumber: "",
      havaleNumber: "",
      productionNumber: "",
    },

    items: [],

    payment: {
      paymentBy: "customer",
      info: {},
    },
  });

  const disabled = isFinal || mode === "view";

  /* =========================================================
     Load Receipt (EDIT Mode)
  ========================================================= */
  useEffect(() => {
    if (mode !== "edit" || !id || loadedRef.current) return;
    loadedRef.current = true;

    const load = async () => {
      setLoading(true);
      try {
        const res = await get(`/receipts/${id}`);
        const r = res.data;

        setReceiptId(r.id);
        setReceiptNo(r.receipt_no);
        setIsFinal(r.status === "final");

        setForm({
          docDate: r.doc_date,
          trackingCode: r.tracking_code,

          owner: { id: r.owner_id, name: r.owner_name },
          deliverer: r.deliverer_id ? { id: r.deliverer_id } : {},

          header: {
            driver: {
              name: r.driver_name,
              nationalId: r.driver_national_id,
              phone: r.driver_phone,
            },
            plate: {
              right2: r.plate_iran_right,
              middle3: r.plate_mid3,
              letter: r.plate_letter,
              left2: r.plate_left2,
            },
            birthDateDriver: r.driver_birth_date,
            dischargeDate: r.discharge_date,
          },

          ref: {
            type: r.ref_type,
            barnamehNumber: r.ref_barnameh_number,
            barnamehDate: r.ref_barnameh_date,
            barnamehTracking: r.ref_barnameh_tracking,
            pettehNumber: r.ref_petteh_number,
            havaleNumber: r.ref_havale_number,
            productionNumber: r.ref_production_number,
          },

          items: r.receipt_items || [],

          payment: {
            paymentBy: r.payment_by,
            info: {
              cardNumber: r.card_number,
              accountNumber: r.account_number,
              bankName: r.bank_name,
              ownerName: r.payment_owner_name,
            },
          },
        });
      } catch (err) {
        console.error(err);
        toast.error("خطا در بارگذاری اطلاعات رسید");
      }
      setLoading(false);
    };

    load();
  }, [mode, id]);

  /* =========================================================
     Validation
  ========================================================= */
  const validate = () => {
    if (!form.docDate) {
      toast.error("تاریخ سند الزامی است");
      return false;
    }
    if (!form.owner.id) {
      toast.error("مالک را انتخاب کنید");
      return false;
    }
    if (!form.items.length) {
      toast.error("حداقل یک آیتم لازم است");
      return false;
    }
    return true;
  };

  /* =========================================================
     Handlers
  ========================================================= */
  const handleItemsChange = useCallback((items) => {
    setForm((prev) => {
      if (prev.items === items) return prev;
      return { ...prev, items };
    });
  }, []);

  /* =========================================================
     Save Logic
  ========================================================= */
  const saveReceipt = async (status) => {
    if (!validate()) return;
    setSaving(true);

    const payload = {
      status,
      doc_type_id: 1,
      doc_date: fixDate(form.docDate),
      tracking_code: form.trackingCode,

      owner_id: form.owner.id,
      deliverer_id: form.deliverer.id || null,

      driver_name: form.header.driver.name,
      driver_national_id: form.header.driver.nationalId,
      driver_phone: form.header.driver.phone,
      driver_birth_date: fixDate(form.header.birthDateDriver),
      discharge_date: fixDate(form.header.dischargeDate),

      plate_iran_right: form.header.plate.right2,
      plate_mid3: form.header.plate.middle3,
      plate_letter: form.header.plate.letter,
      plate_left2: form.header.plate.left2,

      ref_type: form.ref.type,
      ref_barnameh_number: form.ref.barnamehNumber,
      ref_barnameh_date: fixDate(form.ref.barnamehDate),
      ref_barnameh_tracking: form.ref.barnamehTracking,
      ref_petteh_number: form.ref.pettehNumber,
      ref_havale_number: form.ref.havaleNumber,
      ref_production_number: form.ref.productionNumber,

      payment_by: form.payment.paymentBy,
      ...form.payment.info,

      items: form.items,
    };

    try {
      const res = await post("/receipts/create-with-items", payload);

      setReceiptId(res.receipt_id);
      setReceiptNo(res.receipt_no);

      if (status === "final") {
        setIsFinal(true);
        setShowSuccessModal(true);
      } else {
        toast.success(`رسید موقت شماره ${res.receipt_no} ذخیره شد`);
        if (!id) {
            navigate(`/receipts/${res.receipt_id}`, { replace: true });
        }
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "خطا در ثبت رسید");
    }

    setSaving(false);
  };

  /* =========================================================
     Delete Logic
  ========================================================= */
  const deleteReceipt = async () => {
    if (!window.confirm("آیا از حذف رسید مطمئن هستید؟")) return;
    try {
      await del(`/receipts/${receiptId}`);
      toast.success("رسید حذف شد");
      navigate("/receipts");
    } catch {
      toast.error("این رسید حواله خورده و قابل حذف نیست");
    }
  };

  /* =========================================================
     Render
  ========================================================= */
  if (loading) {
    return (
      <div className="p-5 text-center">
        <Spinner /> در حال بارگذاری...
      </div>
    );
  }

  return (
    <>
      {/* ✅ 1. Print Component OUTSIDE of .page-content 
        This is crucial because .page-content is hidden during print 
        via the .no-print class or specific print media queries.
      */}
      <ReceiptPrintTemplate 
        form={{ ...form, isFinal }} 
        receiptNo={receiptNo} 
      />

      {/* ✅ 2. Main Page Content 
        This container holds the regular form UI.
      */}
      <div className="page-content">
        
        <Card className="shadow-sm no-print">
          <CardBody>

            {/* Row 1: Date, Number, Tracking Code */}
            <Row className="mb-4">
              <Col md={4}>
                <Label>تاریخ سند *</Label>
                <DatePickerWithIcon
                  value={form.docDate}
                  disabled={disabled}
                  onChange={(v) => setForm((p) => ({ ...p, docDate: v }))}
                />
              </Col>

              {(mode === "edit" || receiptNo) && (
                <Col md={4}>
                  <Label>شماره رسید</Label>
                  <Input disabled value={receiptNo || "---"} />
                </Col>
              )}

              <Col md={4}>
                <Label>کد عطف</Label>
                <Input
                  disabled={disabled}
                  value={form.trackingCode}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, trackingCode: e.target.value }))
                  }
                />
              </Col>
            </Row>

            {/* Sections */}
            <ReceiptOwnerSection
              disabled={disabled}
              value={{ owner: form.owner, deliverer: form.deliverer }}
              onChange={(v) => setForm((p) => ({ ...p, ...v }))}
            />

            <ReceiptRefSection
              disabled={disabled}
              refType={form.ref.type}
              setRefType={(v) =>
                setForm((p) => ({ ...p, ref: { ...p.ref, type: v } }))
              }
              refValues={form.ref}
              updateRefValue={(k, v) =>
                setForm((p) => ({ ...p, ref: { ...p.ref, [k]: v } }))
              }
            />

            <ReceiptHeader
              disabled={disabled}
              value={form.header}
              onChange={(v) => setForm((p) => ({ ...p, header: v }))}
            />

            <ReceiptItemsTable
              ownerId={form.owner.id}
              disabled={disabled}
              initialItems={form.items}
              onItemsChange={handleItemsChange}
            />

            <ReceiptPaymentSection
              disabled={disabled}
              value={form.payment}
              onChange={(v) => setForm((p) => ({ ...p, payment: v }))}
            />

            {/* Action Buttons */}
            <div className="d-flex gap-2 mt-4 pt-3 border-top">
              <Button color="secondary" outline onClick={() => navigate("/receipts")}>
                بازگشت به لیست
              </Button>

              {!isFinal && (
                <>
                  <Button 
                    color="warning" 
                    disabled={saving} 
                    onClick={() => saveReceipt("draft")}
                  >
                    {saving ? <Spinner size="sm"/> : "ثبت موقت"}
                  </Button>
                  
                  <Button 
                    color="success" 
                    disabled={saving} 
                    onClick={() => saveReceipt("final")}
                  >
                    {saving ? <Spinner size="sm"/> : "ثبت قطعی"}
                  </Button>

                  {mode === "edit" && receiptId && (
                    <Button color="danger" outline onClick={deleteReceipt}>
                      حذف رسید
                    </Button>
                  )}
                </>
              )}

              {/* Print Button */}
              {(receiptNo || isFinal) && (
                <Button color="primary" className="ms-auto" onClick={() => window.print()}>
                  <i className="bx bx-printer me-2 align-middle"></i>
                  چاپ رسید
                </Button>
              )}
            </div>

          </CardBody>
        </Card>

        {/* Success Modal (no-print) */}
        <Modal 
          isOpen={showSuccessModal} 
          backdrop="static" 
          keyboard={false} 
          className="no-print"
          centered
        >
          <ModalHeader toggle={() => setShowSuccessModal(false)}>ثبت موفق</ModalHeader>
          <ModalBody className="text-center py-4">
            <div className="mb-3 text-success">
              <i className="bx bx-check-circle display-1"></i>
            </div>
            <h5>رسید شماره <b>{receiptNo}</b> با موفقیت ثبت شد</h5>
            <p className="text-muted mt-2">
              این رسید اکنون نهایی شده و قابل ویرایش نیست.
            </p>
          </ModalBody>
          <ModalFooter className="justify-content-center">
            <Button color="secondary" onClick={() => navigate("/receipts")}>
              لیست رسیدها
            </Button>
            <Button color="primary" onClick={() => window.print()}>
              <i className="bx bx-printer me-1"></i> چاپ رسید
            </Button>
          </ModalFooter>
        </Modal>
      </div>
    </>
  );
}