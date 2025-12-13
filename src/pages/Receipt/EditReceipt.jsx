import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardBody, Button, Alert, Spinner } from "reactstrap";
import { get, post } from "../../helpers/api_helper";

import "../../assets/scss/receipt.scss";
import "../../assets/scss/receipt-items-table.scss";
import "../../assets/scss/receipt-costs.scss";

import ReceiptOwnerSection from "../../components/Receipt/ReceiptOwnerSection";
import ReceiptHeader from "../../components/Receipt/ReceiptHeader";
import ReceiptRefSection from "../../components/Receipt/ReceiptRefSection";
import ReceiptItemsTable from "../../components/Receipt/ReceiptItemsTable";
import ReceiptCosts from "../../components/Receipt/ReceiptCosts";
import ReceiptPaymentSection from "../../components/Receipt/ReceiptPaymentSection";

const EditReceipt = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [refType, setRefType] = useState("none");
  const [refValues, setRefValues] = useState({
    barnamehNumber: "",
    barnamehTracking: "",
    pettehNumber: "",
    havaleNumber: "",
    productionNumber: "",
  });

  const updateRefValue = (key, value) => {
       
    setRefValues((prev) => {
      const newState = { ...prev, [key]: value };
      return newState;
    });
  };

  const [docDate, setDocDate] = useState("");
  const [barnamehDate, setBarnamehDate] = useState("");
  const [birthDateDriver, setBirthDateDriver] = useState("");
  const [dischargeDate, setDischargeDate] = useState("");

  const [owner, setOwner] = useState({});
  const [deliverer, setDeliverer] = useState({});
  const [items, setItems] = useState([]);

  const [driver, setDriver] = useState({
    name: "",
    nationalId: "",
    phone: "",
  });

  const [plate, setPlate] = useState({
    right2: "",
    letter: "",
    middle3: "",
    left2: "",
  });

  const [finance, setFinance] = useState({
    loadCost: "",
    unloadCost: "",
    warehouseCost: "",
    tax: "",
    returnFreight: "",
    loadingFee: "",
    miscCost: "",
    miscDescription: "",
  });

  const [paymentBy, setPaymentBy] = useState("customer");
  const [paymentInfo, setPaymentInfo] = useState({
    cardNumber: "",
    accountNumber: "",
    bankName: "",
    ownerName: "",
    trackingCode: "",
  });

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // ---------------------- لود داده‌های رسید ----------------------
  useEffect(() => {
    loadReceiptData();
  }, [id]);

  const loadReceiptData = async () => {
    try {
    
      setLoading(true);
      setLoadError("");

      // دریافت رسید
      const receiptData = await get(`/receipts/${id}`);
   

      // تنظیم تاریخ سند
      if (receiptData.docDate) {
        setDocDate(receiptData.docDate);
      }

      // تنظیم مالک
      if (receiptData.owner) {
        if (typeof receiptData.owner === "object") {
          setOwner({
            id: receiptData.owner.id,
            companyName: receiptData.owner.companyName,
            nationalId: receiptData.owner.nationalId,
          });
        } else {
          setOwner({ id: receiptData.owner });
        }
      }

      // تنظیم تحویل‌دهنده
      if (receiptData.deliverer) {
        if (typeof receiptData.deliverer === "object") {
          setDeliverer({
            id: receiptData.deliverer.id,
            companyName: receiptData.deliverer.companyName,
            nationalId: receiptData.deliverer.nationalId,
          });
        } else if (receiptData.deliverer) {
          setDeliverer({ id: receiptData.deliverer });
        }
      }

      // تنظیم راننده
      if (receiptData.driver) {
        setDriver({
          name: receiptData.driver.name || "",
          nationalId: receiptData.driver.nationalId || "",
          phone: receiptData.driver.phone || "",
        });
        if (receiptData.driver.birthDate) {
          setBirthDateDriver(receiptData.driver.birthDate);
        }
      }

      // تنظیم تاریخ تخلیه
      if (receiptData.dischargeDate) {
        setDischargeDate(receiptData.dischargeDate);
      }

      // تنظیم پلاک
      if (receiptData.plate) {
        setPlate({
          right2: receiptData.plate.iranRight || "",
          letter: receiptData.plate.letter || "",
          middle3: receiptData.plate.mid3 || "",
          left2: receiptData.plate.left2 || "",
        });
      }

      // تنظیم هزینه‌ها
      if (receiptData.finance) {
        setFinance({
          loadCost: receiptData.finance.loadCost || "",
          unloadCost: receiptData.finance.unloadCost || "",
          warehouseCost: receiptData.finance.warehouseCost || "",
          tax: receiptData.finance.tax || "",
          returnFreight: receiptData.finance.returnFreight || "",
          loadingFee: receiptData.finance.loadingFee || "",
          miscCost: receiptData.finance.miscCost || "",
          miscDescription: receiptData.finance.miscDescription || "",
        });
      }

      // تنظیم اطلاعات پرداخت
      if (receiptData.payment) {
        setPaymentBy(receiptData.payment.paymentBy || "customer");
        setPaymentInfo({
          cardNumber: receiptData.payment.cardNumber || "",
          accountNumber: receiptData.payment.accountNumber || "",
          bankName: receiptData.payment.bankName || "",
          ownerName: receiptData.payment.ownerName || "",
          trackingCode: receiptData.payment.trackingCode || "",
        });
      }

      // تنظیم مرجع سند
      if (receiptData.refDocument) {
        setRefType(receiptData.refDocument.refType || "none");
        setRefValues({
          barnamehNumber: receiptData.refDocument.barnamehNumber || "",
          barnamehTracking: receiptData.refDocument.barnamehTracking || "",
          pettehNumber: receiptData.refDocument.pettehNumber || "",
          havaleNumber: receiptData.refDocument.havaleNumber || "",
          productionNumber: receiptData.refDocument.productionNumber || "",
        });
        if (receiptData.refDocument.barnamehDate) {
          setBarnamehDate(receiptData.refDocument.barnamehDate);
        }
      }

      // لود کردن آیتم‌ها
      if (receiptData.items && receiptData.items.length > 0) {
        const loadedItems = [];

        for (const itemRef of receiptData.items) {
          // اگر آیتم به صورت object populated آمده باشد
          if (typeof itemRef === "object" && itemRef.id) {
            const itemData = itemRef;
            
            const formattedItem = {
              itemId: itemData.id, // ⭐ ID واقعی آیتم
              description: itemData.product?.id || itemData.product || "",
              productName: itemData.product?.name || "",
              group: itemData.product?.category || "", // ⭐ گروه محصول
              nationalProductId: itemData.national_product_id || itemData.nationalProductId || "",
              productDescription: itemData.product_description || itemData.productDescription || "",
              count: itemData.count || 0,
              unit: itemData.unit || "",
              productionType: itemData.productionType || null,
              isUsed: itemData.isUsed || false,
              isDefective: itemData.isDefective || false,

              fullWeight: itemData.weights?.fullWeight || 0,
              emptyWeight: itemData.weights?.emptyWeight || 0,
              netWeight: itemData.weights?.netWeight || 0,
              originWeight: itemData.weights?.originWeight || 0,
              weightDiff: itemData.weights?.weightDiff || 0,

              length: itemData.dimensions?.length || 0,
              width: itemData.dimensions?.width || 0,
              thickness: itemData.dimensions?.thickness || 0,

              heatNumber: itemData.heatNumber || "",
              bundleNo: itemData.bundleNo || "",
              brand: itemData.brand || "",
              orderNo: itemData.orderNo || "",
              depoLocation: itemData.depoLocation || "",
              descriptionNotes: itemData.descriptionNotes || "",
              row: itemData.row || "",
            };

            loadedItems.push(formattedItem);
          } else {
            // اگر فقط ID آمده باشد، باید fetch کنیم
            const itemId = itemRef;

            try {
              const itemData = await get(`/receiptitems/${itemId}`);

              const formattedItem = {
                itemId: itemData.id, // ⭐ ID واقعی آیتم
                description: itemData.product?.id || itemData.product || "",
                productName: itemData.product?.name || "",
                nationalProductId: itemData.national_product_id || itemData.nationalProductId || "",
                productDescription: itemData.product_description || itemData.productDescription || "",
                count: itemData.count || 0,
                unit: itemData.unit || "",
                productionType: itemData.productionType || null,
                isUsed: itemData.isUsed || false,
                isDefective: itemData.isDefective || false,

                fullWeight: itemData.weights?.fullWeight || 0,
                emptyWeight: itemData.weights?.emptyWeight || 0,
                netWeight: itemData.weights?.netWeight || 0,
                originWeight: itemData.weights?.originWeight || 0,
                weightDiff: itemData.weights?.weightDiff || 0,

                length: itemData.dimensions?.length || 0,
                width: itemData.dimensions?.width || 0,
                thickness: itemData.dimensions?.thickness || 0,

                heatNumber: itemData.heatNumber || "",
                bundleNo: itemData.bundleNo || "",
                brand: itemData.brand || "",
                orderNo: itemData.orderNo || "",
                depoLocation: itemData.depoLocation || "",
                descriptionNotes: itemData.descriptionNotes || "",
                row: itemData.row || "",
              };

              loadedItems.push(formattedItem);
            } catch (err) {
            }
          }
        }

     
        // ⭐ مهم: ابتدا items را set کنیم
        setItems(loadedItems);
      }

    } catch (err) {
      setLoadError("خطا در بارگذاری اطلاعات رسید: " + (err.message || "خطای ناشناخته"));
    } finally {
      setLoading(false);
    
    }
  };

  // ---------------------- UTIL ----------------------
  const formatDate = (d) => {
    if (!d) return null;
    if (typeof d === "string") return d;
    if (d.toDate) return d.toDate().toISOString();
    return null;
  };

  const getMemberId = () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      if (user.id) return user.id;

      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("Token not found");

      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const payload = JSON.parse(window.atob(base64));

      return payload.id;
    } catch (err) {
      throw new Error("اطلاعات کاربر یافت نشد. لطفاً دوباره وارد شوید.");
    }
  };

  // ------------------- آپدیت آیتم‌ها -------------------
  const updateItemsInBackend = async (currentItems) => {
    const itemIDs = [];

    for (let i = 0; i < currentItems.length; i++) {
      const row = currentItems[i];

      // ⭐ مهم: description همان product ID است
      const productId = row.description ? Number(row.description) : null;


      const payloadItem = {
        product: productId,
        nationalProductId: row.nationalProductId || "",
        productDescription: row.productDescription || "",
        count: Number(row.count) || 0,
        unit: row.unit || "",
        productionType: row.productionType || null,
        isUsed: row.isUsed || false,
        isDefective: row.isDefective || false,

        weights: {
          fullWeight: Number(row.fullWeight) || 0,
          emptyWeight: Number(row.emptyWeight) || 0,
          netWeight: Number(row.netWeight) || 0,
          originWeight: Number(row.originWeight) || 0,
          weightDiff: Number(row.weightDiff) || 0,
        },

        dimensions: {
          length: Number(row.length) || 0,
          width: Number(row.width) || 0,
          thickness: Number(row.thickness) || 0,
        },

        heatNumber: row.heatNumber || "",
        bundleNo: row.bundleNo || "",
        brand: row.brand || "",
        orderNo: row.orderNo || "",
        depoLocation: row.depoLocation || "",
        descriptionNotes: row.descriptionNotes || "",
        row: row.row || "",
      };


      // اگر آیتم itemId دارد، آپدیت می‌کنیم، در غیر این صورت جدید می‌سازیم
      if (row.itemId) {
        
        try {
          // ⭐ تلاش با PATCH به جای PUT
          const res = await fetch(`https://portal.anbardaranrey.ir/api/receiptitems/${row.itemId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            },
            body: JSON.stringify(payloadItem)
          });

          if (!res.ok) {
            throw new Error(`Failed to update item: ${res.status}`);
          }

          const result = await res.json();
          const itemId = result?.doc?.id || result?.id || row.itemId;
          itemIDs.push(itemId);
        } catch (err) {
          // اگر PATCH کار نکرد، آیتم جدید بسازیم
          const res = await post("/receiptitems", payloadItem);
          const itemId = res?.doc?.id || res?.id;
          itemIDs.push(itemId);
        }
      } else {
        const res = await post("/receiptitems", payloadItem);
        const itemId = res?.doc?.id || res?.id;
        itemIDs.push(itemId);
      }
    }

    return itemIDs;
  };

  // --------------------- آپدیت رسید ---------------------
  const updateReceipt = async (status) => {
    try {
     
      setSaving(true);
      setError("");
      setSuccess("");

      // ─────────────────────────────────────────────
      // اعتبارسنجی
      // ─────────────────────────────────────────────
      if (!owner.id) {
        setError("لطفاً مالک را انتخاب کنید");
        return;
      }

      if (items.length === 0) {
        setError("حداقل یک آیتم باید ثبت شود");
        return;
      }

      // ─────────────────────────────────────────────
      // آپدیت آیتم‌ها
      // ─────────────────────────────────────────────
      const itemIDs = await updateItemsInBackend(items);
      const memberId = getMemberId();

      // ─────────────────────────────────────────────
      // ساخت Payload
      // ─────────────────────────────────────────────
      const payload = {
        status,
        docDate: formatDate(docDate),
        owner: Number(owner.id),
        deliverer: deliverer.id ? Number(deliverer.id) : null,

        driver: {
          name: driver.name || "",
          nationalId: driver.nationalId || "",
          phone: driver.phone || "",
          birthDate: formatDate(birthDateDriver) || null,
        },

        dischargeDate: formatDate(dischargeDate) || null,

        plate: {
          iranRight: plate.right2 || "",
          mid3: plate.middle3 || "",
          letter: plate.letter || "",
          left2: plate.left2 || "",
        },

        finance: {
          loadCost: Number(finance.loadCost) || 0,
          unloadCost: Number(finance.unloadCost) || 0,
          warehouseCost: Number(finance.warehouseCost) || 0,
          tax: Number(finance.tax) || 0,
          returnFreight: Number(finance.returnFreight) || 0,
          loadingFee: Number(finance.loadingFee) || 0,
          miscCost: Number(finance.miscCost) || 0,
          miscDescription: finance.miscDescription || "",
        },

        payment: {
          paymentBy,
          cardNumber: paymentInfo.cardNumber || "",
          accountNumber: paymentInfo.accountNumber || "",
          bankName: paymentInfo.bankName || "",
          ownerName: paymentInfo.ownerName || "",
          trackingCode: paymentInfo.trackingCode || "",
        },

        refDocument: {
          refType,
          barnamehNumber: refValues.barnamehNumber || "",
          barnamehDate: formatDate(barnamehDate) || null,
          barnamehTracking: refValues.barnamehTracking || "",
          pettehNumber: refValues.pettehNumber || "",
          havaleNumber: refValues.havaleNumber || "",
          productionNumber: refValues.productionNumber || "",
        },

        items: itemIDs,
        member: memberId,
      };
    
      // ⭐ استفاده از PATCH به جای PUT
      const response = await fetch(`https://portal.anbardaranrey.ir/api/receipts/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to update receipt: ${response.status} - ${errorData.message || 'Unknown error'}`);
      }

      const result = await response.json();
      
      if (result?.id || result?.doc?.id) {
        const receiptNo = result?.doc?.receiptNo || result?.receiptNo;
        setSuccess(`🎉 رسید با موفقیت به‌روزرسانی شد! شماره: ${receiptNo}`);

        setTimeout(() => {
          navigate(`/receipts/${id}`);
        }, 1500);
      }
    } catch (err) {
  
      setError("خطا در به‌روزرسانی رسید: " + (err.message || "خطای ناشناخته"));
    } finally {
      setSaving(false);

    }
  };

  // ---------------------- UI ----------------------
  if (loading) {
    return (
      <div className="page-content">
        <Card className="shadow-sm">
          <CardBody className="text-center py-5">
            <Spinner color="primary" />
            <div className="mt-3">در حال بارگذاری اطلاعات رسید...</div>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="page-content">
        <Card className="shadow-sm">
          <CardBody>
            <Alert color="danger">{loadError}</Alert>
            <Button color="secondary" onClick={() => navigate("/receipt/list")}>
              بازگشت به لیست رسیدها
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="page-content">
      <Card className="shadow-sm receipt-main-card">
        <div className="receipt-main-header">
          <div>
            <div className="title">
              <i className="ri-edit-line me-2"></i>
              ویرایش رسید کالا
            </div>
            <div className="subtitle">ویرایش اطلاعات رسید شماره {id}</div>
          </div>
        </div>

        <CardBody>
          {error && <Alert color="danger">{error}</Alert>}
          {success && <Alert color="success">{success}</Alert>}

          <ReceiptDocInfo docDate={docDate} setDocDate={setDocDate} />

          <ReceiptOwnerSection
            owner={owner}
            setOwner={setOwner}
            deliverer={deliverer}
            setDeliverer={setDeliverer}
          />

          <ReceiptRefSection
            refType={refType}
            setRefType={setRefType}
            refValues={refValues}
            updateRefValue={updateRefValue}
            barnamehDate={barnamehDate}
            setBarnamehDate={setBarnamehDate}
          />

          <ReceiptHeader
            birthDateDriver={birthDateDriver}
            setBirthDateDriver={setBirthDateDriver}
            dischargeDate={dischargeDate}
            setDischargeDate={setDischargeDate}
            driver={driver}
            setDriver={setDriver}
            plate={plate}
            setPlate={setPlate}
          />

          <ReceiptItemsTable 
            onItemsChange={setItems}
            initialItems={items}
          />

          <ReceiptCosts finance={finance} setFinance={setFinance} />

          <ReceiptPaymentSection
            paymentBy={paymentBy}
            setPaymentBy={setPaymentBy}
            paymentInfo={paymentInfo}
            setPaymentInfo={setPaymentInfo}
          />

          <div className="form-footer-actions d-flex gap-2 mt-4">
            <Button
              color="secondary"
              size="lg"
              onClick={() => navigate(`/receipts/${id}`)}
              disabled={saving}
            >
              انصراف
            </Button>

            <Button
              color="warning"
              size="lg"
              disabled={saving}
              onClick={() => updateReceipt("draft")}
            >
              {saving ? "در حال ذخیره..." : "ذخیره موقت"}
            </Button>

            <Button
              color="success"
              size="lg"
              disabled={saving}
              onClick={() => updateReceipt("final")}
            >
              {saving ? "در حال ذخیره..." : "ذخیره قطعی"}
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default EditReceipt;