import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Card, CardBody, Button, Spinner, Row, Col, Input, Label,
  Modal, ModalHeader, ModalBody, ModalFooter, Alert, Badge
} from "reactstrap";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { supabase } from "../../helpers/supabase";

// --- Services ---
import { getCashes, getBanks, registerReceiptFinancialDoc, findTafsiliByRefId } from "../../services/treasuryService";

// --- Components ---
import DatePickerWithIcon from "../../components/Shared/DatePickerWithIcon";
import ReceiptOwnerSection from "../../components/Receipt/ReceiptOwnerSection";
import ReceiptHeader from "../../components/Receipt/ReceiptHeader";
import ReceiptRefSection from "../../components/Receipt/ReceiptRefSection";
import ReceiptItemsTable from "../../components/Receipt/ReceiptItemsTable";
import ReceiptPaymentSection from "../../components/Receipt/ReceiptPaymentSection";
import ReceiptCosts from "../../components/Receipt/ReceiptCosts";
import ReceiptPrintTemplate from "../../components/Prints/ReceiptPrint";

// تابع کمکی برای فرمت تاریخ جهت ارسال به دیتابیس
const fixDate = (d) => {
  if (!d) return null;
  if (typeof d === "string") return d;
  if (d?.toDate) return d.toDate().toISOString();
  if (d instanceof Date) return d.toISOString();
  return null;
};

export default function ReceiptForm({ mode = "create" }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const loadedRef = useRef(false);

  // =========================================================================
  // 1. State & Hooks
  // =========================================================================
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [receiptId, setReceiptId] = useState(null);
  const [receiptNo, setReceiptNo] = useState(null);
  const [isFinal, setIsFinal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [sourceOptions, setSourceOptions] = useState([]);

  const [form, setForm] = useState({
    docDate: new Date().toISOString(),
    trackingCode: "",
    owner: { id: null, tafsiliId: null, name: "", nationalId: "", mobile: "", birthDate: null },
    deliverer: { id: null, name: "", nationalId: "" },
    header: {
      driver: { name: "", nationalId: "", phone: "" },
      plate: { right2: "", middle3: "", letter: "ع", left2: "" },
      birthDateDriver: null,
      dischargeDate: null,
    },
    ref: {
      type: "none",
      barnamehNumber: "", barnamehDate: null, barnamehTracking: "",
      pettehNumber: "", havaleNumber: "", productionNumber: "",
    },
    items: [],
    costs: {
      loadCost: 0, unloadCost: 0, warehouseCost: 0, tax: 0,
      returnFreight: 0, loadingFee: 0, miscCost: 0, miscDescription: ""
    },
    payment: {
      paymentBy: "customer",
      info: {
        amount: "", selectedSource: null, cardNumber: "",
        accountNumber: "", bankName: "", ownerName: "", trackingCode: ""
      },
    },
  });

  const disabled = isFinal || mode === "view";

  // ✅ دریافت آیتم‌ها از جدول
  const handleItemsChange = useCallback((items) => {
    setForm(p => ({ ...p, items }));
  }, []);

  // --- Load Sources (Banks/Cashes) ---
  useEffect(() => {
    const loadSources = async () => {
      try {
        const cashes = await getCashes();
        const banks = await getBanks();
        const opts = [
          {
            label: "صندوق‌ها",
            options: cashes.map(c => ({ value: c.id, label: `صندوق: ${c.title}`, type: 'cash', tafsili_id: c.accounting_tafsili?.id || c.tafsili_id }))
          },
          {
            label: "بانک‌ها",
            options: banks.map(b => ({ value: b.id, label: `بانک: ${b.bank_name}`, type: 'bank', tafsili_id: b.accounting_tafsili?.id || b.tafsili_id }))
          }
        ];
        setSourceOptions(opts);
      } catch (e) { console.error("Error loading sources:", e); }
    };
    loadSources();
  }, []);

  // --- Load Receipt Data (Edit Mode) ---
  useEffect(() => {
    if ((mode !== "edit" && mode !== "view") || !id) return;
    if (loadedRef.current) return;
    loadedRef.current = true;

    const load = async () => {
      setLoading(true);
      try {
        const { data: r, error } = await supabase
            .from('receipts')
            .select(`
                        *,
                        owner:customers!fk_receipts_customer ( id, name, mobile, national_id ),
                        items:receipt_items!fk_items_receipt ( * )
                    `)
            .eq('id', id)
            .single();

        if (error) throw error;

        setReceiptId(r.id);
        setReceiptNo(r.receipt_no);
        setIsFinal(r.status === "final");

        // بازسازی آبجکت منبع پرداخت
        let loadedSource = null;
        if (r.payment_source_id) {
          let sourceLabel = "منبع ذخیره شده";
          if(r.payment_source_type === 'cash'){
            const { data: c } = await supabase.from('treasury_cashes').select('title').eq('id', r.payment_source_id).maybeSingle();
            if(c) sourceLabel = `صندوق: ${c.title}`;
          } else if(r.payment_source_type === 'bank'){
            const { data: b } = await supabase.from('treasury_banks').select('bank_name').eq('id', r.payment_source_id).maybeSingle();
            if(b) sourceLabel = `بانک: ${b.bank_name}`;
          }
          loadedSource = { value: r.payment_source_id, label: sourceLabel, type: r.payment_source_type };
        }

        setForm({
          docDate: r.doc_date,
          trackingCode: r.tracking_code,
          owner: {
            id: r.owner_id,
            name: r.owner?.name || "",
            nationalId: r.owner?.national_id,
            mobile: r.owner?.mobile
          },
          deliverer: { id: r.deliverer_id, name: r.deliverer_name, nationalId: r.deliverer_national_id },
          header: {
            driver: { name: r.driver_name, nationalId: r.driver_national_id, phone: r.driver_phone },
            plate: { right2: r.plate_iran_right, middle3: r.plate_mid3, letter: r.plate_letter, left2: r.plate_left2 },
            birthDateDriver: r.driver_birth_date, dischargeDate: r.discharge_date,
          },
          ref: {
            type: r.ref_type || "none",
            barnamehNumber: r.ref_barnameh_number, barnamehDate: r.ref_barnameh_date, barnamehTracking: r.ref_barnameh_tracking,
            pettehNumber: r.ref_petteh_number, havaleNumber: r.ref_havale_number, productionNumber: r.ref_production_number,
          },
          items: r.items || [],
          costs: {
            loadCost: r.cost_load || 0,
            unloadCost: r.cost_unload || 0,
            warehouseCost: r.cost_warehouse || 0,
            tax: r.cost_tax || 0,
            returnFreight: r.cost_return_freight || 0,
            loadingFee: r.cost_loading_fee || 0,
            miscCost: r.cost_misc || 0,
            miscDescription: r.cost_misc_desc || ""
          },
          payment: {
            paymentBy: r.payment_by || "customer",
            info: {
              amount: r.payment_amount ? r.payment_amount.toString() : "",
              selectedSource: loadedSource,
              cardNumber: r.card_number, accountNumber: r.account_number, bankName: r.bank_name,
              ownerName: r.payment_owner_name, trackingCode: r.payment_tracking_code
            },
          },
        });
      } catch (err) {
        console.error("Load Error:", err);
        toast.error(err.message);
        navigate("/receipts");
      }
      setLoading(false);
    };
    load();
  }, [mode, id, navigate]);

  // =========================================================================
  // 2. Logic (Validate, Save)
  // =========================================================================

  const validate = () => {
    if (!form.docDate) { toast.error("تاریخ سند الزامی است"); return false; }
    if (!form.owner.id) { toast.error("مالک کالا را انتخاب کنید"); return false; }
    if (!form.items.length) { toast.error("حداقل یک آیتم کالا وارد کنید"); return false; }

    const invalidItem = form.items.find(i => !i.product_id && !i.productId);
    if (invalidItem) {
      toast.error("لطفاً برای تمام ردیف‌ها، «نام کالا» را انتخاب کنید.");
      return false;
    }

    if (form.payment.paymentBy === 'warehouse') {
      if (!form.payment.info.amount) { toast.error("مبلغ پرداختی را وارد کنید"); return false; }
      if (!form.payment.info.selectedSource) { toast.error("منبع پرداخت را انتخاب کنید"); return false; }
    }
    return true;
  };

  const getOrCreateCustomerTafsili = async (customer) => {
    let tafsiliId = await findTafsiliByRefId(customer.id);
    if (tafsiliId) return tafsiliId;
    try {
      const randomCode = Math.floor(100000 + Math.random() * 900000);
      const { data, error } = await supabase.from('accounting_tafsili').insert({
        title: customer.name,
        code: customer.nationalId || randomCode,
        tafsili_type: 'customer',
        ref_id: customer.id,
        is_active: true
      }).select().single();
      if (error) throw error;
      return data.id;
    } catch (err) { return null; }
  };

  const saveReceipt = async (targetStatus) => {
    if (!validate()) return;
    setSaving(true);

    const pInfo = form.payment.info;
    const costs = form.costs;

    // 🟢🟢 بخش حیاتی: آماده‌سازی دقیق آیتم‌ها برای دیتابیس
    // این بخش نام‌های CamelCase را به snake_case تبدیل می‌کند تا در دیتابیس درست بنشینند.
    const cleanItems = form.items.map((item) => {
      const productId = item.product_id || item.productId || item.product?.id || item.product?.value;

      return {
        ...item,
        product_id: productId,

        // اعداد (تعداد و وزن‌ها)
        count: Number(item.count || item.amount || 0), // هم count هم amount را چک می‌کنیم
        weights_full: Number(item.weights_full || 0),
        weights_empty: Number(item.weights_empty || 0),
        weights_net: Number(item.weights_net || 0),
        weights_origin: Number(item.weights_origin || 0),
        weights_diff: Number(item.weights_diff || 0),
        dim_length: Number(item.dim_length || 0),
        dim_width: Number(item.dim_width || 0),
        dim_thickness: Number(item.dim_thickness || 0),

        // متن‌ها (با پشتیبانی از نام‌های مختلف در کامپوننت جدول)
        parent_row: item.parent_row || item.parentRow || "", // ردیف مرجع
        description_notes: item.description_notes || item.description || item.descriptionNotes || "", // توضیحات
        depo_location: item.depo_location || item.depoLocation || "",
        row_code: item.row_code || item.rowCode || "",

        // سایر فیلدها که تغییر نام نداشتند
        heat_number: item.heat_number || "",
        bundle_no: item.bundle_no || "",
        brand: item.brand || "",
        order_no: item.order_no || "",
        national_product_id: item.national_product_id || "",
        product_description: item.product_description || "",
        production_type: item.production_type || "domestic",
        is_used: Boolean(item.is_used),
        is_defective: Boolean(item.is_defective),
      };
    }).filter(item => item.product_id);

    const payload = {
      status: targetStatus,
      doc_type_id: 1,
      doc_date: fixDate(form.docDate),
      tracking_code: form.trackingCode,
      owner_id: form.owner.id,
      owner_name: form.owner.name,
      owner_national_id: form.owner.nationalId,
      owner_mobile: form.owner.mobile,
      deliverer_id: form.deliverer.id || null,
      deliverer_name: form.deliverer.name,
      deliverer_national_id: form.deliverer.nationalId,
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
      cost_load: costs.loadCost,
      cost_unload: costs.unloadCost,
      cost_warehouse: costs.warehouseCost,
      cost_tax: costs.tax,
      cost_return_freight: costs.returnFreight,
      cost_loading_fee: costs.loadingFee,
      cost_misc: costs.miscCost,
      cost_misc_desc: costs.miscDescription,
      payment_by: form.payment.paymentBy,
      payment_amount: pInfo.amount ? Number(pInfo.amount.toString().replace(/,/g, '')) : null,
      payment_source_id: pInfo.selectedSource ? pInfo.selectedSource.value : null,
      payment_source_type: pInfo.selectedSource ? pInfo.selectedSource.type : null,
      card_number: pInfo.cardNumber,
      account_number: pInfo.accountNumber,
      bank_name: pInfo.bankName,
      payment_owner_name: pInfo.ownerName,
      payment_tracking_code: pInfo.trackingCode,

      // ✅ ارسال آیتم‌های تمیز شده
      items: cleanItems,

      member_id: 1
    };

    try {
      let savedReceiptId = receiptId;
      let savedReceiptNo = receiptNo;
      let responseData = null;

      if (mode === "edit" && receiptId) {
        const { data, error } = await supabase.rpc('update_receipt_with_items', {
          p_receipt_id: Number(receiptId),
          p_payload: payload
        });
        if (error) throw error;
        responseData = data;
      } else {
        const { data, error } = await supabase.rpc('create_receipt_with_items', {
          p_payload: payload
        });
        if (error) throw error;
        responseData = data;
      }

      if (!responseData) throw new Error("پاسخی از دیتابیس دریافت نشد.");

      savedReceiptId = responseData.receipt_id;
      savedReceiptNo = responseData.receipt_no;
      setReceiptId(savedReceiptId);
      setReceiptNo(savedReceiptNo);

      if (targetStatus === 'final' && form.payment.paymentBy === 'warehouse') {
        const amount = Number(String(pInfo.amount).replace(/,/g, ''));
        const customerTafsiliId = await getOrCreateCustomerTafsili(form.owner);
        const sourceTafsiliId = pInfo.selectedSource?.tafsili_id;

        if (customerTafsiliId && sourceTafsiliId) {
          await registerReceiptFinancialDoc({
            costs: form.costs,
            paymentAmount: amount,
            date: fixDate(form.docDate),
            customerId: customerTafsiliId,
            sourceId: sourceTafsiliId,
            receiptId: savedReceiptId,
            receiptNo: savedReceiptNo,
            description: `هزینه‌های رسید انبار ${savedReceiptNo} - راننده: ${form.header.driver.name}`
          });
          toast.success("سند حسابداری صادر شد");
        }
      }

      if (targetStatus === "final") {
        setIsFinal(true);
        setShowSuccessModal(true);
      } else if (mode === "create" && !receiptId) {
        toast.success(`رسید ایجاد شد: ${savedReceiptNo}`);
        navigate(`/receipt/form/edit/${savedReceiptId}`, { replace: true });
      } else {
        toast.success("تغییرات ذخیره شد");
      }

    } catch (err) {
      console.error("Save Error:", err);
      toast.error("خطا در ذخیره: " + (err.message || "نامشخص"));
    }
    setSaving(false);
  };

  const deleteReceipt = async () => {
    if (!window.confirm("آیا از حذف مطمئن هستید؟")) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('receipts').delete().eq('id', receiptId);
      if (error) throw error;
      toast.success("حذف شد");
      navigate("/receipts");
    } catch (err) { toast.error(err.message); }
    setSaving(false);
  };

  if (loading) return <div className="p-5 text-center"><Spinner style={{ width: '3rem', height: '3rem' }} /></div>;

  return (
      <>
        <ReceiptPrintTemplate form={{ ...form, isFinal }} receiptNo={receiptNo} />
        <div className="page-content">
          {isFinal && <Alert color="warning" className="no-print"><strong>رسید نهایی شده است.</strong> امکان ویرایش وجود ندارد.</Alert>}

          <Card className="shadow-sm no-print border-0">
            <CardBody className="p-4">
              <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
                <div><h4 className="card-title mb-1 fw-bold text-primary">{mode === 'create' ? 'ثبت رسید جدید' : `ویرایش رسید ${receiptNo || ''}`}</h4><span className="text-muted font-size-12">اطلاعات ورود کالا به انبار</span></div>
                <div className="d-flex gap-2">{receiptNo && <Badge className="p-2 font-size-12" color={isFinal ? "success" : "warning"}>{isFinal ? "نهایی شده" : "پیش‌نویس"}</Badge>}<Button color="light" size="sm" onClick={() => navigate("/receipts")}>بازگشت به لیست</Button></div>
              </div>

              <Row className="mb-4">
                <Col md={3}><Label className="fw-bold">تاریخ رسید <span className="text-danger">*</span></Label><DatePickerWithIcon value={form.docDate} disabled={disabled} onChange={(v) => setForm(p => ({ ...p, docDate: v }))} /></Col>
                <Col md={3}><Label className="fw-bold">شماره رسید</Label><Input disabled value={receiptNo || "---"} className="bg-light text-center fw-bold" /></Col>
                <Col md={3}><Label className="fw-bold">کد عطف / پیگیری</Label><Input disabled={disabled} value={form.trackingCode} onChange={(e) => setForm(p => ({ ...p, trackingCode: e.target.value }))} /></Col>
              </Row>

              <ReceiptOwnerSection value={{ owner: form.owner, deliverer: form.deliverer }} onChange={(v) => setForm(p => ({ ...p, ...v }))} />
              <ReceiptHeader value={form.header} onChange={(v) => setForm(p => ({ ...p, header: v }))} />
              <ReceiptRefSection refType={form.ref.type} setRefType={(v) => setForm(p => ({ ...p, ref: { ...p.ref, type: v } }))} refValues={form.ref} updateRefValue={(k, v) => setForm(p => ({ ...p, ref: { ...p.ref, [k]: v } }))} barnamehDate={form.ref.barnamehDate} setBarnamehDate={(v) => setForm(p => ({ ...p, ref: { ...p.ref, barnamehDate: v } }))} />

              <div className="my-4">
                <ReceiptItemsTable
                    ownerId={form.owner.id}
                    initialItems={form.items}
                    onItemsChange={handleItemsChange}
                />
              </div>

              <Row>
                <Col md={12}><ReceiptCosts value={form.costs} onChange={(v) => setForm(p => ({ ...p, costs: v }))} /></Col>
                <Col md={12}>
                  <ReceiptPaymentSection
                      value={form.payment}
                      onChange={(v) => setForm(p => ({ ...p, payment: v }))}
                      sourceOptions={sourceOptions}
                  />
                </Col>
              </Row>

              <div className="d-flex justify-content-end gap-2 mt-5 pt-3 border-top bg-light p-3 rounded sticky-bottom">
                {!isFinal && (<>{mode === "edit" && receiptId && <Button color="danger" outline onClick={deleteReceipt} disabled={saving}><i className="ri-delete-bin-line me-1"></i> حذف</Button>}<Button color="warning" className="px-4" disabled={saving} onClick={() => saveReceipt("draft")}>{saving ? <Spinner size="sm"/> : <><i className="ri-save-3-line me-1"></i> ذخیره موقت</>}</Button><Button color="success" className="px-4" disabled={saving} onClick={() => saveReceipt("final")}>{saving ? <Spinner size="sm"/> : <><i className="ri-check-double-line me-1"></i> ثبت نهایی</>}</Button></>)}{receiptNo && <Button color="primary" className="px-4 ms-2" onClick={() => window.print()}><i className="ri-printer-line me-1"></i> چاپ رسید</Button>}
              </div>
            </CardBody>
          </Card>
          <Modal isOpen={showSuccessModal} centered backdrop="static" className="no-print"><ModalHeader toggle={() => setShowSuccessModal(false)}>عملیات موفق</ModalHeader><ModalBody className="text-center py-5"><div className="mb-3 text-success"><i className="ri-checkbox-circle-fill" style={{ fontSize: "4rem" }}></i></div><h4 className="fw-bold mb-3">رسید شماره {receiptNo} نهایی شد</h4><p className="text-muted">اطلاعات با موفقیت در سیستم ثبت گردید.</p></ModalBody><ModalFooter className="justify-content-center"><Button color="secondary" onClick={() => navigate("/receipts")}>بازگشت</Button><Button color="primary" onClick={() => { setShowSuccessModal(false); window.print(); }}>چاپ رسید</Button></ModalFooter></Modal>
        </div>
      </>
  );
}