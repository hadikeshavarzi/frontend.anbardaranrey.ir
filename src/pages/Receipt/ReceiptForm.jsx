// src/pages/Receipt/ReceiptForm.jsx
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
  Alert,
  Badge
} from "reactstrap";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { supabase } from "../../helpers/supabase"; // ✅ اتصال مستقیم

// --- Components ---
import DatePickerWithIcon from "../../components/Shared/DatePickerWithIcon";
import ReceiptOwnerSection from "../../components/Receipt/ReceiptOwnerSection";
import ReceiptHeader from "../../components/Receipt/ReceiptHeader";
import ReceiptRefSection from "../../components/Receipt/ReceiptRefSection";
import ReceiptItemsTable from "../../components/Receipt/ReceiptItemsTable";
import ReceiptPaymentSection from "../../components/Receipt/ReceiptPaymentSection";
import ReceiptPrintTemplate from "../../components/Prints/ReceiptPrint"; 

/* =========================================================
   Utils
========================================================= */
const fixDate = (d) => {
  if (!d) return null;
  if (typeof d === "string") return d;
  if (d?.toDate) return d.toDate().toISOString();
  if (d instanceof Date) return d.toISOString();
  return null;
};

/* =========================================================
   Main Component: ReceiptForm
========================================================= */
export default function ReceiptForm({ mode = "create" }) {
  const navigate = useNavigate();
  const { id } = useParams();

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
    docDate: new Date().toISOString(),
    trackingCode: "",
    owner: { id: null, name: "" },
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
      Load Receipt (Supabase Direct)
  ========================================================= */
  useEffect(() => {
    if ((mode !== "edit" && mode !== "view") || !id) return;
    if (loadedRef.current) return;
    loadedRef.current = true;

    const load = async () => {
      setLoading(true);
      try {
        console.log(`📥 Loading Receipt ID: ${id} via Supabase...`);
        
        const { data: r, error } = await supabase
            .from('receipts')
            .select(`
                *,
                owner:customers!fk_receipts_customer ( id, name, mobile ),
                items:receipt_items!fk_items_receipt ( * )
            `)
            .eq('id', id)
            .single();

        if (error) throw error;

        setReceiptId(r.id);
        setReceiptNo(r.receipt_no);
        setIsFinal(r.status === "final");

        setForm({
          docDate: r.doc_date,
          trackingCode: r.tracking_code,
          owner: { id: r.owner_id, name: r.owner?.name || "ناشناس" },
          deliverer: r.deliverer_id ? { id: r.deliverer_id, name: r.deliverer_name } : {},
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
            type: r.ref_type || "none",
            barnamehNumber: r.ref_barnameh_number,
            barnamehDate: r.ref_barnameh_date,
            barnamehTracking: r.ref_barnameh_tracking,
            pettehNumber: r.ref_petteh_number,
            havaleNumber: r.ref_havale_number,
            productionNumber: r.ref_production_number,
          },
          items: r.items || [],
          payment: {
            paymentBy: r.payment_by || "customer",
            info: {
              cardNumber: r.card_number,
              accountNumber: r.account_number,
              bankName: r.bank_name,
              ownerName: r.payment_owner_name,
            },
          },
        });
      } catch (err) {
        console.error("Load Error:", err);
        toast.error("خطا در دریافت اطلاعات: " + err.message);
        navigate("/receipts");
      }
      setLoading(false);
    };

    load();
  }, [mode, id, navigate]);

  /* =========================================================
      Validation & Handlers
  ========================================================= */
  const validate = () => {
    if (!form.docDate) { toast.error("تاریخ سند الزامی است"); return false; }
    if (!form.owner.id) { toast.error("مالک را انتخاب کنید"); return false; }
    if (!form.items.length) { toast.error("حداقل یک آیتم لازم است"); return false; }
    return true;
  };

  const handleItemsChange = useCallback((items) => {
    setForm((prev) => {
      if (prev.items === items) return prev;
      return { ...prev, items };
    });
  }, []);

  /* =========================================================
      Save Logic (RPC Calls)
  ========================================================= */
  const saveReceipt = async (targetStatus) => {
    if (!validate()) return;
    setSaving(true);

    const payload = {
      status: targetStatus,
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
      member_id: 1 // کاربر لاگین شده (فعلاً ثابت)
    };

    try {
      let resData;
      
      if (mode === "edit" && receiptId) {
          // ✅ UPDATE
          const { data, error } = await supabase.rpc('update_receipt_with_items', {
              p_receipt_id: Number(receiptId),
              p_payload: payload
          });

          if (error) throw error;
          resData = data;
          
          if (targetStatus === "final") {
              setIsFinal(true);
              setShowSuccessModal(true);
          } else {
              toast.success(`تغییرات رسید ${receiptNo} با موفقیت ثبت شد`);
          }
      } else {
          // ✅ CREATE
          const { data, error } = await supabase.rpc('create_receipt_with_items', {
              p_payload: payload
          });

          if (error) throw error;
          resData = data;
          
          setReceiptId(resData.receipt_id);
          setReceiptNo(resData.receipt_no);
          
          if (targetStatus === "final") {
              setIsFinal(true);
              setShowSuccessModal(true);
          } else {
              toast.success(`رسید جدید ایجاد شد`);
              navigate(`/receipt/form/edit/${resData.receipt_id}`, { replace: true });
          }
      }

    } catch (err) {
      console.error("Save Error:", err);
      toast.error(err.message || "خطا در ذخیره اطلاعات");
    }

    setSaving(false);
  };

  const deleteReceipt = async () => {
    if (!window.confirm("آیا از حذف مطمئن هستید؟")) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('receipts')
        .delete()
        .eq('id', receiptId);

      if (error) throw error;

      toast.success("حذف شد");
      navigate("/receipts");
    } catch (err) {
      toast.error(err.message || "خطا در حذف");
    }
    setSaving(false);
  };

  /* =========================================================
      Render
  ========================================================= */
  if (loading) return <div className="p-5 text-center"><Spinner /></div>;

  return (
    <>
      <ReceiptPrintTemplate form={{ ...form, isFinal }} receiptNo={receiptNo} />
      <div className="page-content">
        {isFinal && (
            <Alert color="warning" className="no-print">
                <strong>رسید نهایی شده است.</strong> امکان ویرایش وجود ندارد.
            </Alert>
        )}
        <Card className="shadow-sm no-print">
          <CardBody>
            <div className="d-flex justify-content-between mb-4 pb-3 border-bottom">
                <h4 className="card-title mb-0">{mode === 'create' ? 'ثبت رسید' : `ویرایش رسید ${receiptNo}`}</h4>
                {receiptNo && <Badge color={isFinal ? "success" : "warning"}>{isFinal ? "نهایی" : "پیش‌نویس"}</Badge>}
            </div>

            <Row className="mb-4">
              <Col md={4}>
                <Label>تاریخ سند <span className="text-danger">*</span></Label>
                <DatePickerWithIcon value={form.docDate} disabled={disabled} onChange={(v) => setForm((p) => ({ ...p, docDate: v }))} />
              </Col>
              <Col md={4}><Label>شماره رسید</Label><Input disabled value={receiptNo || "---"} className="bg-light" /></Col>
              <Col md={4}><Label>کد عطف</Label><Input disabled={disabled} value={form.trackingCode} onChange={(e) => setForm((p) => ({ ...p, trackingCode: e.target.value }))} /></Col>
            </Row>

            <ReceiptOwnerSection disabled={disabled} value={{ owner: form.owner, deliverer: form.deliverer }} onChange={(v) => setForm((p) => ({ ...p, ...v }))} />
            <ReceiptRefSection disabled={disabled} refType={form.ref.type} setRefType={(v) => setForm((p) => ({ ...p, ref: { ...p.ref, type: v } }))} refValues={form.ref} updateRefValue={(k, v) => setForm((p) => ({ ...p, ref: { ...p.ref, [k]: v } }))} />
            <ReceiptHeader disabled={disabled} value={form.header} onChange={(v) => setForm((p) => ({ ...p, header: v }))} />
            
            <ReceiptItemsTable ownerId={form.owner.id} disabled={disabled} initialItems={form.items} onItemsChange={handleItemsChange} />

            <ReceiptPaymentSection disabled={disabled} value={form.payment} onChange={(v) => setForm((p) => ({ ...p, payment: v }))} />

            <div className="d-flex gap-2 mt-4 pt-3 border-top">
              <Button color="secondary" outline onClick={() => navigate("/receipts")}>بازگشت</Button>
              {!isFinal && (
                <>
                  {/* ✅ دکمه هوشمند: در حالت ادیت "ثبت تغییرات" نشان می‌دهد */}
                  <Button color="warning" disabled={saving} onClick={() => saveReceipt("draft")}>
                    {saving ? <Spinner size="sm"/> : (mode === 'edit' ? "ثبت تغییرات" : "ذخیره موقت")}
                  </Button>
                  
                  <Button color="success" disabled={saving} onClick={() => saveReceipt("final")}>
                    {saving ? <Spinner size="sm"/> : "ثبت نهایی"}
                  </Button>

                  {mode === "edit" && receiptId && <Button color="danger" outline onClick={deleteReceipt} disabled={saving}>حذف</Button>}
                </>
              )}
              {receiptNo && <Button color="primary" className="ms-auto" onClick={() => window.print()}>چاپ</Button>}
            </div>
          </CardBody>
        </Card>

        {/* ✅ مودال موفقیت */}
        <Modal isOpen={showSuccessModal} centered backdrop="static" className="no-print">
          <ModalHeader toggle={() => setShowSuccessModal(false)}>
             {isFinal ? "ثبت نهایی موفق" : "عملیات موفق"}
          </ModalHeader>
          <ModalBody className="text-center py-4">
            <div className="text-success mb-3"><i className="bx bx-check-circle display-1"></i></div>
            <h5>رسید <b>{receiptNo}</b> با موفقیت {isFinal ? "نهایی شد" : "ویرایش شد"}</h5>
          </ModalBody>
          <ModalFooter className="justify-content-center">
            <Button color="secondary" onClick={() => navigate("/receipts")}>لیست رسیدها</Button>
            <Button color="primary" onClick={() => { setShowSuccessModal(false); window.print(); }}>چاپ</Button>
          </ModalFooter>
        </Modal>
      </div>
    </>
  );
}