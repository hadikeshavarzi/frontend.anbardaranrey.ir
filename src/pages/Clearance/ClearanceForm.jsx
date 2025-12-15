import React, { useState, useEffect, useMemo } from "react";
import {
  Container, Card, CardBody, Button, Row, Col,
  Input, Label, Table, Badge, Modal, ModalHeader, ModalBody, ModalFooter, CardTitle, UncontrolledTooltip
} from "reactstrap";
import Select from "react-select";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "react-toastify";

import { 
  getReceiptOwners, getOwnerProducts, getBatchesWithHistory, 
  createClearance, uploadDeliveryFile 
} from "../../services/clearanceService";
import DatePickerWithIcon from "../../components/Shared/DatePickerWithIcon";

// ====================================================================
// تابع کمکی: تبدیل لیست تخت به درخت
// ====================================================================
const buildHistoryTree = (flatHistory, rootBatchNo) => {
  const tree = [];
  const directChildren = flatHistory.filter(h => h.parent_batch_no === rootBatchNo);
  directChildren.forEach(child => {
    const grandChildren = buildHistoryTree(flatHistory, child.new_batch_no);
    tree.push({ ...child, children: grandChildren });
  });
  return tree;
};

// ====================================================================
// کامپوننت بازگشتی سطر (RecursiveRow) - با محاسبه موجودی لایو
// ====================================================================
const RecursiveRow = ({ item, level, onOpenModal, flatHistory }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const childrenTree = item.children || [];
  const hasChildren = childrenTree.length > 0;
  
  const toPersianDate = (d) => d ? new Date(d).toLocaleDateString('fa-IR') : "-";

  // --- تابع حیاتی: محاسبه موجودی زنده (Live Inventory Calculation) ---
  const calculateLiveInventory = (batchNo, initialQty, initialWeight) => {
    // پیدا کردن تمام ردیف‌هایی که از این بچ خارج شده‌اند (فرزندان مستقیم)
    const consumedItems = flatHistory.filter(h => h.parent_batch_no === batchNo);
    
    const totalQtyUsed = consumedItems.reduce((sum, i) => sum + Number(i.qty), 0);
    const totalWeightUsed = consumedItems.reduce((sum, i) => sum + Number(i.weight), 0);

    return {
      qty: Number(initialQty) - totalQtyUsed,
      weight: Number(initialWeight) - totalWeightUsed
    };
  };

  // --- هندل کردن دکمه خرد کردن ---
  const handleBreakDown = () => {
    // 1. محاسبه موجودی واقعی در لحظه کلیک
    const liveStats = calculateLiveInventory(item.new_batch_no, item.qty, item.weight);

    // 2. اگر موجودی صفر است، اخطار بده و باز نکن
    if (liveStats.qty <= 0) {
      toast.warn("موجودی این ردیف تمام شده است و قابل خرد کردن نیست.");
      return;
    }

    // 3. پیدا کردن ایندکس بعدی برای نامگذاری
    let maxIndex = 0;
    const myChildren = flatHistory.filter(h => h.parent_batch_no === item.new_batch_no);
    myChildren.forEach(child => {
      const parts = child.new_batch_no.split('/');
      const lastNum = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastNum) && lastNum > maxIndex) maxIndex = lastNum;
    });

    // 4. ارسال اطلاعات محاسبه شده به مودال
    const newParentNode = {
      batch_no: item.new_batch_no,
      qty_available: liveStats.qty,       // <--- مقدار لایو
      weight_available: liveStats.weight, // <--- مقدار لایو
      next_index: maxIndex + 1
    };
    onOpenModal(newParentNode);
  };

  // --- محاسبه رنگ و استایل بر اساس لول ---
  const rowStyle = {
    backgroundColor: level === 0 ? "#fff" : `rgba(240, 242, 245, ${0.3 + (level * 0.1)})`,
    borderRight: level > 0 ? `${4}px solid ${getLevelColor(level)}` : 'none',
    transition: 'all 0.2s ease'
  };

  function getLevelColor(lvl) {
    const colors = ['#556ee6', '#34c38f', '#f1b44c', '#f46a6a', '#50a5f1'];
    return colors[(lvl - 1) % colors.length];
  }

  return (
    <>
      <tr style={rowStyle} className="align-middle">
        <td className="ps-3">
          <div className="d-flex align-items-center" style={{ marginLeft: `${level * 25}px` }}>
            {/* خط راهنما */}
            {level > 0 && <span style={{color: getLevelColor(level), marginRight: '8px', fontSize:'18px'}}>↳</span>}
            
            <div 
               className={`d-flex align-items-center justify-content-center rounded-circle border ${hasChildren ? 'cursor-pointer' : ''}`}
               style={{ width: '24px', height: '24px', backgroundColor: hasChildren ? '#fff' : 'transparent', borderColor: hasChildren ? getLevelColor(level+1) : '#ccc' }}
               onClick={() => hasChildren && setIsOpen(!isOpen)}
            >
               {hasChildren ? (isOpen ? <i className="bx bx-minus font-size-10"></i> : <i className="bx bx-plus font-size-10"></i>) : <i className="mdi mdi-circle-small font-size-18 text-muted"></i>}
            </div>
            
            <span className={`ms-2 font-monospace ${level===0 ? 'fw-bold text-primary font-size-14' : 'font-size-13 text-dark'}`}>
               {level === 0 ? item.batch_no : item.new_batch_no}
            </span>
          </div>
        </td>
        
        {level === 0 ? (
          <>
             <td className="text-center"><Badge className="bg-success font-size-12 px-3">{Number(item.qty_available).toLocaleString()}</Badge></td>
             <td className="text-center font-monospace">{Number(item.weight_available).toLocaleString()}</td>
             <td colSpan={4} className="text-center text-muted font-size-11 fst-italic">--- ورودی اصلی ---</td>
          </>
        ) : (
          <>
             {/* نمایش تعداد اولیه حواله */}
             <td className="text-center fw-bold">{Number(item.qty).toLocaleString()}</td>
             <td className="text-center">{item.weight ? Number(item.weight).toLocaleString() : "-"}</td>
             <td className="font-size-12 font-monospace text-secondary">{item.manual_ref_id || "-"}</td>
             <td className="font-size-12 text-truncate" style={{maxWidth: '120px'}} title={item.receiver_name}>{item.receiver_name}</td>
             <td className="font-size-12">{toPersianDate(item.issue_date)}</td>
             <td className="text-center">
                {item.status === 'exited' ? <i className="bx bx-check-circle text-success font-size-18" id={`tip-${item.id}`}></i> : <i className="bx bx-time-five text-warning font-size-18"></i>}
             </td>
          </>
        )}

        <td className="text-end pe-3">
          {level === 0 ? (
            <Button color="primary" size="sm" className="btn-rounded shadow-sm px-3" onClick={() => onOpenModal(item)}>
               <i className="bx bx-export me-1"></i> خروج اصلی
             </Button>
          ) : (
            <div className="d-flex justify-content-end align-items-center">
              {/* دکمه هوشمند خرد کردن */}
              <Button 
                color="light" size="sm" 
                className="btn-rounded py-1 px-3 font-size-11 border shadow-sm d-flex align-items-center" 
                onClick={handleBreakDown}
              >
                 <i className="bx bx-git-branch me-1 text-primary"></i> خرد کردن
              </Button>
              
              {item.attachment_url && (
                <a href={item.attachment_url} target="_blank" rel="noreferrer" className="ms-2 btn btn-sm btn-soft-secondary rounded-circle" style={{width:30, height:30, padding:0, display:'flex', alignItems:'center', justifyContent:'center'}}>
                   <i className="bx bx-download"></i>
                </a>
              )}
            </div>
          )}
        </td>
      </tr>

      {/* بازگشتی */}
      {isOpen && hasChildren && item.children.map(child => (
        <RecursiveRow 
           key={child.id} item={child} level={level + 1} 
           onOpenModal={onOpenModal} flatHistory={flatHistory} 
        />
      ))}
    </>
  );
};

// ====================================================================
// TreeTableManager
// ====================================================================
const TreeTableManager = ({ item, onOpenModal }) => {
  const historyTree = useMemo(() => buildHistoryTree(item.history || [], item.batch_no), [item.history, item.batch_no]);
  const rootNode = { ...item, children: historyTree };
  return <RecursiveRow item={rootNode} level={0} onOpenModal={onOpenModal} flatHistory={item.history || []} />;
};

// ====================================================================
// اسکیما و فرم اصلی
// ====================================================================
const clearanceHeaderSchema = z.object({
  docDate: z.any().refine(val => !!val, "تاریخ الزامی است"),
  customerId: z.number({ required_error: "انتخاب صاحب کالا الزامی است" }),
  manualDocRef: z.string().optional(),
});

export default function ClearanceForm() {
  const [customerOptions, setCustomerOptions] = useState([]);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState([]); 
  const [productList, setProductList] = useState([]);
  const [batchData, setBatchData] = useState([]);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedBatchNode, setSelectedBatchNode] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [modalInput, setModalInput] = useState({ qty: "", weight: "", manualRef: "", receiverName: "", receiverNationalId: "", driverName: "", plateNumber: "", description: "" });

  const { control, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(clearanceHeaderSchema),
    defaultValues: { docDate: new Date(), customerId: null, manualDocRef: "" }
  });

  const selectedCustomerId = watch("customerId");
  const [selectedProductId, setSelectedProductId] = useState("");

  useEffect(() => {
    const fetchOwners = async () => {
      const data = await getReceiptOwners();
      setCustomerOptions(data.map(o => ({ value: o.id, label: o.full_name })));
    };
    fetchOwners();
  }, []);

  useEffect(() => {
    if (selectedCustomerId) fetchProducts(selectedCustomerId);
    else { setProductList([]); setBatchData([]); setItems([]); }
  }, [selectedCustomerId]);

  const fetchProducts = async (ownerId) => {
    const data = await getOwnerProducts(ownerId);
    setProductList(data);
  };

  const handleProductChange = async (e) => {
    const pId = e.target.value;
    setSelectedProductId(pId);
    setBatchData([]);
    if (!pId) return;
    setLoadingBatches(true);
    try {
      const data = await getBatchesWithHistory(selectedCustomerId, pId);
      setBatchData(data);
    } catch (err) { toast.error("خطا در دریافت اطلاعات"); } 
    finally { setLoadingBatches(false); }
  };

  const handleOpenModal = (batchNode) => {
    setSelectedBatchNode(batchNode);
    setModalInput({ qty: "", weight: "", manualRef: "", receiverName: "", receiverNationalId: "", driverName: "", plateNumber: "", description: "" });
    setSelectedFile(null);
    setModalOpen(true);
  };

  // محاسبه اینکه چقدر در پیش‌نویس مصرف شده
  const usedInDraft = useMemo(() => {
    if (!selectedBatchNode) return { qty: 0, weight: 0, count: 0 };
    return items
      .filter(i => i.parentBatch === selectedBatchNode.batch_no)
      .reduce((acc, curr) => ({
        qty: acc.qty + Number(curr.qty),
        weight: acc.weight + Number(curr.weight),
        count: acc.count + 1
      }), { qty: 0, weight: 0, count: 0 });
  }, [items, selectedBatchNode]);

  // موجودی نهایی برای نمایش در مودال (موجودی لایو دیتابیس - موجودی در لیست پیش نویس)
  const finalRemainingQty = selectedBatchNode ? Math.max(0, selectedBatchNode.qty_available - usedInDraft.qty) : 0;
  const finalRemainingWeight = selectedBatchNode ? Math.max(0, (selectedBatchNode.weight_available || 0) - usedInDraft.weight) : 0;
  
  const nextIdx = selectedBatchNode ? (selectedBatchNode.next_index + usedInDraft.count) : 1;
  const generatedNewBatch = selectedBatchNode ? `${selectedBatchNode.batch_no}/${nextIdx}` : "";

  const handleAddToTable = async () => {
    // --- ولیدیشن نهایی ---
    const inputQty = Number(modalInput.qty);
    const inputWeight = Number(modalInput.weight);

    if (inputQty <= 0) { return toast.error("تعداد وارد شده نامعتبر است"); }
    
    // اخطار اگر بیشتر از موجودی لایو باشد
    if (inputQty > finalRemainingQty) {
      return toast.error(`خطا: موجودی باقیمانده ${finalRemainingQty} عدد است. شما ${inputQty} درخواست کرده‌اید.`);
    }

    let fileUrl = null;
    if (selectedFile) {
       setUploading(true);
       try { fileUrl = await uploadDeliveryFile(selectedFile); } 
       catch(err) { toast.error("خطا در آپلود"); setUploading(false); return; }
       setUploading(false);
    }

    const productObj = productList.find(p => String(p.product_id) === String(selectedProductId));
    const newItem = {
      id: Date.now(),
      product: { id: selectedProductId, title: productObj?.product_title },
      parentBatch: selectedBatchNode.batch_no,
      newBatch: generatedNewBatch,
      qty: inputQty,
      weight: inputWeight,
      manualRef: modalInput.manualRef,
      fileUrl: fileUrl,
      status: 'issued', 
      receiverDetails: {
        name: modalInput.receiverName,
        nationalId: modalInput.receiverNationalId,
        driver: modalInput.driverName,
        plate: modalInput.plateNumber,
        description: modalInput.description
      }
    };

    setItems([...items, newItem]);
    setModalOpen(false);
    toast.success(`ردیف ${generatedNewBatch} اضافه شد`);
  };

  const removeItem = (id) => setItems(items.filter(i => i.id !== id));

  const handleFinalSubmit = (status) => {
    const onValid = async (headerData) => {
      setSaving(true);
      try {
        const firstItem = items[0] || {};
        const firstReceiver = firstItem.receiverDetails || {};
        const payload = {
          member_id: 1, 
          status: status,
          clearance_date: headerData.docDate,
          customer_id: headerData.customerId,
          receiver_person_name: firstReceiver.name || "",
          receiver_person_national_id: firstReceiver.nationalId || "",
          driver_name: firstReceiver.driver || "",
          plate_number: firstReceiver.plate || "",
          description: headerData.manualDocRef ? `شماره ترخیص: ${headerData.manualDocRef}` : "",
          items: items.map(i => ({
            product_id: Number(i.product.id),
            parent_batch_no: i.parentBatch,
            new_batch_no: i.newBatch,
            qty: Number(i.qty),
            weight: Number(i.weight),
            manual_ref_id: i.manualRef,
            attachment_url: i.fileUrl,
            status: i.status,
            description: i.receiverDetails.description 
          }))
        };
        const res = await createClearance(payload);
        toast.success(`ثبت شد: #${res.clearance_no || ''}`);
        setItems([]); setBatchData([]); setSelectedProductId(""); 
        fetchProducts(headerData.customerId);
      } catch (err) { 
        console.error("Submission Error:", err);
        // اگر خطای دیتابیس باشد، متن دقیقش را نشان می‌دهد
        toast.error(err.message || "خطا در ثبت اطلاعات"); 

        }
      finally { setSaving(false); }
    };
    handleSubmit(onValid)();
  };

  return (
    <div className="page-content">
      <Container fluid>
        <Card className="shadow-sm border-0 mb-4">
          <CardBody className="p-4">
             <div className="d-flex align-items-center justify-content-between mb-4 border-bottom pb-3">
                <CardTitle className="h4 text-primary mb-0"><i className="bx bx-exit me-2"></i> فرم ثبت خروج کالا</CardTitle>
             </div>

             <div className="bg-light p-4 rounded-3 mb-4 border border-dashed border-primary border-opacity-25">
               <Row>
                 <Col md={3}>
                   <Label>تاریخ ترخیص</Label>
                   <Controller name="docDate" control={control} render={({ field }) => <DatePickerWithIcon value={field.value} onChange={field.onChange} />} />
                 </Col>
                 <Col md={6}>
                   <Label>صاحب کالا</Label>
                   <Controller name="customerId" control={control} render={({ field }) => (
                        <Select {...field} options={customerOptions} placeholder="جستجو..." value={customerOptions.find(c => c.value === field.value)} onChange={val => field.onChange(val ? val.value : null)} />
                      )} />
                 </Col>
                 <Col md={3}><Label>شماره سند دستی</Label><Controller name="manualDocRef" control={control} render={({ field }) => <Input {...field} placeholder="مثال: 8/1402" />} /></Col>
               </Row>
             </div>
             
             <div className="mb-5">
                <Row className="mb-3">
                   <Col md={12}>
                      <Input type="select" value={selectedProductId} onChange={handleProductChange} disabled={!selectedCustomerId} className="form-select form-select-lg">
                         <option value="">--- کالا را انتخاب کنید ---</option>
                         {productList.map(p => <option key={p.product_id} value={p.product_id}>{p.product_title} (موجودی: {Number(p.total_qty_available).toLocaleString()})</option>)}
                      </Input>
                   </Col>
                </Row>
                {batchData.length > 0 && (
                   <div className="table-responsive rounded border shadow-sm">
                      <Table className="mb-0">
                         <thead className="bg-light text-muted">
                            <tr>
                               <th style={{width:'25%'}} className="ps-3">ردیف / بچ</th>
                               <th className="text-center">تعداد</th>
                               <th className="text-center">وزن (kg)</th>
                               <th>حواله/گیرنده</th>
                               <th>گیرنده</th>
                               <th>تاریخ</th>
                               <th className="text-center">وضعیت</th>
                               <th className="text-end pe-4">عملیات</th>
                            </tr>
                         </thead>
                         <tbody>
                            {batchData.map((item, idx) => <TreeTableManager key={idx} item={item} onOpenModal={handleOpenModal} />)}
                         </tbody>
                      </Table>
                   </div>
                )}
             </div>

             {/* لیست اقلام نهایی */}
             {items.length > 0 && (
               <div className="mb-3 animate__animated animate__fadeInUp">
                 <h6 className="font-size-14 text-secondary border-start border-3 border-success ps-2 mb-3">اقلام آماده ثبت</h6>
                 <Table className="table align-middle table-nowrap table-striped border mb-0">
                     <thead className="table-dark"><tr><th>کالا</th><th>کد جدید</th><th>گیرنده</th><th>وزن</th><th>تعداد</th><th></th></tr></thead>
                     <tbody>
                        {items.map(i => (
                           <tr key={i.id}>
                              <td>{i.product.title}</td>
                              <td><Badge color="info">{i.newBatch}</Badge></td>
                              <td>{i.receiverDetails.name}</td>
                              <td>{Number(i.weight).toLocaleString()}</td>
                              <td><Badge color="success">{Number(i.qty).toLocaleString()}</Badge></td>
                              <td className="text-end"><Button color="danger" size="sm" onClick={()=>removeItem(i.id)}>X</Button></td>
                           </tr>
                        ))}
                     </tbody>
                 </Table>
               </div>
             )}
             
             <div className="d-flex justify-content-end border-top pt-4 mt-4">
               <Button color="success" size="lg" className="px-5 shadow" onClick={()=>handleFinalSubmit('final')} disabled={saving || items.length===0}>
                 {saving ? "در حال ثبت..." : "ثبت نهایی"}
               </Button>
             </div>
          </CardBody>
        </Card>

        {/* MODAL */}
        <Modal isOpen={modalOpen} toggle={() => setModalOpen(false)} size="lg" centered>
           <ModalHeader toggle={() => setModalOpen(false)}>خروج از: <span className="font-monospace text-primary">{selectedBatchNode?.batch_no}</span></ModalHeader>
           <ModalBody>
              {/* نمایش موجودی لایو */}
              <div className="alert alert-soft-primary border-primary d-flex justify-content-between align-items-center">
                 <div>
                    <div className="mb-1"><i className="bx bx-box me-1"></i> موجودی باقیمانده: <strong className="font-size-16">{finalRemainingQty.toLocaleString()}</strong> عدد</div>
                    <div className="text-muted font-size-12"><i className="bx bx-weight me-1"></i> وزن باقیمانده: {finalRemainingWeight.toLocaleString()} kg</div>
                 </div>
                 <div className="text-end">
                    <small className="text-muted d-block">کد جدید تولیدی:</small>
                    <span className="badge bg-success font-size-14 font-monospace">{generatedNewBatch}</span>
                 </div>
              </div>

              <Row className="mb-3">
                 <Col md={6}><Label>تعداد <span className="text-danger">*</span></Label><Input type="number" value={modalInput.qty} onChange={e=>setModalInput({...modalInput, qty:e.target.value})} autoFocus /></Col>
                 <Col md={6}><Label>وزن</Label><Input type="number" value={modalInput.weight} onChange={e=>setModalInput({...modalInput, weight:e.target.value})} /></Col>
              </Row>
              <Row>
                 <Col md={6} className="mb-3"><Label>نام گیرنده</Label><Input value={modalInput.receiverName} onChange={e=>setModalInput({...modalInput, receiverName:e.target.value})} /></Col>
                 <Col md={6} className="mb-3"><Label>کد ملی</Label><Input value={modalInput.receiverNationalId} onChange={e=>setModalInput({...modalInput, receiverNationalId:e.target.value})} /></Col>
                 <Col md={6} className="mb-3"><Label>راننده</Label><Input value={modalInput.driverName} onChange={e=>setModalInput({...modalInput, driverName:e.target.value})} /></Col>
                 <Col md={6} className="mb-3"><Label>پلاک</Label><Input value={modalInput.plateNumber} onChange={e=>setModalInput({...modalInput, plateNumber:e.target.value})} /></Col>
                 <Col md={12}><Label>توضیحات</Label><Input type="textarea" value={modalInput.description} onChange={e=>setModalInput({...modalInput, description:e.target.value})} /></Col>
              </Row>
           </ModalBody>
           <ModalFooter>
              <Button color="light" onClick={()=>setModalOpen(false)}>لغو</Button>
              <Button color="primary" onClick={handleAddToTable} disabled={uploading}>افزودن</Button>
           </ModalFooter>
        </Modal>

      </Container>
    </div>
  );
}