import React from "react";

const LoadingPrintTemplate = ({ data }) => {
    // اگر دیتا هنوز لود نشده، چیزی برنگردان
    if (!data || !data.header) return null;

    const { header, items } = data;

    // توابع کمکی
    const renderVal = (val, suffix = "") => (val ? `${val} ${suffix}` : "-");
    const formatNum = (num) => (num || num === 0 ? Number(num).toLocaleString("fa-IR") : "-");
    const formatDate = (d) => (d ? new Date(d).toLocaleDateString("fa-IR") : "-");

    const formatPlate = (plateStr) => {
        if (!plateStr) return "-";
        const parts = plateStr.split("-");
        if(parts.length < 4) return plateStr;
        return `ایران ${parts[3]} | ${parts[1]} ${parts[2]} ${parts[0]}`;
    };

    const totals = items.reduce((acc, item) => ({
        qty: acc.qty + (Number(item.qty) || 0),
        weight: acc.weight + (Number(item.weight) || 0)
    }), { qty: 0, weight: 0 });

    return (
        <>
            <style>{`
        @import url('https://cdn.jsdelivr.net/gh/rastikerdar/vazir-font/dist/font-face.css');

        /* تنظیمات حالت پرینت */
        @media print {
            body * { visibility: hidden; }
            #root, .layout-wrapper, .main-content, .page-content, .navbar, .footer { display: none !important; }

            body, html {
                background: #fff !important;
                height: 100%; width: 100%; margin: 0; padding: 0; overflow: visible !important;
            }

            /* بازگرداندن المان پرینت به صفحه */
            #loading-print-section {
                visibility: visible !important;
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                height: auto !important;
                z-index: 99999999 !important;
                background-color: #fff !important;
                display: block !important;
                padding: 10mm !important;
                margin: 0 !important;
                opacity: 1 !important;
            }
            
            #loading-print-section * { visibility: visible !important; }
        }

        /* استایل‌های ظاهری فرم */
        .loading-wrapper { direction: rtl; font-family: 'Vazir', 'Tahoma', sans-serif; font-size: 10pt; color: #000; line-height: 1.5; }
        .loading-header { display: flex; justify-content: space-between; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
        .lh-side { width: 30%; }
        .lh-center { width: 40%; text-align: center; }
        .lh-title { font-size: 20pt; font-weight: 900; margin: 0; color: #333; }
        .lh-doc-name { border: 1px solid #000; padding: 5px 15px; border-radius: 5px; font-weight: bold; display: inline-block; margin-top: 5px; font-size: 12pt; background: #f0f0f0; -webkit-print-color-adjust: exact; }

        .l-box { border: 1px solid #000; border-radius: 5px; overflow: hidden; margin-bottom: 12px; }
        .l-box-header { background-color: #ddd !important; border-bottom: 1px solid #000; padding: 5px; text-align: center; font-weight: bold; font-size: 9pt; -webkit-print-color-adjust: exact; }
        .l-box-content { padding: 8px; font-size: 10pt; }
        .l-row { display: flex; flex-wrap: wrap; }
        .l-item { margin-left: 20px; margin-bottom: 5px; }
        .l-lbl { font-weight: bold; color: #444; margin-left: 5px; }
        .l-val { font-weight: bold; color: #000; }
        
        .plate-print { border: 1px solid #000; padding: 2px 8px; border-radius: 4px; font-family: 'Tahoma', sans-serif; direction: ltr; display: inline-block; font-weight: bold; letter-spacing: 1px; }

        .l-table { width: 100%; border-collapse: collapse; border: 1px solid #000; margin-bottom: 15px; font-size: 9.5pt; }
        .l-table th { background-color: #eee !important; border: 1px solid #000; padding: 8px; font-weight: bold; -webkit-print-color-adjust: exact; }
        .l-table td { border: 1px solid #000; padding: 6px; text-align: center; vertical-align: middle; }
        .col-idx { width: 40px; background-color: #f9f9f9 !important; -webkit-print-color-adjust: exact; }

        .l-footer { display: flex; margin-top: 10px; }
        .l-note { flex: 1; border: 1px solid #000; border-radius: 5px; padding: 8px; margin-left: 10px; min-height: 80px; }
        .l-total { width: 250px; border: 1px solid #000; border-radius: 5px; }
        .lt-row { display: flex; justify-content: space-between; padding: 6px 10px; border-bottom: 1px solid #ccc; }
        .lt-final { background-color: #eee !important; font-weight: bold; border-bottom: none; -webkit-print-color-adjust: exact; }

        .l-signs { margin-top: 50px; display: flex; justify-content: space-around; text-align: center; }
        .sign-box { width: 30%; }
        .sign-line { margin-top: 50px; border-bottom: 1px dashed #000; width: 80%; margin-left: auto; margin-right: auto; }
      `}</style>

            {/* ✅ تغییر کلیدی: استایل Inline برای مخفی کردن در حالت Screen
        این باعث می‌شود در مانیتور کاملاً از صفحه خارج شود و ساختار را به هم نریزد.
      */}
            <div
                id="loading-print-section"
                style={{
                    position: 'fixed',
                    top: 0,
                    left: '-10000px', // پرتاب به بیرون از صفحه
                    width: '1px',
                    height: '1px',
                    overflow: 'hidden',
                    opacity: 0,
                    zIndex: -1000
                }}
            >
                <div className="loading-wrapper">

                    {/* هدر */}
                    <div className="loading-header">
                        <div className="lh-side">
                            <div><span className="l-lbl">تاریخ چاپ:</span> {new Date().toLocaleDateString('fa-IR')}</div>
                            <div><span className="l-lbl">شماره دستور:</span> <span className="l-val">{header.order_no}</span></div>
                        </div>
                        <div className="lh-center">
                            <h1 className="lh-title">anbardaran</h1>
                            <div className="lh-doc-name">حواله خروج کالا (بارگیری)</div>
                        </div>
                        <div className="lh-side" style={{textAlign: 'left'}}>
                            <div><span className="l-lbl">تاریخ صدور:</span> {formatDate(header.loading_date)}</div>
                            <div><span className="l-lbl">شماره سند:</span> {header.order_no}</div>
                        </div>
                    </div>

                    {/* مشخصات انبار */}
                    <div className="l-box">
                        <div className="l-box-header">مشخصات انبار مبداء</div>
                        <div className="l-box-content">
                            <div className="l-row">
                                <span className="l-item"><span className="l-lbl">نام انبار:</span> انبار عمومی ری</span>
                                <span className="l-item"><span className="l-lbl">آدرس:</span> تهران، شورآباد، خیابان صنعت</span>
                                <span className="l-item"><span className="l-lbl">تلفن:</span> ۵۵۰۰۰۰۰۰-۰۲۱</span>
                            </div>
                        </div>
                    </div>

                    {/* مشخصات راننده */}
                    <div className="l-box">
                        <div className="l-box-header">مشخصات تحویل گیرنده</div>
                        <div className="l-box-content">
                            <div className="l-row" style={{borderBottom: '1px dashed #ccc', paddingBottom: '5px', marginBottom: '5px'}}>
                <span className="l-item" style={{width: '100%'}}>
                    <span className="l-lbl">صاحب کالا:</span> <span className="l-val" style={{fontSize: '11pt'}}>{renderVal(header.customer_name)}</span>
                </span>
                            </div>
                            <div className="l-row">
                                <span className="l-item"><span className="l-lbl">نام راننده:</span> <span className="l-val">{renderVal(header.driver_name)}</span></span>
                                <span className="l-item">
                    <span className="l-lbl">شماره پلاک:</span>
                    <span className="plate-print">{formatPlate(header.plate_number)}</span>
                </span>
                                <span className="l-item"><span className="l-lbl">توضیحات:</span> {renderVal(header.description)}</span>
                            </div>
                        </div>
                    </div>

                    {/* جدول */}
                    <div className="l-box-header" style={{border: '1px solid #000', borderBottom: 'none'}}>شرح اقلام بارگیری شده</div>
                    <table className="l-table" style={{borderTop: 'none'}}>
                        <thead>
                        <tr>
                            <th className="col-idx">#</th>
                            <th>شرح کالا</th>
                            <th>شماره بچ / ردیف</th>
                            <th>تعداد</th>
                            <th>وزن (kg)</th>
                            <th>توضیحات</th>
                        </tr>
                        </thead>
                        <tbody>
                        {items.map((item, idx) => (
                            <tr key={idx}>
                                <td className="col-idx">{idx + 1}</td>
                                <td style={{textAlign: 'right'}}><strong >{renderVal(item.product_name)}</strong></td>
                                <td style={{fontFamily: 'monospace'}}>{renderVal(item.batch_no)}</td>
                                <td><strong style={{fontSize: '1.1em'}}>{formatNum(item.qty)}</strong></td>
                                <td>{formatNum(item.weight)}</td>
                                <td></td>
                            </tr>
                        ))}
                        <tr className="lt-final">
                            <td colSpan={3} style={{textAlign: 'right', paddingRight: '10px'}}>جمع کل</td>
                            <td>{formatNum(totals.qty)}</td>
                            <td>{formatNum(totals.weight)}</td>
                            <td>-</td>
                        </tr>
                        </tbody>
                    </table>

                    {/* فوتر */}
                    <div className="l-footer">
                        <div className="l-note">
                            <div style={{fontWeight: 'bold', marginBottom: '5px'}}>توضیحات تکمیلی:</div>
                            <p style={{margin: 0, fontSize: '9pt'}}>
                                اجناس فوق طبق مشخصات مندرج، سالم و کامل بارگیری و تحویل راننده گردید.
                            </p>
                        </div>
                        <div className="l-total">
                            <div className="lt-row">
                                <span>تعداد کل اقلام:</span>
                                <span>{formatNum(totals.qty)} عدد</span>
                            </div>
                            <div className="lt-row lt-final">
                                <span>وزن کل باسکول:</span>
                                <span>{formatNum(totals.weight)} kg</span>
                            </div>
                        </div>
                    </div>

                    {/* امضاها */}
                    <div className="l-signs">
                        <div className="sign-box">
                            <div>متصدی انبار</div>
                            <div className="sign-line"></div>
                        </div>
                        <div className="sign-box">
                            <div>راننده (تحویل گیرنده)</div>
                            <div className="sign-line"></div>
                        </div>
                        <div className="sign-box">
                            <div>نگهبانی (خروج)</div>
                            <div className="sign-line"></div>
                        </div>
                    </div>

                </div>
            </div>
        </>
    );
};

export default LoadingPrintTemplate;