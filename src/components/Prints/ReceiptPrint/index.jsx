import React, { useMemo } from "react";
import "./print-styles.css";

const ReceiptPrintTemplate = ({ form, receiptNo }) => {
  if (!form || !form.items) return null;

  // --- Helpers ---
  const renderVal = (val, suffix = "") => (val ? `${val} ${suffix}` : "-");
  const formatNum = (num) => (num || num === 0 ? Number(num).toLocaleString("fa-IR") : "-");
  const formatDate = (d) => (d ? new Date(d).toLocaleDateString("fa-IR") : "-");

  // --- Dynamic Columns Logic ---
  const hasData = useMemo(() => {
    const items = form.items;
    return {
      nationalProductId: items.some(i => i.national_product_id),
      productDescription: items.some(i => i.product_description),
      productionType: items.some(i => i.production_type),
      isUsed: items.some(i => i.is_used),
      isDefective: items.some(i => i.is_defective),
      weights: items.some(i => i.weights_full || i.weights_empty || i.weights_origin || i.weights_diff),
      dims: items.some(i => i.dim_length || i.dim_width || i.dim_thickness),
      heat: items.some(i => i.heat_number),
      bundle: items.some(i => i.bundle_no),
      brand: items.some(i => i.brand),
      orderNo: items.some(i => i.order_no),
      depoLocation: items.some(i => i.depo_location),
      descriptionNotes: items.some(i => i.description_notes),
      rowCode: items.some(i => i.row_code),
    };
  }, [form.items]);

  // --- Totals ---
  const totals = form.items.reduce((acc, item) => ({
    count: acc.count + (Number(item.count) || 0),
    net: acc.net + (Number(item.weights_net) || 0)
  }), { count: 0, net: 0 });

  return (
    <div id="print-section">
      <div className="print-wrapper">
        
        {/* 1. Header */}
        <div className="header-row">
          <div className="header-left">
            <div className="barcode"></div>
            <div><strong>تاریخ چاپ:</strong> {new Date().toLocaleDateString('fa-IR')}</div>
            <div><strong>شناسه سیستمی:</strong> {receiptNo}</div>
            <div><strong>وضعیت:</strong> {form.isFinal ? "نهایی" : "پیش‌نویس"}</div>
          </div>
          
          <div className="header-center">
            <h1 className="brand-title">anbardaran</h1>
            <div style={{fontSize: '10pt', marginTop: '5px'}}>سامانه انبارداری ری</div>
            <div style={{fontSize: '9pt'}}>www.anbardaranrey.ir</div>
          </div>

          <div className="header-right">
            <h2 className="doc-title">رسید ورود کالا (قبض انبار)</h2>
            <div style={{marginTop: '10px'}}><strong>تاریخ سند:</strong> {formatDate(form.docDate)}</div>
            <div><strong>کد عطف:</strong> {renderVal(form.trackingCode)}</div>
          </div>
        </div>

        {/* 2. Warehouse Specs */}
        <div className="section-box">
          <div className="section-header">مشخصات انبار</div>
          <div className="section-content">
            <div className="info-row">
              <span className="info-item"><span className="info-label">عنوان:</span> انبار عمومی ری</span>
              <span className="info-item"><span className="info-label">شناسه ملی:</span> ۱۰۱۰۱۰۱۰۱۰</span>
              <span className="info-item"><span className="info-label">کد اقتصادی:</span> ۱۲۳۴۵۶۷۸۹</span>
            </div>
            <div className="info-row">
              <span className="info-item"><span className="info-label">آدرس:</span> تهران، شهرری، شورآباد، خیابان صنعت، پلاک ۱۱۰</span>
              <span className="info-item"><span className="info-label">تلفن:</span> ۰۲۱-۵۵۰۰۰۰۰۰</span>
            </div>
          </div>
        </div>

        {/* 3. Owner/Driver Specs */}
        <div className="section-box">
          <div className="section-header">مشخصات صاحب کالا و تحویل دهنده</div>
          <div className="section-content">
            <div className="info-row" style={{borderBottom: '1px dashed #ccc', paddingBottom: '5px', marginBottom: '5px'}}>
              <span className="info-item" style={{width: '45%'}}><span className="info-label">صاحب کالا (گیرنده):</span> {renderVal(form.owner?.name)}</span>
              <span className="info-item" style={{width: '45%'}}><span className="info-label">نماینده / تحویل‌دهنده:</span> {renderVal(form.deliverer?.name)}</span>
            </div>
            <div className="info-row">
              <span className="info-item"><span className="info-label">نام راننده:</span> {renderVal(form.header?.driver?.name)}</span>
              <span className="info-item"><span className="info-label">کد ملی:</span> {renderVal(form.header?.driver?.nationalId)}</span>
              <span className="info-item"><span className="info-label">موبایل:</span> {renderVal(form.header?.driver?.phone)}</span>
              <span className="info-item"><span className="info-label">پلاک خودرو:</span> {form.header?.plate ? 
                  <span dir="ltr" style={{fontWeight:'bold'}}>{`${form.header.plate.right2 || '--'} | ${form.header.plate.middle3 || '--'} | ${form.header.plate.left2 || '--'}`}</span> 
                  : '-'}
              </span>
            </div>
            <div className="info-row" style={{marginTop: '5px'}}>
               <span className="info-item"><span className="info-label">شماره بارنامه:</span> {renderVal(form.ref?.barnamehNumber)}</span>
               <span className="info-item"><span className="info-label">شماره حواله:</span> {renderVal(form.ref?.havaleNumber)}</span>
               <span className="info-item"><span className="info-label">شماره پته:</span> {renderVal(form.ref?.pettehNumber)}</span>
               <span className="info-item"><span className="info-label">شماره تولید:</span> {renderVal(form.ref?.productionNumber)}</span>
            </div>
          </div>
        </div>

        {/* 4. Table */}
        <div className="section-header" style={{border: '1px solid #444', borderBottom: 'none', borderRadius: '5px 5px 0 0'}}>شرح اقلام</div>
        <table className="custom-table" style={{borderTopLeftRadius: 0, borderTopRightRadius: 0}}>
          <thead>
            <tr>
              <th className="col-num">#</th>
              <th>کد کالا</th>
              {hasData.nationalProductId && <th>شناسه ملی کالا</th>}
              <th>شرح کالا</th>
              {hasData.brand && <th>برند</th>}
              {hasData.productionType && <th>نوع تولید</th>}
              {(hasData.isUsed || hasData.isDefective) && <th>وضعیت</th>}
              {hasData.dims && <th>ابعاد (L x W x T)</th>}
              {hasData.heat && <th>Heat No</th>}
              {hasData.bundle && <th>Bundle No</th>}
              {hasData.orderNo && <th>شماره سفارش</th>}
              {hasData.rowCode && <th>کد ردیف</th>}
              <th>تعداد</th>
              <th>واحد</th>
              {hasData.weights && <th>وزن پر</th>}
              {hasData.weights && <th>وزن خالی</th>}
              <th>وزن خالص</th>
              {hasData.weights && <th>وزن مبدا</th>}
              {hasData.weights && <th>اختلاف وزن</th>}
              {hasData.depoLocation && <th>محل دپو</th>}
              {hasData.descriptionNotes && <th>توضیحات</th>}
            </tr>
          </thead>
          <tbody>
            {form.items.map((item, idx) => (
              <tr key={idx}>
                <td className="col-num">{idx + 1}</td>
                <td>{renderVal(item.productId)}</td>
                {hasData.nationalProductId && <td>{renderVal(item.national_product_id)}</td>}
                <td className="col-desc">
                  <strong>{renderVal(item.productName || item.product_description)}</strong>
                </td>
                {hasData.brand && <td>{renderVal(item.brand)}</td>}
                {hasData.productionType && <td>{item.production_type === 'import' ? 'وارداتی' : 'داخلی'}</td>}
                {(hasData.isUsed || hasData.isDefective) && (
                  <td>
                    {item.is_used ? 'مستعمل ' : ''}
                    {item.is_defective ? 'معیوب' : ''}
                    {!item.is_used && !item.is_defective ? 'سالم' : ''}
                  </td>
                )}
                {hasData.dims && <td dir="ltr">{renderVal(item.dim_length)} x {renderVal(item.dim_width)} x {renderVal(item.dim_thickness)}</td>}
                {hasData.heat && <td>{renderVal(item.heat_number)}</td>}
                {hasData.bundle && <td>{renderVal(item.bundle_no)}</td>}
                {hasData.orderNo && <td>{renderVal(item.order_no)}</td>}
                {hasData.rowCode && <td>{renderVal(item.row_code)}</td>}
                
                <td>{formatNum(item.count)}</td>
                <td>{item.unit}</td>
                {hasData.weights && <td>{formatNum(item.weights_full)}</td>}
                {hasData.weights && <td>{formatNum(item.weights_empty)}</td>}
                <td style={{fontWeight: 'bold'}}>{formatNum(item.weights_net)}</td>
                {hasData.weights && <td>{formatNum(item.weights_origin)}</td>}
                {hasData.weights && <td>{formatNum(item.weights_diff)}</td>}
                {hasData.depoLocation && <td>{renderVal(item.depo_location)}</td>}
                {hasData.descriptionNotes && <td>{renderVal(item.description_notes)}</td>}
              </tr>
            ))}
            {/* Totals Row */}
             <tr className="total-final">
              <td colSpan={2 + (hasData.nationalProductId ? 1 : 0) + 1 + (hasData.brand ? 1 : 0) + (hasData.productionType ? 1 : 0) + ((hasData.isUsed || hasData.isDefective) ? 1 : 0) + (hasData.dims ? 1 : 0) + (hasData.heat ? 1 : 0) + (hasData.bundle ? 1 : 0) + (hasData.orderNo ? 1 : 0) + (hasData.rowCode ? 1 : 0)}>جمع کل</td>
              <td>{formatNum(totals.count)}</td>
              <td>-</td>
              {hasData.weights && <td>-</td>}
              {hasData.weights && <td>-</td>}
              <td>{formatNum(totals.net)}</td>
              {hasData.weights && <td>-</td>}
              {hasData.weights && <td>-</td>}
              {hasData.depoLocation && <td>-</td>}
              {hasData.descriptionNotes && <td>-</td>}
            </tr>
          </tbody>
        </table>

        {/* 5. Footer Layout */}
        <div className="footer-row">
          
          {/* Notes */}
          <div className="footer-notes-area">
            <div style={{fontWeight: 'bold', marginBottom: '5px'}}>یادداشت / توضیحات:</div>
            <p style={{margin: 0}}>{renderVal(form.misc_description)}</p> {/* Using misc_description from receipts table */}
             <div style={{marginTop: '10px', fontSize: '8pt', color: '#666'}}>
              * اقلام فوق سالم و بدون نقص ظاهری (مگر موارد ذکر شده) تحویل انبار گردید.
            </div>
          </div>

          {/* Totals */}
          <div className="footer-totals-area">
            <div className="total-row">
              <span className="total-label">جمع تعداد اقلام:</span>
              <span className="total-value">{formatNum(totals.count)} عدد</span>
            </div>
            
            <div className="total-row total-final">
              <span className="total-label">وزن خالص کل:</span>
              <span className="total-value">{formatNum(totals.net)} کیلوگرم</span>
            </div>
          </div>

        </div>

        {/* 6. Signatures */}
        <div className="signatures">
          <div>
            <div style={{fontWeight: 'bold'}}>مهر و امضای تحویل دهنده</div>
            <div className="sign-place"></div>
          </div>
          <div>
            <div style={{fontWeight: 'bold'}}>مهر و امضای انباردار</div>
            <div className="sign-place"></div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ReceiptPrintTemplate;