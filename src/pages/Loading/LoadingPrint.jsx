import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Spinner, Button } from "reactstrap";

// 1. سرویس دریافت اطلاعات
import { getLoadingOrderDetails } from "../../services/loadingService";

// 2. فراخوانی کامپوننت قالب چاپ که ساختیم
import LoadingPrintTemplate from "../../components/Prints/LoadingPrint";

export default function LoadingPrint() {
    const { id } = useParams();
    const [data, setData] = useState(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const res = await getLoadingOrderDetails(id);
                setData(res);

                // تاخیر کوتاه برای رندر شدن DOM و سپس باز شدن پنجره پرینت
                setTimeout(() => {
                    window.print();
                }, 800);
            } catch (err) {
                console.error(err);
                setError(true);
            }
        };
        fetchDetails();
    }, [id]);

    // حالت خطا
    if (error) {
        return (
            <div className="text-center p-5">
                <h4 className="text-danger">خطا در دریافت اطلاعات سند</h4>
                <Button color="secondary" onClick={() => window.close()}>بستن</Button>
            </div>
        );
    }

    // حالت لودینگ
    if (!data) {
        return (
            <div className="d-flex flex-column justify-content-center align-items-center" style={{ height: "100vh", backgroundColor: '#f8f9fa' }}>
                <Spinner color="primary" style={{width: '3rem', height: '3rem'}} />
                <span className="mt-3 fw-bold text-secondary">در حال آماده‌سازی سند چاپ...</span>
            </div>
        );
    }

    return (
        <div style={{ backgroundColor: '#fff', minHeight: '100vh' }}>

            {/* دکمه‌های کنترلی (در پرینت مخفی می‌شوند) */}
            <div className="d-print-none p-3 text-end bg-light border-bottom sticky-top">
                <Button color="primary" size="sm" onClick={() => window.print()}>
                    <i className="bx bx-printer me-1"></i> چاپ مجدد
                </Button>
                <Button color="secondary" size="sm" className="ms-2" onClick={() => window.close()}>
                    بستن پنجره
                </Button>
            </div>

            {/* کامپوننت قالب چاپ */}
            <LoadingPrintTemplate data={data} />

        </div>
    );
}