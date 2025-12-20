import React, { useState, useEffect, useMemo } from "react";
import {
    Container, Card, CardBody, Button, Row, Col,
    Input, Label, Table, Badge, Modal, ModalHeader, ModalBody, ModalFooter, CardTitle,
    FormFeedback, InputGroup, InputGroupText
} from "reactstrap";
import Select from "react-select";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "react-toastify";

// سرویس‌ها
import {
    getReceiptOwners,
    getOwnerProductsSummary,
    getBatchesWithHistory,
    createClearance,
    uploadDeliveryFile
} from "../../services/clearanceService";
import { requestOtp, verifyOtp } from "../../services/auth";
import DatePickerWithIcon from "../../components/Shared/DatePickerWithIcon";

// ====================================================================
// 1. کامپوننت پلاک
// ====================================================================
const IranLicensePlate = ({ value, onChange }) => {
    const parts = value ? value.split('-') : ["", "", "ب", ""];
    const [partLeft, setPartLeft] = useState(parts[0] || "");
    const [partMid, setPartMid] = useState(parts[1] || "");
    const [partLetter, setPartLetter] = useState(parts[2] || "ب");
    const [partIran, setPartIran] = useState(parts[3] || "");

    const letters = ["الف","ب","پ","ت","ث","ج","د","ز","س","ش","ص","ط","ع","ف","ق","ک","گ","ل","م","ن","و","ه","ی","ژ"];

    const updateParent = (left, mid, letter, iran) => {
        onChange(`${left}-${mid}-${letter}-${iran}`);
    };

    return (
        <div className="d-flex align-items-center border rounded p-1 bg-white shadow-sm" style={{direction: 'ltr', maxWidth: '280px', height: '45px'}}>
            <div className="bg-primary text-white d-flex flex-column align-items-center justify-content-center rounded-start h-100 px-1" style={{fontSize: '9px', width: '35px'}}>
                <span>I.R.</span><span>IRAN</span>
            </div>
            <Input className="border-0 text-center fw-bold font-size-16 p-0" style={{width: '45px', boxShadow: 'none'}} placeholder="11" maxLength={2} value={partLeft} onChange={(e) => { const v = e.target.value; setPartLeft(v); updateParent(v, partMid, partLetter, partIran); }} />
            <Input type="select" className="border-0 text-center fw-bold p-0 text-danger font-size-14" style={{width: '55px', boxShadow: 'none', cursor: 'pointer'}} value={partLetter} onChange={(e) => { const v = e.target.value; setPartLetter(v); updateParent(partLeft, partMid, v, partIran); }}>
                {letters.map(l => <option key={l} value={l}>{l}</option>)}
            </Input>
            <Input className="border-0 text-center fw-bold font-size-16 p-0" style={{width: '55px', boxShadow: 'none'}} placeholder="345" maxLength={3} value={partMid} onChange={(e) => { const v = e.target.value; setPartMid(v); updateParent(partLeft, v, partLetter, partIran); }} />
            <div className="border-start border-dark mx-1" style={{height: '70%'}}></div>
            <div className="d-flex flex-column align-items-center justify-content-center" style={{width: '40px'}}>
                <span style={{fontSize: '8px', lineHeight: '10px'}}>ایران</span>
                <Input className="border-0 text-center fw-bold font-size-16 p-0" style={{width: '100%', boxShadow: 'none'}} placeholder="22" maxLength={2} value={partIran} onChange={(e) => { const v = e.target.value; setPartIran(v); updateParent(partLeft, partMid, partLetter, v); }} />
            </div>
        </div>
    );
};

// ====================================================================
// 2. توابع کمکی
// ====================================================================
const buildHistoryTree = (flatHistory, rootBatchNo) => {
    const tree = [];
    const directChildren = flatHistory.filter(h => h.parent_batch_no === rootBatchNo);
    directChildren.forEach(child => {
        const grandChildren = buildHistoryTree(flatHistory, child.batch_no);
        tree.push({ ...child, children: grandChildren });
    });
    return tree;
};

// ====================================================================
// 3. سطر جدول (RecursiveRow) - اصلاح شده برای بدون ردیف
// ====================================================================
const RecursiveRow = ({ item, level, onOpenModal, flatHistory }) => {
    const [isOpen, setIsOpen] = useState(false);
    const childrenTree = item.children || [];
    const hasChildren = childrenTree.length > 0;
    const toPersianDate = (d) => d ? new Date(d).toLocaleDateString('fa-IR') : "-";

    const getNodeStats = () => {
        if (level === 0) {
            return {
                qty: item.qty_available,
                weight: item.weight_available
            };
        } else {
            const initialQty = Number(item.qty || 0);
            const initialWeight = Number(item.weight || 0);
            const usedQty = childrenTree.reduce((sum, child) => sum + Number(child.qty || 0), 0);
            const usedWeight = childrenTree.reduce((sum, child) => sum + Number(child.weight || 0), 0);
            return {
                qty: initialQty - usedQty,
                weight: initialWeight - usedWeight
            };
        }
    };

    const handleBreakDown = () => {
        // *** اصلاح ۱: حذف محدودیت "بدون ردیف" ***
        // اگر "بدون ردیف" باشد، یعنی مقدار batch_no نال یا خالی است
        const currentBatchName = item.batch_no || item.new_batch_no || 'بدون ردیف';
        const isNoBatch = currentBatchName === 'بدون ردیف';

        const stats = getNodeStats();
        if (stats.qty <= 0 && stats.weight <= 0) return toast.warn("موجودی این ردیف تمام شده است.");

        let nextIndex = 1;

        // فقط اگر "بدون ردیف" نباشد، دنبال ایندکس بعدی می‌گردیم
        if (!isNoBatch) {
            const myDirectChildren = flatHistory.filter(h => h.parent_batch_no === currentBatchName);
            let maxIndex = 0;
            if (myDirectChildren.length > 0) {
                myDirectChildren.forEach(child => {
                    const parts = child.batch_no.split('/');
                    const lastNum = parseInt(parts[parts.length - 1]);
                    if (!isNaN(lastNum) && lastNum > maxIndex) maxIndex = lastNum;
                });
            }
            nextIndex = maxIndex + 1;
        }

        onOpenModal({
            batch_no: currentBatchName,
            qty_available: stats.qty,
            weight_available: stats.weight,
            next_index: nextIndex,
            isNoBatch: isNoBatch // پرچم برای تشخیص در فرم
        });
    };

    const rowStyle = {
        backgroundColor: level === 0 ? "#fff" : `rgba(240, 242, 245, ${0.3 + (level * 0.05)})`,
        borderRight: level > 0 ? `4px solid ${level % 2 === 0 ? '#34c38f' : '#556ee6'}` : 'none',
    };

    return (
        <>
            <tr style={rowStyle} className="align-middle">
                <td className="ps-3">
                    <div className="d-flex align-items-center" style={{ marginLeft: `${level * 25}px` }}>
                        {level > 0 && <span style={{color: level % 2 === 0 ? '#34c38f' : '#556ee6', marginRight: '8px', fontSize:'18px'}}>↳</span>}
                        <div className={`d-flex align-items-center justify-content-center rounded-circle border ${hasChildren ? 'cursor-pointer' : ''}`} style={{ width: '24px', height: '24px', backgroundColor: hasChildren ? '#fff' : 'transparent', borderColor: hasChildren ? '#556ee6' : '#ccc' }} onClick={() => hasChildren && setIsOpen(!isOpen)}>
                            {hasChildren ? (isOpen ? <i className="bx bx-minus font-size-10"></i> : <i className="bx bx-plus font-size-10"></i>) : <i className="mdi mdi-circle-small font-size-18 text-muted"></i>}
                        </div>
                        <span className={`ms-2 font-monospace ${level===0 ? 'fw-bold text-primary font-size-14' : 'font-size-13 text-dark'}`}>
               {(item.batch_no || item.new_batch_no) || "بدون ردیف"}
            </span>
                    </div>
                </td>

                {level === 0 ? (
                    <>
                        <td className="text-center"><Badge className="bg-success font-size-12 px-3">{Number(item.qty_available).toLocaleString()}</Badge></td>
                        <td className="text-center font-monospace">{Number(item.weight_available).toLocaleString()}</td>
                        <td colSpan={4} className="text-center text-muted font-size-11 fst-italic">--- موجودی کل ---</td>
                    </>
                ) : (
                    <>
                        <td className="text-center fw-bold text-secondary">{Number(item.qty).toLocaleString()}</td>
                        <td className="text-center text-secondary">{item.weight ? Number(item.weight).toLocaleString() : "-"}</td>
                        <td className="font-size-12 font-monospace text-secondary">{item.manual_ref_id || "-"}</td>
                        <td className="font-size-12 text-truncate" style={{maxWidth: '120px'}} title={item.receiver_name}>{item.receiver_name}</td>
                        <td className="font-size-12">{toPersianDate(item.transaction_date || item.created_at)}</td>
                        <td className="text-center"><i className="bx bx-check-circle text-success font-size-18"></i></td>
                    </>
                )}

                <td className="text-end pe-3">
                    <div className="d-flex justify-content-end gap-2 align-items-center">
                        <Button color="primary" size="sm" className="btn-rounded py-1 px-3 shadow-sm" onClick={handleBreakDown}>
                            <i className="bx bx-git-branch me-1"></i>
                            <span>خرد کردن / خروج</span>
                        </Button>
                        {level > 0 && item.attachment_url && (
                            <a href={item.attachment_url} target="_blank" rel="noreferrer" className="btn btn-sm btn-soft-secondary rounded-circle ms-1"><i className="bx bx-download"></i></a>
                        )}
                    </div>
                </td>
            </tr>

            {isOpen && hasChildren && item.children.map(child => (
                <RecursiveRow key={child.id} item={child} level={level + 1} onOpenModal={onOpenModal} flatHistory={flatHistory} />
            ))}
        </>
    );
};

const TreeTableManager = ({ item, onOpenModal }) => {
    const historyTree = useMemo(() => buildHistoryTree(item.history || [], item.batch_no), [item.history, item.batch_no]);
    return <RecursiveRow item={{ ...item, children: historyTree }} level={0} onOpenModal={onOpenModal} flatHistory={item.history || []} />;
};

// ====================================================================
// 4. فرم اصلی
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

    const [modalOpen, setModalOpen] = useState(false);
    const [otpModalOpen, setOtpModalOpen] = useState(false);
    const [successModalOpen, setSuccessModalOpen] = useState(false);

    const [selectedBatchNode, setSelectedBatchNode] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [modalInput, setModalInput] = useState({ qty: "", weight: "", manualRef: "", receiverName: "", receiverNationalId: "", driverName: "", plateNumber: "", description: "" });
    const [fieldErrors, setFieldErrors] = useState({});
    const [otpCode, setOtpCode] = useState("");
    const [ownerMobile, setOwnerMobile] = useState("");
    const [pendingPayload, setPendingPayload] = useState(null);
    const [finalSuccessData, setFinalSuccessData] = useState(null);

    const { control, handleSubmit, watch } = useForm({
        resolver: zodResolver(clearanceHeaderSchema),
        defaultValues: { docDate: new Date(), customerId: null, manualDocRef: "" }
    });

    const selectedCustomerId = watch("customerId");
    const [selectedProductId, setSelectedProductId] = useState(null);

    const fontStyle = { fontFamily: 'inherit' };

    useEffect(() => {
        const fetchOwners = async () => {
            try {
                const data = await getReceiptOwners();
                setCustomerOptions(data.map(o => ({ value: o.id, label: o.full_name, mobile: o.mobile || "" })));
            } catch (err) { console.error(err); }
        };
        fetchOwners();
    }, []);

    useEffect(() => {
        setSelectedProductId(null);
        setBatchData([]);
        setItems([]);
        if (selectedCustomerId) fetchProducts(selectedCustomerId);
        else setProductList([]);
    }, [selectedCustomerId]);

    const fetchProducts = async (ownerId) => {
        try {
            const data = await getOwnerProductsSummary(ownerId);
            setProductList(data);
        } catch(err) { toast.error("خطا در دریافت لیست کالاها"); }
    };

    const handleProductChange = async (option) => {
        const pId = option ? option.value : null;
        setSelectedProductId(option);
        setBatchData([]);
        if (!pId) return;
        setLoadingBatches(true);
        try {
            const data = await getBatchesWithHistory(selectedCustomerId, pId);
            setBatchData(data);
        } catch (err) { toast.error("خطا در دریافت اطلاعات ردیف‌ها"); }
        finally { setLoadingBatches(false); }
    };

    const handleOpenModal = (batchNode) => {
        setSelectedBatchNode(batchNode);
        setModalInput({ qty: "", weight: "", manualRef: "", receiverName: "", receiverNationalId: "", driverName: "", plateNumber: "", description: "" });
        setSelectedFile(null);
        setFieldErrors({});
        setModalOpen(true);
    };

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

    const finalRemainingQty = selectedBatchNode ? Math.max(0, (selectedBatchNode.qty_available || 0) - usedInDraft.qty) : 0;
    const finalRemainingWeight = selectedBatchNode ? Math.max(0, (selectedBatchNode.weight_available || 0) - usedInDraft.weight) : 0;

    const generatedNewBatch = useMemo(() => {
        if(!selectedBatchNode) return "";

        // *** اصلاح ۲: اگر بدون ردیف است، کد جدید نساز ***
        if(selectedBatchNode.isNoBatch || selectedBatchNode.batch_no === "بدون ردیف") {
            return "بدون ردیف";
        }

        const idx = (selectedBatchNode.next_index || 1) + usedInDraft.count;
        return `${selectedBatchNode.batch_no}/${idx}`;
    }, [selectedBatchNode, usedInDraft]);

    const handleAddToTable = async () => {
        setFieldErrors({});
        let errors = {};
        let hasError = false;

        try {
            const inputQty = Number(modalInput.qty || 0);
            const inputWeight = Number(modalInput.weight || 0);

            if (!modalInput.receiverName || modalInput.receiverName.trim() === "") { errors.receiverName = "نام گیرنده الزامی است"; hasError = true; }

            if(finalRemainingQty <= 0) {
                toast.error("موجودی برای این ردیف تمام شده است.");
                return;
            }

            if (finalRemainingQty > 0) {
                if (!modalInput.qty || inputQty <= 0) { errors.qty = "تعداد الزامی"; hasError = true; }
                else if (inputQty > finalRemainingQty) { errors.qty = `حداکثر ${finalRemainingQty}`; hasError = true; }
            }
            if (finalRemainingWeight > 0) {
                if (!modalInput.weight || inputWeight <= 0) { errors.weight = "وزن الزامی"; hasError = true; }
                else if (inputWeight > finalRemainingWeight) { errors.weight = `حداکثر ${finalRemainingWeight}`; hasError = true; }
            }

            if (hasError) { setFieldErrors(errors); return; }

            let fileUrl = null;

            // --- بخش اصلاح شده آپلود ---
            if (selectedFile) {
                setUploading(true); // نمایش لودینگ روی دکمه
                try {
                    console.log(">>> Starting upload for:", selectedFile.name);
                    fileUrl = await uploadDeliveryFile(selectedFile);
                    console.log(">>> Upload success, URL:", fileUrl);
                }
                catch(err) {
                    console.error("Upload Failed:", err);
                    toast.error("خطا در آپلود فایل: " + (err.message || "Unknown Error"));
                    setUploading(false);
                    return; // توقف در صورت خطا
                }
                setUploading(false);
            }
            // ---------------------------

            if (!selectedProductId || !selectedProductId.labelObj) {
                toast.error("کالا به درستی انتخاب نشده است");
                return;
            }

            const newItem = {
                id: Date.now(),
                product: { id: selectedProductId.value, title: selectedProductId.labelObj.title },
                parentBatch: selectedBatchNode.batch_no,
                newBatch: generatedNewBatch,
                qty: inputQty,
                weight: inputWeight,
                manualRef: modalInput.manualRef,
                fileUrl: fileUrl, // لینک فایل اینجا قرار می‌گیرد
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
            setFieldErrors({});
            toast.success("به لیست اضافه شد");

        } catch (error) {
            console.error("Add Item Error:", error);
            toast.error("خطایی در افزودن به لیست رخ داد");
            setUploading(false);
        }
    };

    const removeItem = (id) => setItems(items.filter(i => i.id !== id));

    const productOptions = useMemo(() => {
        return productList.map(p => ({
            value: p.product_id,
            label: p.product_title,
            customData: {
                title: p.product_title,
                qty: Number(p.total_qty_available || 0),
                weight: Number(p.total_weight_available || 0)
            },
            labelObj: { title: p.product_title, qty: p.total_qty_available, weight: p.total_weight_available }
        }));
    }, [productList]);

    const handleFinalSubmit = (status) => {
        const onValid = async (headerData) => {
            setSaving(true);
            try {
                const selectedCustomer = customerOptions.find(c => c.value === headerData.customerId);
                if (!selectedCustomer || !selectedCustomer.mobile) {
                    toast.error("شماره موبایل صاحب کالا یافت نشد"); setSaving(false); return;
                }

                const totalQty = items.reduce((sum, item) => sum + Number(item.qty), 0);
                const uniqueProductNames = [...new Set(items.map(i => i.product.title))];
                const firstReceiverName = items[0]?.receiverDetails?.name || "نامشخص";

                const payload = {
                    member_id: 1,
                    status: status,
                    clearance_date: headerData.docDate,
                    customer_id: headerData.customerId,
                    receiver_person_name: firstReceiverName,
                    receiver_person_national_id: items[0]?.receiverDetails?.nationalId || "",
                    driver_name: items[0]?.receiverDetails?.driver || "",
                    plate_number: items[0]?.receiverDetails?.plate || "",
                    description: headerData.manualDocRef ? `سند: ${headerData.manualDocRef}` : "",
                    items: items.map(i => ({
                        product_id: Number(i.product.id),
                        // *** اصلاح ۳: ارسال 'بدون ردیف' به عنوان شناسه ***
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

                setOwnerMobile(selectedCustomer.mobile);
                setPendingPayload(payload);

                const res = await requestOtp(selectedCustomer.mobile, {
                    owner: selectedCustomer.label,
                    product: uniqueProductNames.join("، "),
                    qty: totalQty.toLocaleString(),
                    receiver: firstReceiverName
                });

                if (res && (res.success || res.status === 200 || (res.message && res.message.includes('ارسال')))) {
                    toast.info("کد تایید پیامک شد");
                    setOtpModalOpen(true);
                } else { toast.error("خطا در ارسال پیامک"); }

            } catch (err) {
                console.error("Final Submit Error:", err);
                if (err.response && err.response.status === 200) setOtpModalOpen(true);
                else toast.error("خطا در سرور");
            } finally { setSaving(false); }
        };
        handleSubmit(onValid, (errors) => {
            toast.warning("لطفا فرم را تکمیل کنید");
        })();
    };

    const handleVerifyAndSave = async () => {
        if (!otpCode) return toast.error("کد را وارد کنید");
        setSaving(true);
        try {
            const verifyRes = await verifyOtp(ownerMobile, otpCode);
            if (verifyRes.success || verifyRes.token) {
                const res = await createClearance(pendingPayload);

                setFinalSuccessData({
                    clearance_no: res.clearance_no || "---",
                    customer: customerOptions.find(c=>c.value === pendingPayload.customer_id)?.label,
                    date: new Date(pendingPayload.clearance_date).toLocaleDateString('fa-IR'),
                    itemsCount: items.length
                });

                setOtpModalOpen(false);
                setSuccessModalOpen(true);

                setOtpCode(""); setPendingPayload(null);
                setItems([]); setBatchData([]); setSelectedProductId(null);
                if(pendingPayload.customer_id) fetchProducts(pendingPayload.customer_id);
            } else {
                toast.error("کد اشتباه است");
            }
        } catch (err) {
            toast.error("خطا در ثبت نهایی: " + (err.message || ""));
        } finally { setSaving(false); }
    };

    return (
        <div className="page-content" style={fontStyle}>
            <Container fluid>
                <Card className="shadow-sm border-0 mb-4">
                    <CardBody className="p-4">
                        {/* هدر و فرم ورودی (بدون تغییر) */}
                        <div className="d-flex align-items-center justify-content-between mb-4 border-bottom pb-3">
                            <CardTitle className="h4 text-primary mb-0"><i className="bx bx-exit me-2"></i> ثبت خروج کالا</CardTitle>
                            <Badge color="light" className="text-dark font-size-13 p-2">شماره سند: (تولید خودکار)</Badge>
                        </div>

                        <div className="bg-light p-4 rounded-3 mb-4 border border-dashed border-primary border-opacity-25">
                            <Row>
                                <Col md={3}>
                                    <Label>تاریخ ترخیص <span className="text-danger">*</span></Label>
                                    <Controller name="docDate" control={control} render={({ field }) => <DatePickerWithIcon value={field.value} onChange={field.onChange} />} />
                                </Col>
                                <Col md={6}>
                                    <Label>صاحب کالا <span className="text-danger">*</span></Label>
                                    <Controller name="customerId" control={control} render={({ field }) => (
                                        <Select {...field} options={customerOptions} placeholder="جستجو کنید..." value={customerOptions.find(c => c.value === field.value)} onChange={val => field.onChange(val ? val.value : null)} />
                                    )} />
                                </Col>
                                <Col md={3}><Label className="text-muted">شماره سند دستی</Label><Controller name="manualDocRef" control={control} render={({ field }) => <Input {...field} placeholder="اختیاری" />} /></Col>
                            </Row>
                        </div>

                        <div className="mb-5">
                            <Row className="mb-3">
                                <Col md={12}>
                                    <Label>انتخاب کالا (جستجو بر اساس نام)</Label>
                                    <Select
                                        value={selectedProductId}
                                        onChange={handleProductChange}
                                        options={productOptions}
                                        isDisabled={!selectedCustomerId}
                                        placeholder={selectedCustomerId ? "کالا را جستجو و انتخاب کنید..." : "ابتدا صاحب کالا را انتخاب کنید"}
                                        noOptionsMessage={() => "کالایی یافت نشد"}
                                        formatOptionLabel={(option) => (
                                            <div className="d-flex justify-content-between align-items-center w-100">
                                                <span className="fw-bold">{option.label}</span>
                                                <div className="d-flex gap-2 font-size-12 text-muted bg-light px-2 rounded">
                                                    <span>تعداد: {option.customData?.qty.toLocaleString()}</span>
                                                    <span className="border-start mx-1"></span>
                                                    <span>وزن: {option.customData?.weight.toLocaleString()}</span>
                                                </div>
                                            </div>
                                        )}
                                    />
                                </Col>
                            </Row>
                            {batchData.length > 0 && (
                                <div className="table-responsive rounded border shadow-sm">
                                    <Table className="mb-0">
                                        <thead className="bg-light text-muted">
                                        <tr><th className="ps-3">ردیف</th><th className="text-center">موجودی</th><th className="text-center">وزن</th><th>گیرنده</th><th>تاریخ</th><th className="text-center">وضعیت</th><th className="text-end pe-4">عملیات</th></tr>
                                        </thead>
                                        <tbody>{batchData.map((item, idx) => <TreeTableManager key={idx} item={item} onOpenModal={handleOpenModal} />)}</tbody>
                                    </Table>
                                </div>
                            )}
                        </div>

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
                            <Button color="success" size="lg" className="px-5 shadow" onClick={()=>handleFinalSubmit('final')} disabled={saving || items.length===0}>{saving ? "در حال پردازش..." : "ثبت نهایی"}</Button>
                        </div>
                    </CardBody>
                </Card>

                {/* MODAL */}
                <Modal isOpen={modalOpen} toggle={() => setModalOpen(false)} size="lg" centered>
                    <ModalHeader toggle={() => setModalOpen(false)} className="bg-light">
                        <span className="fw-bold">خروج از:</span> <span className="font-monospace text-primary bg-white px-2 py-1 rounded border ms-2">{selectedBatchNode?.batch_no}</span>
                    </ModalHeader>
                    <ModalBody className="p-4">
                        <div className="bg-soft-primary border border-primary border-opacity-25 rounded p-3 mb-4 d-flex justify-content-between align-items-center">
                            <div className="d-flex gap-4">
                                <div className={finalRemainingQty > 0 ? "text-primary" : "text-muted"}> موجودی: <strong className="ms-1">{finalRemainingQty.toLocaleString()}</strong> </div>
                                <div className={finalRemainingWeight > 0 ? "text-info" : "text-muted"}> وزن: <strong className="ms-1">{finalRemainingWeight.toLocaleString()}</strong> kg </div>
                            </div>
                            <div className="text-end"><small className="d-block font-size-11">کد جدید:</small><span className="badge bg-success font-size-13 font-monospace">{generatedNewBatch}</span></div>
                        </div>
                        <Row>
                            <Col md={6} className="mb-3">
                                <Label>تعداد {finalRemainingQty > 0 && <span className="text-danger">*</span>}</Label>
                                <InputGroup>
                                    <InputGroupText className="bg-white"><i className="bx bx-hash"></i></InputGroupText>
                                    <Input type="number" value={modalInput.qty} onChange={e=> { setModalInput({...modalInput, qty:e.target.value}); if(fieldErrors.qty) setFieldErrors({...fieldErrors, qty: null}); }} invalid={!!fieldErrors.qty} disabled={finalRemainingQty <= 0} autoFocus />
                                    <FormFeedback>{fieldErrors.qty}</FormFeedback>
                                </InputGroup>
                            </Col>
                            <Col md={6} className="mb-3">
                                <Label>وزن {finalRemainingWeight > 0 && <span className="text-danger">*</span>}</Label>
                                <InputGroup>
                                    <InputGroupText className="bg-white"><i className="bx bx-dumbbell"></i></InputGroupText>
                                    <Input type="number" value={modalInput.weight} onChange={e=> { setModalInput({...modalInput, weight:e.target.value}); if(fieldErrors.weight) setFieldErrors({...fieldErrors, weight: null}); }} invalid={!!fieldErrors.weight} disabled={finalRemainingWeight <= 0} />
                                    <FormFeedback>{fieldErrors.weight}</FormFeedback>
                                </InputGroup>
                            </Col>
                        </Row>
                        <hr className="my-2 border-light" />
                        <Row>
                            <Col md={6} className="mb-3">
                                <Label>گیرنده <span className="text-danger">*</span></Label>
                                <Input value={modalInput.receiverName} onChange={e=> { setModalInput({...modalInput, receiverName:e.target.value}); if(fieldErrors.receiverName) setFieldErrors({...fieldErrors, receiverName: null}); }} invalid={!!fieldErrors.receiverName} placeholder="مثال: آقای حسینی" />
                                <FormFeedback>{fieldErrors.receiverName}</FormFeedback>
                            </Col>
                            <Col md={6} className="mb-3"><Label>کد ملی</Label><Input value={modalInput.receiverNationalId} onChange={e=>setModalInput({...modalInput, receiverNationalId:e.target.value})} placeholder="10 رقمی" /></Col>
                            <Col md={12} className="mb-3"><Label>فایل ضمیمه</Label><Input type="file" onChange={(e) => setSelectedFile(e.target.files[0])} /></Col>
                            <Col md={12}><Label>توضیحات</Label><Input type="textarea" rows="2" value={modalInput.description} onChange={e=>setModalInput({...modalInput, description:e.target.value})} /></Col>
                        </Row>
                    </ModalBody>
                    <ModalFooter>
                        <Button color="link" onClick={()=>setModalOpen(false)}>انصراف</Button>
                        <Button color="success" onClick={handleAddToTable} disabled={uploading}>{uploading ? "آپلود..." : "افزودن"}</Button>
                    </ModalFooter>
                </Modal>

                {/* OTP MODAL */}
                <Modal isOpen={otpModalOpen} toggle={() => setOtpModalOpen(false)} size="sm" centered>
                    <ModalHeader className="bg-primary text-white">تایید پیامکی</ModalHeader>
                    <ModalBody className="text-center p-4">
                        <div className="mb-3"><i className="bx bx-message-rounded-check display-4 text-primary"></i></div>
                        <p>کد به <strong>{ownerMobile}</strong> ارسال شد.</p>
                        <Input className="form-control-lg text-center font-monospace mb-3 letter-spacing-2" placeholder="_ _ _ _ _ _" maxLength={6} value={otpCode} onChange={(e) => setOtpCode(e.target.value)} autoFocus />
                        <Button color="success" className="w-100 btn-lg shadow" onClick={handleVerifyAndSave} disabled={saving}>{saving ? "بررسی..." : "تایید نهایی"}</Button>
                    </ModalBody>
                </Modal>

                {/* SUCCESS MODAL */}
                <Modal isOpen={successModalOpen} toggle={() => setSuccessModalOpen(false)} centered>
                    <ModalBody className="text-center p-5">
                        <div className="avatar-lg mx-auto mb-4">
                            <span className="avatar-title rounded-circle bg-success bg-soft text-success font-size-24"><i className="bx bx-check"></i></span>
                        </div>
                        <h4>ثبت موفقیت آمیز!</h4>
                        <p className="text-muted">سند خروج با موفقیت ثبت شد.</p>
                        <div className="bg-light p-3 rounded mt-4 border border-dashed">
                            <div className="d-flex justify-content-between mb-2"><span className="text-muted">شماره سند:</span><span className="fw-bold text-primary">{finalSuccessData?.clearance_no}</span></div>
                            <div className="d-flex justify-content-between mb-2"><span className="text-muted">صاحب کالا:</span><span className="fw-bold">{finalSuccessData?.customer}</span></div>
                            <div className="d-flex justify-content-between"><span className="text-muted">تعداد اقلام:</span><span>{finalSuccessData?.itemsCount}</span></div>
                        </div>
                        <div className="mt-4 d-grid gap-2">
                            <Button color="primary" onClick={() => setSuccessModalOpen(false)}><i className="bx bx-printer me-1"></i> چاپ رسید</Button>
                            <Button color="link" onClick={() => setSuccessModalOpen(false)}>بستن</Button>
                        </div>
                    </ModalBody>
                </Modal>

            </Container>
        </div>
    );
}