// src/pages/Receipt/ReceiptForm.jsx
import React, { useState } from "react";
import { Card, CardBody, Button, Alert } from "reactstrap";

import { post } from "../../helpers/api_helper";

import "../../assets/scss/receipt.scss";
import "../../assets/scss/receipt-items-table.scss";
import "../../assets/scss/receipt-costs.scss";

// Components
import ReceiptOwnerSection from "../../components/Receipt/ReceiptOwnerSection";
import ReceiptHeader from "../../components/Receipt/ReceiptHeader";
import ReceiptDocInfo from "../../components/Receipt/ReceiptDocInfo";
import ReceiptRefSection from "../../components/Receipt/ReceiptRefSection";
import ReceiptItemsTable from "../../components/Receipt/ReceiptItemsTable";
import ReceiptCosts from "../../components/Receipt/ReceiptCosts";
import ReceiptPaymentSection from "../../components/Receipt/ReceiptPaymentSection";

const ReceiptForm = () => {
  // ------------------- STATE -------------------
  const [refType, setRefType] = useState("none");
  const [docDate, setDocDate] = useState("");
  const [barnamehDate, setBarnamehDate] = useState("");
  const [birthDateDriver, setBirthDateDriver] = useState("");
  const [dischargeDate, setDischargeDate] = useState("");

  const [owner, setOwner] = useState({});
  const [deliverer, setDeliverer] = useState({});

  const [items, setItems] = useState([]);

  const [plate, setPlate] = useState({
    iranRight: "",
    mid3: "",
    letter: "",
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

  // ------------------- UTIL -------------------
  const formatDate = (d) => {
    if (!d) return null;
    if (typeof d === "string") return d;
    if (d.toDate) return d.toDate().toISOString();
    return null;
  };

  // ✅ گرفتن Member ID
  const getMemberId = () => {
    try {
      // اول از user
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      if (user.id) return user.id;

      // بعد از token
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
    const savedIDs = [];

    console.log("🟦 شروع ذخیره آیتم‌ها در receiptitems...");

    const memberId = getMemberId();
    console.log("👤 Member ID:", memberId);

    for (let row of items) {
      try {
        if (!row.description) {
          throw new Error(`ردیف ${row.id}: نام کالا الزامی است`);
        }

        // ✅ گرفتن نام گروه و کالا
        let categoryName = "";
        let productName = "";

        if (row.group) {
          try {
            const catRes = await fetch(
              `https://cms.anbardaranrey.ir/api/product-categories/${row.group}`,
              {
                headers: {
                  Authorization: `Bearer ${localStorage.getItem("authToken")}`,
                },
              }
            );
            const catData = await catRes.json();
            categoryName = catData.name || "";
          } catch (err) {
            console.warn("خطا در گرفتن نام گروه:", err);
          }
        }

        if (row.description) {
          try {
            const prodRes = await fetch(
              `https://cms.anbardaranrey.ir/api/products/${row.description}`,
              {
                headers: {
                  Authorization: `Bearer ${localStorage.getItem("authToken")}`,
                },
              }
            );
            const prodData = await prodRes.json();
            productName = prodData.name || "";
          } catch (err) {
            console.warn("خطا در گرفتن نام کالا:", err);
          }
        }

        const payloadItem = {
          nationalProductId: row.nationalProductId || "",
          productDescription: row.productDescription || "",

          group: categoryName,
          description: productName,

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

        console.log("➡️ ارسال آیتم به Payload:", payloadItem);

        const res = await post("/receiptitems", payloadItem);

        console.log("⬅️ پاسخ Payload برای آیتم:", res);

        const itemId = res?.doc?.id || res?.id;

        if (!itemId) {
          throw new Error("در ذخیره یکی از آیتم‌ها مشکل وجود دارد");
        }

        savedIDs.push(itemId);
      } catch (err) {
        console.error("❌ خطا در ذخیره آیتم:", err);

        if (err.response?.data?.errors) {
          console.error("📋 خطاهای Payload:");
          err.response.data.errors.forEach((error, index) => {
            console.error(`  ${index + 1}.`, error);
            if (error.data?.errors) {
              error.data.errors.forEach((fieldError) => {
                console.error(`     - ${fieldError.path}: ${fieldError.message}`);
              });
            }
          });
        }

        throw err;
      }
    }

    console.log("🟩 شناسه آیتم‌های ذخیره‌شده:", savedIDs);
    return savedIDs;
  };

  // ------------------- ذخیره اصلی Receipt -------------------
  const saveReceipt = async (status) => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      // ✅ Validation
      if (!owner.id) {
        setError("لطفاً مالک را انتخاب کنید");
        setSaving(false);
        return;
      }

      if (items.length === 0) {
        setError("حداقل یک آیتم کالا باید ثبت شود");
        setSaving(false);
        return;
      }

      // ✅ چک کردن نام کالا
      const invalidItems = items.filter((item) => !item.description);
      if (invalidItems.length > 0) {
        setError(`لطفاً برای ${invalidItems.length} ردیف، نام کالا را انتخاب کنید`);
        setSaving(false);
        return;
      }

      console.log("🟦 شروع ذخیره Receipt...");

      // ✅ گرفتن Member ID
      const memberId = getMemberId();

      // 1) ذخیره آیتم‌ها
      const itemIDs = await saveItemsToBackend();

      // 2) آماده کردن Payload رسید
      const payload = {
        status,
        docDate: formatDate(docDate),
        owner: Number(owner.id),
        deliverer: deliverer.id ? Number(deliverer.id) : null,

        driver: {
          name: deliverer.name || "",
          nationalId: deliverer.nationalId || "",
          birthDate: formatDate(birthDateDriver) || null,
        },

        plate: {
          iranRight: plate.iranRight || "",
          mid3: plate.mid3 || "",
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
          paymentBy: paymentBy || null,
          cardNumber: paymentInfo.cardNumber || "",
          accountNumber: paymentInfo.accountNumber || "",
          bankName: paymentInfo.bankName || "",
          ownerName: paymentInfo.ownerName || "",
          trackingCode: paymentInfo.trackingCode || "",
        },

        items: itemIDs,

        // ✅ اضافه کردن member
        member: memberId,
      };

      console.log("➡️ ارسال Receipt به Payload:", payload);

      const result = await post("/receipts", payload);

      console.log("⬅️ پاسخ Payload برای Receipt:", result);

      if (result?.id || result?.doc?.id) {
        const receiptId = result?.doc?.id || result?.id;
        const receiptNo = result?.doc?.receiptNo || result?.receiptNo || receiptId;

        setSuccess(`🎉 رسید با موفقیت ثبت شد! شماره رسید: ${receiptNo}`);

        // ✅ پاک کردن فرم بعد از 3 ثانیه
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      } else {
        setError("خطا در ذخیره رسید");
      }
    } catch (err) {
      console.error("❌ خطای اصلی Payload:", err);

      let errorMessage = "خطای ناشناخته";

      if (err?.response?.data?.errors) {
        console.error("📋 خطاهای دقیق:");
        err.response.data.errors.forEach((error, i) => {
          console.error(`  ${i + 1}. ${error.message}`);
          if (error.data?.errors) {
            error.data.errors.forEach((fe) => {
              console.error(`     - ${fe.path}: ${fe.message}`);
            });
          }
        });

        const firstError = err.response.data.errors[0];
        if (firstError.data?.errors) {
          errorMessage = firstError.data.errors
            .map((e) => `${e.label}: ${e.message}`)
            .join(", ");
        } else {
          errorMessage = firstError.message;
        }
      } else if (err?.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError("خطای Payload: " + errorMessage);
    }

    setSaving(false);
  };

  // ------------------- UI -------------------
  return (
    <div className="page-content">
      <Card className="shadow-sm receipt-main-card">
        <div className="receipt-main-header">
          <div>
            <div className="title">
              <i className="ri-archive-2-line me-2"></i>
              رسید کالا
            </div>
            <div className="subtitle">
              ثبت ورود کالا به انبار به همراه مشخصات راننده و کالا
            </div>
          </div>
        </div>

        <CardBody>
          {error && (
            <Alert color="danger" className="d-flex align-items-center">
              <i className="ri-error-warning-line me-2 fs-5"></i>
              <div>{error}</div>
            </Alert>
          )}

          {success && (
            <Alert color="success" className="d-flex align-items-center">
              <i className="ri-checkbox-circle-line me-2 fs-5"></i>
              <div>{success}</div>
            </Alert>
          )}

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
            barnamehDate={barnamehDate}
            setBarnamehDate={setBarnamehDate}
            birthDateDriver={birthDateDriver}
            setBirthDateDriver={setBirthDateDriver}
            plate={plate}
            setPlate={setPlate}
          />

          <ReceiptHeader
            birthDateDriver={birthDateDriver}
            setBirthDateDriver={setBirthDateDriver}
            dischargeDate={dischargeDate}
            setDischargeDate={setDischargeDate}
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
              className="px-4"
            >
              {saving ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  در حال ذخیره...
                </>
              ) : (
                <>
                  <i className="ri-draft-line me-2"></i>
                  ثبت موقت
                </>
              )}
            </Button>

            <Button
              color="success"
              size="lg"
              disabled={saving}
              onClick={() => saveReceipt("final")}
              className="px-4"
            >
              {saving ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  در حال ذخیره...
                </>
              ) : (
                <>
                  <i className="ri-check-double-line me-2"></i>
                  ثبت قطعی
                </>
              )}
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default ReceiptForm;