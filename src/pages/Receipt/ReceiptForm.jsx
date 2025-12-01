import React, { useState } from "react";
import { Card, CardBody, Button, Alert } from "reactstrap";
import { post } from "../../helpers/api_helper";

import "../../assets/scss/receipt.scss";
import "../../assets/scss/receipt-items-table.scss";
import "../../assets/scss/receipt-costs.scss";

import ReceiptOwnerSection from "../../components/Receipt/ReceiptOwnerSection";
import ReceiptHeader from "../../components/Receipt/ReceiptHeader";
import ReceiptDocInfo from "../../components/Receipt/ReceiptDocInfo";
import ReceiptRefSection from "../../components/Receipt/ReceiptRefSection";
import ReceiptItemsTable from "../../components/Receipt/ReceiptItemsTable";
import ReceiptCosts from "../../components/Receipt/ReceiptCosts";
import ReceiptPaymentSection from "../../components/Receipt/ReceiptPaymentSection";

const ReceiptForm = () => {
  const [refType, setRefType] = useState("none");

  const [refValues, setRefValues] = useState({
    barnamehNumber: "",
    barnamehTracking: "",
    pettehNumber: "",
    havaleNumber: "",
    productionNumber: "",
  });

  // ⭐ تابع با لاگ کامل
  const updateRefValue = (key, value) => {
    console.log("═══════════════════════════════════════");
    console.log("🔄 updateRefValue فراخوانی شد");
    console.log("📊 State قبلی:", JSON.stringify(refValues, null, 2));
    console.log(`📝 کلید دریافتی: "${key}"`);
    console.log(`💬 مقدار دریافتی: "${value}"`);
    
    setRefValues((prev) => {
      const newState = { ...prev, [key]: value };
      console.log("✅ State جدید:", JSON.stringify(newState, null, 2));
      console.log("═══════════════════════════════════════");
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
      console.error("خطا در گرفتن Member ID:", err);
      throw new Error("اطلاعات کاربر یافت نشد. لطفاً دوباره وارد شوید.");
    }
  };

  // ------------------- ذخیره آیتم‌ها -------------------
  const saveItemsToBackend = async () => {
    console.log("\n🔹🔹🔹 شروع ذخیره آیتم‌ها 🔹🔹🔹");
    const savedIDs = [];

    for (let i = 0; i < items.length; i++) {
      const row = items[i];
      console.log(`\n📦 آیتم ${i + 1}/${items.length}:`, row);

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

      console.log("📤 Payload آیتم:", JSON.stringify(payloadItem, null, 2));

      const res = await post("/receiptitems", payloadItem);
      const itemId = res?.doc?.id || res?.id;
      
      console.log(`✅ آیتم ذخیره شد با ID: ${itemId}`);
      savedIDs.push(itemId);
    }

    console.log("\n✅ تمام آیتم‌ها ذخیره شدند. IDs:", savedIDs);
    return savedIDs;
  };

  // --------------------- ذخیره رسید ---------------------
  const saveReceipt = async (status) => {
    try {
      console.log("\n\n");
      console.log("╔═══════════════════════════════════════════════════╗");
      console.log("║         🚀 شروع ذخیره رسید                      ║");
      console.log("╚═══════════════════════════════════════════════════╝");
      console.log(`📊 وضعیت: ${status}`);

      setSaving(true);
      setError("");
      setSuccess("");

      // ─────────────────────────────────────────────
      // اعتبارسنجی
      // ─────────────────────────────────────────────
      if (!owner.id) {
        setError("لطفاً مالک را انتخاب کنید");
        console.error("❌ مالک انتخاب نشده است");
        return;
      }

      if (items.length === 0) {
        setError("حداقل یک آیتم باید ثبت شود");
        console.error("❌ هیچ آیتمی ثبت نشده است");
        return;
      }

      // ─────────────────────────────────────────────
      // ذخیره آیتم‌ها
      // ─────────────────────────────────────────────
      const itemIDs = await saveItemsToBackend();
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

      // ─────────────────────────────────────────────
      // لاگ Payload کامل
      // ─────────────────────────────────────────────
      console.log("\n📤 Payload نهایی که به بک‌اند ارسال می‌شود:");
      console.log("═══════════════════════════════════════════════════");
      console.log(JSON.stringify(payload, null, 2));
      console.log("═══════════════════════════════════════════════════");

      // ─────────────────────────────────────────────
      // لاگ اختصاصی برای فیلدهای مرجع
      // ─────────────────────────────────────────────
      console.log("\n🔍 بررسی فیلدهای refDocument:");
      console.log("─────────────────────────────────────────────");
      console.log("refType:", payload.refDocument.refType);
      console.log("barnamehNumber:", payload.refDocument.barnamehNumber);
      console.log("barnamehTracking:", payload.refDocument.barnamehTracking);
      console.log("barnamehDate:", payload.refDocument.barnamehDate);
      console.log("pettehNumber:", payload.refDocument.pettehNumber);
      console.log("havaleNumber:", payload.refDocument.havaleNumber);
      console.log("productionNumber:", payload.refDocument.productionNumber);
      console.log("─────────────────────────────────────────────");

      // ─────────────────────────────────────────────
      // ارسال به بک‌اند
      // ─────────────────────────────────────────────
      console.log("\n🚀 ارسال به بک‌اند...");
      const result = await post("/receipts", payload);
      
      console.log("\n✅ پاسخ دریافتی از بک‌اند:");
      console.log(JSON.stringify(result, null, 2));

      if (result?.id || result?.doc?.id) {
        const receiptNo = result?.doc?.receiptNo || result?.receiptNo;
        console.log(`\n🎉 رسید با موفقیت ثبت شد! شماره: ${receiptNo}`);
        setSuccess(`🎉 رسید با موفقیت ثبت شد! شماره: ${receiptNo}`);

        setTimeout(() => window.location.reload(), 2000);
      }
    } catch (err) {
      console.error("\n❌ خطا در ذخیره رسید:");
      console.error(err);
      console.error("Stack trace:", err.stack);
      setError("خطا در ذخیره رسید: " + (err.message || "خطای ناشناخته"));
    } finally {
      setSaving(false);
      console.log("\n╔═══════════════════════════════════════════════════╗");
      console.log("║         🏁 پایان فرآیند ذخیره                   ║");
      console.log("╚═══════════════════════════════════════════════════╝\n\n");
    }
  };

  return (
    <div className="page-content">
      <Card className="shadow-sm receipt-main-card">
        <div className="receipt-main-header">
          <div>
            <div className="title">
              <i className="ri-archive-2-line me-2"></i>
              رسید کالا
            </div>
            <div className="subtitle">ثبت ورود کالا به انبار</div>
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

          <ReceiptItemsTable onItemsChange={setItems} />

          <ReceiptCosts finance={finance} setFinance={setFinance} />

          <ReceiptPaymentSection
            paymentBy={paymentBy}
            setPaymentBy={setPaymentBy}
            paymentInfo={paymentInfo}
            setPaymentInfo={setPaymentInfo}
          />

          <div className="form-footer-actions d-flex gap-2 mt-4">
            <Button
              color="warning"
              size="lg"
              disabled={saving}
              onClick={() => saveReceipt("draft")}
            >
              {saving ? "در حال ذخیره..." : "ثبت موقت"}
            </Button>

            <Button
              color="success"
              size="lg"
              disabled={saving}
              onClick={() => saveReceipt("final")}
            >
              {saving ? "در حال ذخیره..." : "ثبت قطعی"}
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default ReceiptForm;
