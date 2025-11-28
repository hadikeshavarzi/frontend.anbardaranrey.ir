// src/pages/Receipt/ReceiptForm.jsx
import React, { useState } from "react";
import { Card, CardBody, Row, Col, Button, Alert } from "reactstrap";

import "../../assets/scss/receipt.scss";
import "../../assets/scss/receipt-items-table.scss";
import "../../assets/scss/receipt-costs.scss";

// کامپوننت‌های ماژولار
import ReceiptOwnerSection from "../../components/Receipt/ReceiptOwnerSection";
import ReceiptHeader from "../../components/Receipt/ReceiptHeader";
import ReceiptDocInfo from "../../components/Receipt/ReceiptDocInfo";
import ReceiptRefSection from "../../components/Receipt/ReceiptRefSection";
import ReceiptItemsTable from "../../components/Receipt/ReceiptItemsTable";
import ReceiptCosts from "../../components/Receipt/ReceiptCosts";
import ColumnManagerModal from "../../components/Receipt/ColumnManagerModal";
import ReceiptPaymentSection from "../../components/Receipt/ReceiptPaymentSection";

const ReceiptForm = () => {

    // ==================== STATE های اصلی فرم ====================
    const [refType, setRefType] = useState("none");
    const [docDate, setDocDate] = useState("");
    const [barnamehDate, setBarnamehDate] = useState("");
    const [birthDateDriver, setBirthDateDriver] = useState("");
    const [dischargeDate, setDischargeDate] = useState("");

    const [deliverer, setDeliverer] = useState({
        nationalId: "",
        name: "",
        birthDate: "",
    });

    const [owner, setOwner] = useState({
        nationalId: "",
        name: "",
        birthDate: "",
    });

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

    const [showColumnManager, setShowColumnManager] = useState(false);


    // پرداخت هزینه‌ها
    const [paymentBy, setPaymentBy] = useState("customer"); // customer | warehouse

    const [paymentInfo, setPaymentInfo] = useState({
        cardNumber: "",
        accountNumber: "",
        bankName: "",
        ownerName: "",
        trackingCode: "",
    });


    // ==================== ACTIONS ====================

    // سند جدید - پاک کردن فرم
    const handleNewDocument = () => {
        if (window.confirm("آیا از ایجاد سند جدید اطمینان دارید؟ اطلاعات فعلی پاک خواهد شد.")) {
            setRefType("none");
            setDocDate("");
            setBarnamehDate("");
            setBirthDateDriver("");
            setDischargeDate("");
            setDeliverer({ nationalId: "", name: "", birthDate: "" });
            setOwner({ nationalId: "", name: "", birthDate: "" });
            setPlate({ iranRight: "", mid3: "", letter: "", left2: "" });
            setFinance({
                loadCost: "",
                unloadCost: "",
                warehouseCost: "",
                tax: "",
                returnFreight: "",
                loadingFee: "",
                miscCost: "",
                miscDescription: "",
            });
        }
    };

    // ثبت موقت
    const handleSaveDraft = () => {
        const payload = {
            status: "draft",
            refType,
            docDate,
            barnamehDate,
            birthDateDriver,
            dischargeDate,
            deliverer,
            owner,
            plate,
            finance,
        };
        console.log("ثبت موقت:", payload);
        // TODO: API call
        alert("رسید به صورت موقت ذخیره شد.");
    };

    // ثبت قطعی
    const handleSaveFinal = () => {
        const payload = {
            status: "final",
            refType,
            docDate,
            barnamehDate,
            birthDateDriver,
            dischargeDate,
            deliverer,
            owner,
            plate,
            finance,
        };
        console.log("ثبت قطعی:", payload);
        // TODO: API call
        alert("رسید به صورت قطعی ثبت شد.");
    };

    // چاپ
    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="page-content">
            <Card className="shadow-sm receipt-main-card">

                {/* ------------------ HEADER اصلی صفحه ------------------ */}
                <div className="receipt-main-header">
                    <div>
                        <div className="title">
                            <i className="ri-archive-2-line me-2"></i>
                            رسید کالا
                        </div>
                        <div className="subtitle">
                            ثبت ورود کالا به انبار به همراه مشخصات راننده، مالک و کالا
                        </div>
                    </div>
                </div>

                <CardBody>

                    {/* دکمه جستجو */}
                    <Row className="mb-3">
                        <Col className="d-flex justify-content-end">
                            <Button color="primary" size="sm" outline>
                                <i className="ri-search-line me-1"></i>
                                جستجو رسید
                            </Button>
                        </Col>
                    </Row>

                    <Alert color="warning" className="text-center fw-bold small mb-4">
                        توجه: فیلدهای ستاره‌دار اجباری هستند.
                    </Alert>

                    {/* ------------------ کارت اطلاعات سند ------------------ */}
                    <ReceiptDocInfo
                        docDate={docDate}
                        setDocDate={setDocDate}
                    />

                    {/* ------------------ تحویل‌دهنده / مالک کالا ------------------ */}
                    <ReceiptOwnerSection
                        deliverer={deliverer}
                        setDeliverer={setDeliverer}
                        owner={owner}
                        setOwner={setOwner}
                    />

                    {/* ------------------ کارت نوع سند مرجع ------------------ */}
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

                    {/* ------------------ کارت اطلاعات راننده ------------------ */}
                    <ReceiptHeader
                        birthDateDriver={birthDateDriver}
                        setBirthDateDriver={setBirthDateDriver}
                        dischargeDate={dischargeDate}
                        setDischargeDate={setDischargeDate}
                        plate={plate}
                        setPlate={setPlate}
                    />

                    {/* ------------------ جدول کالا ------------------ */}
                    <ReceiptItemsTable
                        openColumnManager={() => setShowColumnManager(true)}
                    />

                    {/* ------------------ مدیریت ستون‌ها ------------------ */}
                    <ColumnManagerModal
                        isOpen={showColumnManager}
                        toggle={() => setShowColumnManager(!showColumnManager)}
                    />

                    {/* ------------------ هزینه‌ها ------------------ */}
                    <ReceiptCosts
                        finance={finance}
                        setFinance={setFinance}
                    />
                    {/* ------------------ پرداخت ------------------ */}

                    <ReceiptPaymentSection
                        paymentBy={paymentBy}
                        setPaymentBy={setPaymentBy}
                        paymentInfo={paymentInfo}
                        setPaymentInfo={setPaymentInfo}
                    />

                    {/* ------------------ دکمه‌های اکشن پایین فرم ------------------ */}
                    <div className="form-footer-actions">
                        <Button
                            color="info"
                            outline
                            onClick={handleNewDocument}
                            className="action-btn"
                        >
                            <i className="ri-file-add-line"></i>
                            سند جدید
                        </Button>

                        <div className="d-flex gap-2">
                            <Button
                                color="secondary"
                                outline
                                onClick={handlePrint}
                                className="action-btn"
                            >
                                <i className="ri-printer-line"></i>
                                چاپ
                            </Button>

                            <Button
                                color="warning"
                                onClick={handleSaveDraft}
                                className="action-btn"
                            >
                                <i className="ri-draft-line"></i>
                                ثبت موقت
                            </Button>

                            <Button
                                color="success"
                                onClick={handleSaveFinal}
                                className="action-btn"
                            >
                                <i className="ri-checkbox-circle-line"></i>
                                ثبت دائم
                            </Button>
                        </div>
                    </div>

                </CardBody>
            </Card>
        </div>
    );
};

export default ReceiptForm;
