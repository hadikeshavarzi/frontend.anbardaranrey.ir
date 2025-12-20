import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getExitDetailsForPrint } from "../../../services/exitService";
import { QRCodeSVG } from "qrcode.react";
import "./ExitPrint.css";

const ExitPrint = () => {
    const { id } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState(null);

    useEffect(() => {
        if (id) {
            getExitDetailsForPrint(id)
                .then((res) => {
                    setData(res);
                    setLoading(false);
                })
                .catch((err) => {
                    console.error("Print Error:", err);
                    setErrorMsg(err.message || "خطا در دریافت اطلاعات");
                    setLoading(false);
                });
        }
    }, [id]);

    useEffect(() => {
        if (!loading && data && !errorMsg) {
            const timer = setTimeout(() => window.print(), 800);
            return () => clearTimeout(timer);
        }
    }, [loading, data, errorMsg]);

    if (loading) return (
        <div className="d-flex justify-content-center align-items-center vh-100 bg-white">
            <div className="spinner-border text-primary"></div>
            <span className="ms-2">در حال آماده‌سازی...</span>
        </div>
    );

    if (errorMsg) return <div className="alert alert-danger m-5">{errorMsg}</div>;
    if (!data) return null;

    const qrUrl = `${window.location.origin}/exit/view/${data.id}`;

    // محاسبات مالی
    const totalStorage = Number(data.total_fee) || 0;
    const totalLoading = Number(data.total_loading_fee) || 0;
    const weighbridgeAndExtra = Number(data.weighbridge_fee || 0) + Number(data.extra_fee || 0);
    const vat = Number(data.vat_fee) || 0;
    const grandTotal = totalStorage + totalLoading + weighbridgeAndExtra + vat;

    return (
        <div className="exit-print-master">
            <div className="print-actions text-center mb-3">
                <button className="btn btn-sm btn-secondary" onClick={() => window.close()}>بستن</button>
            </div>

            <div className="exit-print-container p-4 bg-white">

                {/* --- Header --- */}
                <header className="d-flex justify-content-between align-items-center border-bottom border-2 border-dark pb-3 mb-4">
                    <div className="logo-section text-center" style={{width: '120px'}}>
                        <QRCodeSVG value={qrUrl} size={85} />
                    </div>

                    <div className="title-section text-center flex-grow-1">
                        <h2 className="fw-bolder m-0 font-size-22">صورتحساب خدمات انبارداری و توزین</h2>
                        <h5 className="text-secondary mt-2 font-size-14">مجتمع انبارداری و خدمات لجستیک ری</h5>
                    </div>

                    <div className="meta-section text-start" style={{minWidth: '180px', fontSize: '13px'}}>
                        <div className="d-flex justify-content-between mb-1">
                            <span>شماره سند:</span>
                            <span className="fw-bold">{data.id}</span>
                        </div>
                        <div className="d-flex justify-content-between mb-1">
                            <span>تاریخ خروج:</span>
                            <span className="fw-bold">{new Date(data.exit_date).toLocaleDateString('fa-IR')}</span>
                        </div>
                        <div className="d-flex justify-content-between">
                            <span>شماره عطف:</span>
                            <span className="fw-bold">{data.reference_no || '---'}</span>
                        </div>
                    </div>
                </header>

                {/* --- Info Box --- */}
                <section className="info-box border border-dark rounded-2 p-3 mb-3 bg-light bg-opacity-25">
                    <div className="row g-3 font-size-13">
                        <div className="col-6 d-flex">
                            <span className="text-secondary ms-2">صاحب کالا:</span>
                            <span className="fw-bold flex-grow-1 border-bottom border-secondary border-opacity-25">{data.loading_orders?.clearances?.customers?.name || "---"}</span>
                        </div>
                        <div className="col-6 d-flex">
                            <span className="text-secondary ms-2">نام راننده:</span>
                            <span className="fw-bold flex-grow-1 border-bottom border-secondary border-opacity-25">{data.loading_orders?.driver_name}</span>
                        </div>
                        <div className="col-6 d-flex">
                            <span className="text-secondary ms-2">کد ملی راننده:</span>
                            <span className="fw-bold flex-grow-1 border-bottom border-secondary border-opacity-25">{data.driver_national_code}</span>
                        </div>
                        <div className="col-6 d-flex">
                            <span className="text-secondary ms-2">پلاک خودرو:</span>
                            <span className="fw-bold flex-grow-1 border-bottom border-secondary border-opacity-25" dir="ltr">{data.loading_orders?.plate_number}</span>
                        </div>
                    </div>
                </section>

                {/* --- Items Table (ستون‌های اضافی حذف شد) --- */}
                <section className="table-section mb-4">
                    <table className="table table-bordered border-dark table-sm text-center align-middle font-size-12 w-100">
                        <thead className="table-secondary border-dark">
                        <tr>
                            <th style={{width: '5%'}}>#</th>
                            {/* عرض ستون شرح کالا را زیاد کردیم چون ستون‌های دیگر حذف شدند */}
                            <th style={{width: '35%'}}>شرح کالا</th>
                            <th style={{width: '10%'}}>تعداد</th>
                            <th style={{width: '10%'}}>وزن پر</th>
                            <th style={{width: '10%'}}>وزن خالی</th>
                            <th style={{width: '12%'}} className="bg-light">وزن خالص</th>
                            <th style={{width: '8%'}}>مغایرت</th>
                            <th style={{width: '10%'}}>Batch</th>
                        </tr>
                        </thead>
                        <tbody>
                        {data.warehouse_exit_items?.map((item, idx) => {
                            // وزن مجوز را فقط برای محاسبه مغایرت میگیریم ولی چاپ نمیکنیم
                            const clearanceItem = item.loading_order_items?.clearance_items || {};
                            const clearedWeight = clearanceItem.weight || 0;

                            const variance = (item.weight_net || 0) - clearedWeight;
                            const qty = Number(item.loading_order_items?.qty || 0);

                            return (
                                <tr key={idx}>
                                    <td>{idx + 1}</td>
                                    <td className="text-start fw-bold text-truncate" style={{maxWidth: '250px'}}>
                                        {item.loading_order_items?.products?.name || "نامشخص"}
                                    </td>

                                    {/* ستون‌های حذف شده: مبنا، نرخ واحد، وزن مجوز */}

                                    <td className="fw-bold">{qty.toLocaleString()}</td>
                                    <td>{Number(item.weight_full).toLocaleString()}</td>
                                    <td>{Number(item.weight_empty).toLocaleString()}</td>
                                    <td className="fw-bold bg-light font-size-13">{Number(item.weight_net).toLocaleString()}</td>

                                    <td dir="ltr" className={variance > 0 ? "fw-bold text-danger" : ""}>
                                        {variance > 0 ? `+${variance}` : variance}
                                    </td>

                                    <td className="font-family-monospace" dir="ltr">
                                        {item.loading_order_items?.batch_no || "-"}
                                    </td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                </section>

                {/* --- Footer --- */}
                <footer className="row g-0">
                    <div className="col-8 pe-3 d-flex flex-column justify-content-between">
                        <div className="payment-info mb-3 font-size-13">
                            <span className="fw-bold ms-2">روش تسویه:</span>
                            <span className="border px-3 py-1 rounded me-3 bg-light border-dark">
                                {data.payment_method === 'credit' ? 'نسیه (حساب مشتری)' :
                                    data.payment_method === 'pos' ? 'کارتخوان' : 'نقدی'}
                            </span>
                            {data.extra_description && (
                                <span className="text-muted ms-3">({data.extra_description})</span>
                            )}
                        </div>

                        <div className="signatures d-flex justify-content-around align-items-end mb-2" style={{height: '100px'}}>
                            <div className="text-center" style={{width: '30%'}}>
                                <p className="mb-4 fw-bold font-size-13">مهر و امضای راننده</p>
                                <div className="border-bottom border-dark border-dotted"></div>
                            </div>
                            <div className="text-center" style={{width: '30%'}}>
                                <p className="mb-4 fw-bold font-size-13">مهر و امضای انباردار</p>
                                <div className="border-bottom border-dark border-dotted"></div>
                            </div>
                            <div className="text-center" style={{width: '30%'}}>
                                <p className="mb-4 fw-bold font-size-13">تاییدیه انتظامات</p>
                                <div className="border-bottom border-dark border-dotted"></div>
                            </div>
                        </div>
                    </div>

                    <div className="col-4">
                        <div className="financial-box border border-dark rounded overflow-hidden">
                            <table className="table table-sm table-borderless mb-0 font-size-13">
                                <tbody>
                                <tr className="border-bottom border-secondary border-opacity-25">
                                    <td className="ps-2 py-2 text-secondary">جمع انبارداری:</td>
                                    <td className="text-end pe-2 py-2 fw-bold">{totalStorage.toLocaleString()}</td>
                                </tr>
                                <tr className="border-bottom border-secondary border-opacity-25">
                                    <td className="ps-2 py-2 text-secondary">جمع بارگیری:</td>
                                    <td className="text-end pe-2 py-2 fw-bold">{totalLoading.toLocaleString()}</td>
                                </tr>
                                <tr className="border-bottom border-secondary border-opacity-25">
                                    <td className="ps-2 py-2 text-secondary">باسکول و متفرقه:</td>
                                    <td className="text-end pe-2 py-2 fw-bold">{weighbridgeAndExtra.toLocaleString()}</td>
                                </tr>
                                <tr className="bg-light border-bottom border-dark">
                                    <td className="ps-2 py-2">مالیات و عوارض (10%):</td>
                                    <td className="text-end pe-2 py-2 fw-bold">{vat.toLocaleString()}</td>
                                </tr>
                                <tr className="bg-dark text-white">
                                    <td className="ps-2 py-3 font-size-14">مبلغ قابل پرداخت:</td>
                                    <td className="text-end pe-2 py-3 font-size-15 fw-bold">{grandTotal.toLocaleString()} <span className="font-size-11 fw-normal">ریال</span></td>
                                </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </footer>

                <div className="disclaimer text-center mt-auto pt-3 border-top border-dark mt-4 font-size-11 text-muted">
                    این برگه به صورت سیستمی صادر شده و هرگونه قلم‌خوردگی آن را از درجه اعتبار ساقط می‌کند.
                </div>
            </div>
        </div>
    );
};

export default ExitPrint;