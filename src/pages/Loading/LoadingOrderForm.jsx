import React, { useState, useEffect, useMemo } from "react";
import {
    Container, Card, CardBody, Row, Col, Button, Table, CardTitle, Label, Input, FormFeedback
} from "reactstrap";
import Select from "react-select";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

// سرویس‌ها
import { getCustomersWithStock, getCustomerPendingItems, createLoadingOrder } from "../../services/loadingService";

// کامپوننت پلاک
import PlateInput from "../../components/PlateInput";

export default function LoadingOrderForm() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // استیت‌های داده
    const [customerOptions, setCustomerOptions] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [allItems, setAllItems] = useState([]);
    const [checkedItems, setCheckedItems] = useState({});

    // استیت راننده
    const [driverInfo, setDriverInfo] = useState({ name: "", plate: "" });
    const [errors, setErrors] = useState({});

    // --- توابع پلاک ---
    const parsePlate = (str) => {
        if (!str) return { right2: "", middle3: "", letter: "", left2: "" };
        const parts = str.split("-");
        return { right2: parts[0]||"", middle3: parts[1]||"", letter: parts[2]||"", left2: parts[3]||"" };
    };
    const stringifyPlate = (obj) => {
        const { right2, middle3, letter, left2 } = obj;
        if (!right2 && !middle3 && !letter && !left2) return "";
        return `${right2}-${middle3}-${letter}-${left2}`;
    };

    // 1. دریافت لیست مشتریان
    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const data = await getCustomersWithStock();
                const options = data.map(c => ({ value: c.id, label: c.name }));
                setCustomerOptions(options);
            } catch (err) {
                console.error(err);
                toast.error("خطا در دریافت لیست صاحب کالا");
            }
        };
        fetchCustomers();
    }, []);

    // 2. هندل تغییر مشتری
    const handleCustomerChange = async (option) => {
        setSelectedCustomer(option);
        setAllItems([]);
        setCheckedItems({});

        if (option) {
            setLoading(true);
            try {
                const items = await getCustomerPendingItems(option.value);
                setAllItems(items);
            } catch (err) {
                console.error(err);
                toast.error("خطا در دریافت لیست");
            } finally {
                setLoading(false);
            }
        }
    };

    // 3. هندل تیک زدن (لاجیک)
    const handleCheckboxChange = (id) => {
        setCheckedItems(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    // انتخاب همه
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            const newChecked = {};
            allItems.forEach(i => newChecked[i.item_id] = true);
            setCheckedItems(newChecked);
        } else {
            setCheckedItems({});
        }
    };

    // محاسبات
    const selectedList = useMemo(() => {
        return allItems.filter(item => checkedItems[item.item_id]);
    }, [allItems, checkedItems]);

    const totals = useMemo(() => {
        return selectedList.reduce((acc, curr) => ({
            qty: acc.qty + Number(curr.qty),
            weight: acc.weight + Number(curr.weight)
        }), { qty: 0, weight: 0 });
    }, [selectedList]);

    // 4. ثبت نهایی
    const handleSubmit = async () => {
        setErrors({});

        if (!selectedCustomer) return toast.error("لطفا صاحب کالا را انتخاب کنید");
        if (selectedList.length === 0) return toast.error("هیچ کالایی انتخاب نشده است");

        const newErrors = {};
        if (!driverInfo.name.trim()) newErrors.name = "نام راننده الزامی است";
        const pObj = parsePlate(driverInfo.plate);
        if (!pObj.right2 || !pObj.letter || !pObj.middle3 || !pObj.left2) {
            newErrors.plate = "پلاک کامل نیست";
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return toast.warn("اطلاعات راننده را تکمیل کنید");
        }

        setSubmitting(true);
        try {
            const mainClearanceId = selectedList[0].clearance_id;
            const payload = {
                clearance_id: mainClearanceId,
                customer_id: selectedCustomer.value,
                loading_date: new Date(),
                driver_name: driverInfo.name,
                plate_number: driverInfo.plate,
                user_id: 1,
                items: selectedList.map(i => ({
                    clearance_item_id: i.item_id,
                    product_id: i.product_id,
                    batch_no: i.batch_no,
                    qty: i.qty,
                    weight: i.weight
                }))
            };

            const res = await createLoadingOrder(payload);
            toast.success(`دستور بارگیری شماره ${res.order_no} صادر شد`);
            navigate("/loading/list");

        } catch (err) {
            toast.error("خطا در ثبت دستور بارگیری");
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="page-content">
            <Container fluid>
                {/* Page Title Box (Skote Style) */}
                <Row>
                    <Col xs={12}>
                        <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                            <h4 className="mb-sm-0 font-size-18">صدور دستور بارگیری</h4>
                        </div>
                    </Col>
                </Row>

                <Row>
                    <Col lg={12}>
                        <Card>
                            <CardBody>
                                <CardTitle className="h4 mb-4">۱. انتخاب صاحب کالا و راننده</CardTitle>
                                <p className="card-title-desc text-muted mb-4">
                                    ابتدا صاحب کالا را انتخاب کنید تا لیست اقلام قابل بارگیری نمایش داده شود.
                                </p>

                                <Row className="mb-4">
                                    <Col md={4} className="mb-3">
                                        <Label className="form-label">صاحب کالا (گیرنده)</Label>
                                        <Select
                                            options={customerOptions}
                                            value={selectedCustomer}
                                            onChange={handleCustomerChange}
                                            placeholder="جستجو و انتخاب..."
                                            noOptionsMessage={() => "موردی یافت نشد"}
                                            classNamePrefix="select2-selection"
                                        />
                                    </Col>

                                    <Col md={4} className="mb-3">
                                        <Label className="form-label">نام راننده <span className="text-danger">*</span></Label>
                                        <Input
                                            type="text"
                                            className="form-control"
                                            value={driverInfo.name}
                                            onChange={e => setDriverInfo({...driverInfo, name: e.target.value})}
                                            invalid={!!errors.name}
                                            placeholder="نام راننده را وارد کنید"
                                        />
                                        <FormFeedback>{errors.name}</FormFeedback>
                                    </Col>

                                    <Col md={4} className="mb-3">
                                        <Label className="form-label">پلاک خودرو <span className="text-danger">*</span></Label>
                                        <div className={errors.plate ? "border border-danger rounded" : ""}>
                                            <PlateInput
                                                value={parsePlate(driverInfo.plate)}
                                                onChange={(newVal) => setDriverInfo({...driverInfo, plate: stringifyPlate(newVal)})}
                                            />
                                        </div>
                                    </Col>
                                </Row>

                                {selectedCustomer && (
                                    <div className="animate__animated animate__fadeIn">
                                        <div className="d-flex align-items-center justify-content-between mb-3 border-top pt-4 mt-4">
                                            <h5 className="font-size-15 text-primary m-0">
                                                <i className="bx bx-list-check me-1"></i>
                                                ۲. انتخاب اقلام جهت بارگیری
                                            </h5>

                                            <div className="d-flex gap-2">
                                                <div className="badge badge-soft-primary font-size-13 p-2">
                                                    تعداد کل: {totals.qty.toLocaleString()}
                                                </div>
                                                <div className="badge badge-soft-info font-size-13 p-2">
                                                    وزن کل: {totals.weight.toLocaleString()} kg
                                                </div>
                                            </div>
                                        </div>

                                        <div className="table-responsive">
                                            <Table className="table align-middle table-nowrap table-check table-hover">
                                                <thead className="table-light">
                                                <tr>
                                                    <th style={{width: '20px'}} className="align-middle">
                                                        <div className="form-check font-size-16">
                                                            <input
                                                                type="checkbox"
                                                                className="form-check-input"
                                                                onChange={handleSelectAll}
                                                                checked={allItems.length > 0 && selectedList.length === allItems.length}
                                                                style={{cursor: 'pointer'}}
                                                            />
                                                        </div>
                                                    </th>
                                                    <th className="align-middle">سند مرجع</th>
                                                    <th className="align-middle">نام کالا</th>
                                                    <th className="align-middle">بچ / ردیف</th>
                                                    <th className="align-middle">تحویل گیرنده (ترخیص)</th>
                                                    <th className="align-middle text-center">تعداد</th>
                                                    <th className="align-middle text-center">وزن (kg)</th>
                                                    <th className="align-middle">وضعیت</th>
                                                </tr>
                                                </thead>
                                                <tbody>
                                                {loading ? (
                                                    <tr><td colSpan={8} className="text-center py-5"><div className="spinner-border text-primary m-1" role="status"></div><div className="mt-2">در حال دریافت موجودی...</div></td></tr>
                                                ) : allItems.length === 0 ? (
                                                    <tr><td colSpan={8} className="text-center py-5 text-muted">هیچ کالای بارگیری نشده‌ای یافت نشد.</td></tr>
                                                ) : (
                                                    allItems.map((item) => {
                                                        const isChecked = !!checkedItems[item.item_id];
                                                        return (
                                                            <tr
                                                                key={item.item_id}
                                                                className={isChecked ? "table-active" : ""}
                                                                onClick={() => handleCheckboxChange(item.item_id)}
                                                                style={{ cursor: 'pointer' }}
                                                            >
                                                                <td>
                                                                    <div style={{width: '20px', height: '20px', position: 'relative'}}>
                                                                        <input
                                                                            type="checkbox"
                                                                            className="form-check-input" // کلاس Skote
                                                                            checked={isChecked}
                                                                            readOnly
                                                                            style={{
                                                                                pointerEvents: 'none', // فیکس حیاتی
                                                                                width: '18px',
                                                                                height: '18px'
                                                                            }}
                                                                        />
                                                                    </div>
                                                                </td>
                                                                <td><span className="badge badge-soft-dark font-size-12">{item.clearance_no}</span></td>
                                                                <td>
                                                                    <h5 className="font-size-14 mb-1 text-dark">{item.product_name}</h5>
                                                                </td>
                                                                <td className="text-muted font-monospace">{item.batch_no || '-'}</td>

                                                                <td>
                                                                    <div>
                                                                        {item.deliverer_name ? (
                                                                            <span className="badge badge-soft-primary font-size-11">{item.deliverer_name}</span>
                                                                        ) : <span className="text-muted">-</span>}
                                                                    </div>
                                                                    {item.national_code && <small className="text-muted d-block mt-1">{item.national_code}</small>}
                                                                </td>

                                                                <td className="text-center fw-bold">{Number(item.qty).toLocaleString()}</td>
                                                                <td className="text-center">{Number(item.weight).toLocaleString()}</td>
                                                                <td>
                                                                    {isChecked ?
                                                                        <span className="badge badge-soft-success font-size-12"><i className="bx bx-check-double me-1"></i>انتخاب شد</span> :
                                                                        <span className="badge badge-soft-light text-muted font-size-12">انتخاب نشده</span>
                                                                    }
                                                                </td>
                                                            </tr>
                                                        );
                                                    })
                                                )}
                                                </tbody>
                                            </Table>
                                        </div>

                                        <div className="d-flex justify-content-end mt-4 pt-3 border-top">
                                            <div className="text-end">
                                                <div className="mb-2 text-muted font-size-13">
                                                    {selectedList.length} ردیف کالا انتخاب شده است
                                                </div>
                                                <Button
                                                    color="success" size="lg" className="btn-rounded waves-effect waves-light shadow-sm px-5"
                                                    onClick={handleSubmit} disabled={submitting || selectedList.length === 0}
                                                >
                                                    {submitting ? (
                                                        <><i className="bx bx-loader bx-spin font-size-16 align-middle me-2"></i> در حال ثبت...</>
                                                    ) : "تایید و صدور نهایی"}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </div>
    );
}