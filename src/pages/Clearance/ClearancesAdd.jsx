// /var/www/union-portal/src/pages/Clearance/ClearancesAdd.jsx

import React, { useState, useEffect } from "react";
import {
    Container,
    Row,
    Col,
    Card,
    CardBody,
    CardTitle,
    Form,
    FormGroup,
    Label,
    Input,
    Button,
    Table,
    Alert,
    Spinner,
} from "reactstrap";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import { get, post } from "../../helpers/api_helper";
import Swal from "sweetalert2";

const ClearancesAdd = () => {
    // ═══════════════════════════════════════
    // STATE MANAGEMENT
    // ═══════════════════════════════════════
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // لیست‌ها
    const [customers, setCustomers] = useState([]);
    const [categories, setCategories] = useState([]);

    // فرم اصلی
    const [formData, setFormData] = useState({
        clearanceDate: new Date().toISOString().split("T")[0],
        customer: "",
        receiverType: "person",
        personName: "",
        personNationalId: "",
        companyName: "",
        companyRegistrationNo: "",
        companyEconomicCode: "",
        driverName: "",
        driverNationalId: "",
        driverPhone: "",
        plateIranRight: "",
        plateMid3: "",
        plateLetter: "",
        plateLeft2: "",
        vehicleType: "pickup",
        description: "",
    });

    // آیتم‌های جدول
    const [items, setItems] = useState([]);

    // فرم آیتم جدید
    const [newItem, setNewItem] = useState({
        parentRowCode: "",
        qty: 0,
        weight: 0,
        description: "",
    });

    // اطلاعات موجودی (از API)
    const [stockInfo, setStockInfo] = useState(null);
    const [loadingStock, setLoadingStock] = useState(false);

    // ═══════════════════════════════════════
    // LOAD DATA
    // ═══════════════════════════════════════
    useEffect(() => {
        loadCustomers();
        loadCategories();
    }, []);

    const loadCustomers = async () => {
        try {
            const res = await get("/customers?limit=1000");
            setCustomers(res.docs || []);
        } catch (error) {
            console.error("خطا در دریافت مشتریان:", error);
        }
    };

    const loadCategories = async () => {
        try {
            const res = await get("/product-categories?limit=500");
            setCategories(res.docs || []);
        } catch (error) {
            console.error("خطا در دریافت گروه‌ها:", error);
        }
    };

    // ═══════════════════════════════════════
    // جستجوی موجودی بر اساس ردیف
    // ═══════════════════════════════════════
    const searchStockByRow = async () => {
        if (!newItem.parentRowCode) {
            Swal.fire("خطا", "لطفاً شماره ردیف را وارد کنید", "error");
            return;
        }

        if (!formData.customer) {
            Swal.fire("خطا", "لطفاً ابتدا مشتری را انتخاب کنید", "error");
            return;
        }

        setLoadingStock(true);
        setStockInfo(null);

        try {
            const res = await get(
                `/stock-by-row?rowCode=${newItem.parentRowCode}&ownerId=${formData.customer}`
            );

            if (res.success) {
                setStockInfo(res.data);
                Swal.fire({
                    icon: "success",
                    title: "موجودی یافت شد",
                    html: `
            <div style="text-align: right;">
              <p><strong>کالا:</strong> ${res.data.productDetails?.name || "-"}</p>
              <p><strong>گروه:</strong> ${res.data.productDetails?.category?.name || "-"}</p>
              <p><strong>موجودی تعداد:</strong> ${res.data.availableQty}</p>
              <p><strong>موجودی وزن:</strong> ${res.data.availableWeight} کیلوگرم</p>
            </div>
          `,
                    timer: 3000,
                });
            }
        } catch (error) {
            Swal.fire("خطا", error.response?.data?.error || "خطا در دریافت موجودی", "error");
            setStockInfo(null);
        } finally {
            setLoadingStock(false);
        }
    };

    // ═══════════════════════════════════════
    // افزودن آیتم به جدول
    // ═══════════════════════════════════════
    const addItemToTable = () => {
        // Validation
        if (!stockInfo) {
            Swal.fire("خطا", "لطفاً ابتدا ردیف را جستجو کنید", "error");
            return;
        }

        if (newItem.qty <= 0) {
            Swal.fire("خطا", "تعداد باید بیشتر از صفر باشد", "error");
            return;
        }

        if (newItem.qty > stockInfo.availableQty) {
            Swal.fire(
                "خطا",
                `تعداد نمی‌تواند بیشتر از موجودی (${stockInfo.availableQty}) باشد`,
                "error"
            );
            return;
        }

        if (newItem.weight > stockInfo.availableWeight) {
            Swal.fire(
                "خطا",
                `وزن نمی‌تواند بیشتر از موجودی (${stockInfo.availableWeight}) باشد`,
                "error"
            );
            return;
        }

        // محاسبه ردیف جدید
        const existingItemsForRow = items.filter(
            (item) => item.parentRowCode === newItem.parentRowCode
        );
        const nextNumber = existingItemsForRow.length + 1;
        const newRowCode = `${newItem.parentRowCode}/${nextNumber}`;

        const itemToAdd = {
            id: Date.now(), // ID موقت
            parentRowCode: newItem.parentRowCode,
            newRowCode: newRowCode,
            product: stockInfo.productDetails,
            category: stockInfo.productDetails?.category,
            availableQty: stockInfo.availableQty,
            availableWeight: stockInfo.availableWeight,
            qty: Number(newItem.qty),
            weight: Number(newItem.weight),
            description: newItem.description,
        };

        setItems([...items, itemToAdd]);

        // Reset form
        setNewItem({
            parentRowCode: "",
            qty: 0,
            weight: 0,
            description: "",
        });
        setStockInfo(null);

        Swal.fire({
            icon: "success",
            title: "آیتم اضافه شد",
            text: `ردیف ${newRowCode} با موفقیت اضافه شد`,
            timer: 2000,
            showConfirmButton: false,
        });
    };

    // ═══════════════════════════════════════
    // حذف آیتم از جدول
    // ═══════════════════════════════════════
    const removeItem = (id) => {
        Swal.fire({
            title: "آیا مطمئن هستید؟",
            text: "این آیتم از لیست حذف خواهد شد",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "بله، حذف شود",
            cancelButtonText: "انصراف",
        }).then((result) => {
            if (result.isConfirmed) {
                setItems(items.filter((item) => item.id !== id));
                Swal.fire("حذف شد!", "آیتم با موفقیت حذف شد", "success");
            }
        });
    };

    // ═══════════════════════════════════════
    // ذخیره نهایی
    // ═══════════════════════════════════════
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (items.length === 0) {
            Swal.fire("خطا", "لطفاً حداقل یک آیتم اضافه کنید", "error");
            return;
        }

        if (!formData.customer) {
            Swal.fire("خطا", "لطفاً مشتری را انتخاب کنید", "error");
            return;
        }

        setSaving(true);

        try {
            console.log("🔹 شروع ذخیره آیتم‌ها...");

            // 1️⃣ ذخیره آیتم‌ها
            const itemIds = [];
            for (const item of items) {
                const itemPayload = {
                    parentRowCode: item.parentRowCode,
                    product: item.product.id,
                    owner: formData.customer,
                    category: item.category?.id,
                    qty: item.qty,
                    weight: item.weight,
                    description: item.description,
                };

                console.log("📤 Payload آیتم:", itemPayload);

                const itemRes = await post("/clearanceitems", itemPayload);
                itemIds.push(itemRes.doc.id);
                console.log(`✅ آیتم ذخیره شد با ID: ${itemRes.doc.id}`);
            }

            console.log("✅ تمام آیتم‌ها ذخیره شدند. IDs:", itemIds);

            // 2️⃣ ذخیره ترخیص
            const clearancePayload = {
                status: "final", // یا "draft"
                clearanceDate: formData.clearanceDate,
                customer: parseInt(formData.customer),
                receiver: {
                    receiverType: formData.receiverType,
                    personName: formData.personName,
                    personNationalId: formData.personNationalId,
                    companyName: formData.companyName,
                    companyRegistrationNo: formData.companyRegistrationNo,
                    companyEconomicCode: formData.companyEconomicCode,
                },
                driver: {
                    name: formData.driverName,
                    nationalId: formData.driverNationalId,
                    phone: formData.driverPhone,
                },
                vehicle: {
                    plateIranRight: formData.plateIranRight,
                    plateMid3: formData.plateMid3,
                    plateLetter: formData.plateLetter,
                    plateLeft2: formData.plateLeft2,
                    vehicleType: formData.vehicleType,
                },
                items: itemIds,
                description: formData.description,
            };

            console.log("📤 Payload ترخیص:", clearancePayload);

            const clearanceRes = await post("/clearances", clearancePayload);

            console.log("✅ ترخیص ذخیره شد:", clearanceRes);

            Swal.fire({
                icon: "success",
                title: "موفق!",
                text: `ترخیص شماره ${clearanceRes.doc.clearanceNo} با موفقیت ثبت شد`,
                confirmButtonText: "بستن",
            }).then(() => {
                // Reset form
                window.location.href = "/clearances";
            });
        } catch (error) {
            console.error("❌ خطا در ذخیره:", error);
            Swal.fire({
                icon: "error",
                title: "خطا!",
                text: error.response?.data?.errors?.[0]?.message || "خطا در ذخیره ترخیص",
            });
        } finally {
            setSaving(false);
        }
    };

    // ═══════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════
    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <Breadcrumbs title="ترخیص کالا" breadcrumbItem="ثبت ترخیص جدید" />

                    <Form onSubmit={handleSubmit}>
                        <Row>
                            {/* ═══ اطلاعات اصلی ═══ */}
                            <Col lg={12}>
                                <Card>
                                    <CardBody>
                                        <CardTitle className="mb-4">اطلاعات اصلی</CardTitle>
                                        <Row>
                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>تاریخ ترخیص *</Label>
                                                    <Input
                                                        type="date"
                                                        value={formData.clearanceDate}
                                                        onChange={(e) =>
                                                            setFormData({ ...formData, clearanceDate: e.target.value })
                                                        }
                                                        required
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={9}>
                                                <FormGroup>
                                                    <Label>مشتری (مالک کالا) *</Label>
                                                    <Input
                                                        type="select"
                                                        value={formData.customer}
                                                        onChange={(e) =>
                                                            setFormData({ ...formData, customer: e.target.value })
                                                        }
                                                        required
                                                    >
                                                        <option value="">انتخاب کنید...</option>
                                                        {customers.map((c) => (
                                                            <option key={c.id} value={c.id}>
                                                                {c.name}
                                                            </option>
                                                        ))}
                                                    </Input>
                                                </FormGroup>
                                            </Col>
                                        </Row>
                                    </CardBody>
                                </Card>
                            </Col>

                            {/* ═══ تحویل‌گیرنده ═══ */}
                            <Col lg={6}>
                                <Card>
                                    <CardBody>
                                        <CardTitle className="mb-4">مشخصات تحویل‌گیرنده</CardTitle>

                                        <FormGroup>
                                            <Label>نوع تحویل‌گیرنده</Label>
                                            <Input
                                                type="select"
                                                value={formData.receiverType}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, receiverType: e.target.value })
                                                }
                                            >
                                                <option value="person">شخص حقیقی</option>
                                                <option value="company">شرکت</option>
                                            </Input>
                                        </FormGroup>

                                        {formData.receiverType === "person" ? (
                                            <>
                                                <FormGroup>
                                                    <Label>نام و نام خانوادگی</Label>
                                                    <Input
                                                        type="text"
                                                        value={formData.personName}
                                                        onChange={(e) =>
                                                            setFormData({ ...formData, personName: e.target.value })
                                                        }
                                                    />
                                                </FormGroup>
                                                <FormGroup>
                                                    <Label>کد ملی</Label>
                                                    <Input
                                                        type="text"
                                                        value={formData.personNationalId}
                                                        onChange={(e) =>
                                                            setFormData({ ...formData, personNationalId: e.target.value })
                                                        }
                                                    />
                                                </FormGroup>
                                            </>
                                        ) : (
                                            <>
                                                <FormGroup>
                                                    <Label>نام شرکت</Label>
                                                    <Input
                                                        type="text"
                                                        value={formData.companyName}
                                                        onChange={(e) =>
                                                            setFormData({ ...formData, companyName: e.target.value })
                                                        }
                                                    />
                                                </FormGroup>
                                                <FormGroup>
                                                    <Label>شماره ثبت</Label>
                                                    <Input
                                                        type="text"
                                                        value={formData.companyRegistrationNo}
                                                        onChange={(e) =>
                                                            setFormData({
                                                                ...formData,
                                                                companyRegistrationNo: e.target.value,
                                                            })
                                                        }
                                                    />
                                                </FormGroup>
                                                <FormGroup>
                                                    <Label>کد اقتصادی</Label>
                                                    <Input
                                                        type="text"
                                                        value={formData.companyEconomicCode}
                                                        onChange={(e) =>
                                                            setFormData({
                                                                ...formData,
                                                                companyEconomicCode: e.target.value,
                                                            })
                                                        }
                                                    />
                                                </FormGroup>
                                            </>
                                        )}
                                    </CardBody>
                                </Card>
                            </Col>

                            {/* ═══ راننده و خودرو ═══ */}
                            <Col lg={6}>
                                <Card>
                                    <CardBody>
                                        <CardTitle className="mb-4">راننده و خودرو</CardTitle>

                                        <FormGroup>
                                            <Label>نام راننده</Label>
                                            <Input
                                                type="text"
                                                value={formData.driverName}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, driverName: e.target.value })
                                                }
                                            />
                                        </FormGroup>

                                        <FormGroup>
                                            <Label>کد ملی راننده</Label>
                                            <Input
                                                type="text"
                                                value={formData.driverNationalId}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, driverNationalId: e.target.value })
                                                }
                                            />
                                        </FormGroup>

                                        <FormGroup>
                                            <Label>تلفن همراه</Label>
                                            <Input
                                                type="text"
                                                value={formData.driverPhone}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, driverPhone: e.target.value })
                                                }
                                            />
                                        </FormGroup>

                                        <Row>
                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>ایران</Label>
                                                    <Input
                                                        type="text"
                                                        placeholder="12"
                                                        maxLength="2"
                                                        value={formData.plateIranRight}
                                                        onChange={(e) =>
                                                            setFormData({ ...formData, plateIranRight: e.target.value })
                                                        }
                                                    />
                                                </FormGroup>
                                            </Col>
                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>سه رقم</Label>
                                                    <Input
                                                        type="text"
                                                        placeholder="345"
                                                        maxLength="3"
                                                        value={formData.plateMid3}
                                                        onChange={(e) =>
                                                            setFormData({ ...formData, plateMid3: e.target.value })
                                                        }
                                                    />
                                                </FormGroup>
                                            </Col>
                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>حرف</Label>
                                                    <Input
                                                        type="text"
                                                        placeholder="الف"
                                                        maxLength="1"
                                                        value={formData.plateLetter}
                                                        onChange={(e) =>
                                                            setFormData({ ...formData, plateLetter: e.target.value })
                                                        }
                                                    />
                                                </FormGroup>
                                            </Col>
                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>دو رقم</Label>
                                                    <Input
                                                        type="text"
                                                        placeholder="67"
                                                        maxLength="2"
                                                        value={formData.plateLeft2}
                                                        onChange={(e) =>
                                                            setFormData({ ...formData, plateLeft2: e.target.value })
                                                        }
                                                    />
                                                </FormGroup>
                                            </Col>
                                        </Row>

                                        <FormGroup>
                                            <Label>نوع خودرو</Label>
                                            <Input
                                                type="select"
                                                value={formData.vehicleType}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, vehicleType: e.target.value })
                                                }
                                            >
                                                <option value="pickup">وانت</option>
                                                <option value="truck">کامیون</option>
                                                <option value="light_truck">کامیونت</option>
                                                <option value="trailer">تریلی</option>
                                            </Input>
                                        </FormGroup>
                                    </CardBody>
                                </Card>
                            </Col>

                            {/* ═══ افزودن آیتم ═══ */}
                            <Col lg={12}>
                                <Card>
                                    <CardBody>
                                        <CardTitle className="mb-4">افزودن آیتم جدید</CardTitle>

                                        <Row>
                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>شماره ردیف مادر *</Label>
                                                    <Input
                                                        type="text"
                                                        placeholder="مثال: 0001"
                                                        value={newItem.parentRowCode}
                                                        onChange={(e) =>
                                                            setNewItem({ ...newItem, parentRowCode: e.target.value })
                                                        }
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={2}>
                                                <FormGroup>
                                                    <Label>&nbsp;</Label>
                                                    <Button
                                                        color="primary"
                                                        block
                                                        onClick={searchStockByRow}
                                                        disabled={loadingStock || !formData.customer}
                                                    >
                                                        {loadingStock ? <Spinner size="sm" /> : "🔍 جستجو"}
                                                    </Button>
                                                </FormGroup>
                                            </Col>

                                            {stockInfo && (
                                                <>
                                                    <Col md={7}>
                                                        <Alert color="success" className="mb-0">
                                                            <strong>کالا:</strong> {stockInfo.productDetails?.name} |{" "}
                                                            <strong>موجودی:</strong> {stockInfo.availableQty} عدد /{" "}
                                                            {stockInfo.availableWeight} کیلو
                                                        </Alert>
                                                    </Col>

                                                    <Col md={3}>
                                                        <FormGroup>
                                                            <Label>تعداد خروجی *</Label>
                                                            <Input
                                                                type="number"
                                                                min="0"
                                                                max={stockInfo.availableQty}
                                                                value={newItem.qty}
                                                                onChange={(e) =>
                                                                    setNewItem({ ...newItem, qty: e.target.value })
                                                                }
                                                            />
                                                        </FormGroup>
                                                    </Col>

                                                    <Col md={3}>
                                                        <FormGroup>
                                                            <Label>وزن خروجی (kg)</Label>
                                                            <Input
                                                                type="number"
                                                                min="0"
                                                                max={stockInfo.availableWeight}
                                                                value={newItem.weight}
                                                                onChange={(e) =>
                                                                    setNewItem({ ...newItem, weight: e.target.value })
                                                                }
                                                            />
                                                        </FormGroup>
                                                    </Col>

                                                    <Col md={4}>
                                                        <FormGroup>
                                                            <Label>توضیحات</Label>
                                                            <Input
                                                                type="text"
                                                                value={newItem.description}
                                                                onChange={(e) =>
                                                                    setNewItem({ ...newItem, description: e.target.value })
                                                                }
                                                            />
                                                        </FormGroup>
                                                    </Col>

                                                    <Col md={2}>
                                                        <FormGroup>
                                                            <Label>&nbsp;</Label>
                                                            <Button color="success" block onClick={addItemToTable}>
                                                                ➕ افزودن
                                                            </Button>
                                                        </FormGroup>
                                                    </Col>
                                                </>
                                            )}
                                        </Row>
                                    </CardBody>
                                </Card>
                            </Col>

                            {/* ═══ جدول آیتم‌ها ═══ */}
                            {items.length > 0 && (
                                <Col lg={12}>
                                    <Card>
                                        <CardBody>
                                            <CardTitle className="mb-4">
                                                آیتم‌های ترخیص ({items.length} آیتم)
                                            </CardTitle>

                                            <div style={{ overflowX: "auto" }}>
                                                <Table bordered hover responsive>
                                                    <thead>
                                                    <tr style={{ backgroundColor: "#f0f0f0" }}>
                                                        <th>ردیف مادر</th>
                                                        <th>ردیف جدید</th>
                                                        <th>گروه کالا</th>
                                                        <th>نام کالا</th>
                                                        <th>موجودی تعداد</th>
                                                        <th>موجودی وزن</th>
                                                        <th>تعداد خروجی</th>
                                                        <th>وزن خروجی</th>
                                                        <th>عملیات</th>
                                                    </tr>
                                                    </thead>
                                                    <tbody>
                                                    {items.map((item) => (
                                                        <tr key={item.id}>
                                                            <td>{item.parentRowCode}</td>
                                                            <td>
                                                                <strong>{item.newRowCode}</strong>
                                                            </td>
                                                            <td>{item.category?.name || "-"}</td>
                                                            <td>{item.product?.name || "-"}</td>
                                                            <td>{item.availableQty}</td>
                                                            <td>{item.availableWeight} kg</td>
                                                            <td>
                                                                <strong style={{ color: "green" }}>{item.qty}</strong>
                                                            </td>
                                                            <td>
                                                                <strong style={{ color: "green" }}>
                                                                    {item.weight} kg
                                                                </strong>
                                                            </td>
                                                            <td>
                                                                <Button
                                                                    color="danger"
                                                                    size="sm"
                                                                    onClick={() => removeItem(item.id)}
                                                                >
                                                                    🗑️ حذف
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    </tbody>
                                                </Table>
                                            </div>
                                        </CardBody>
                                    </Card>
                                </Col>
                            )}

                            {/* ═══ توضیحات و دکمه ذخیره ═══ */}
                            <Col lg={12}>
                                <Card>
                                    <CardBody>
                                        <FormGroup>
                                            <Label>توضیحات</Label>
                                            <Input
                                                type="textarea"
                                                rows="3"
                                                value={formData.description}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, description: e.target.value })
                                                }
                                            />
                                        </FormGroup>

                                        <div className="text-center mt-4">
                                            <Button
                                                type="submit"
                                                color="success"
                                                size="lg"
                                                disabled={saving || items.length === 0}
                                                style={{ minWidth: "200px" }}
                                            >
                                                {saving ? (
                                                    <>
                                                        <Spinner size="sm" className="me-2" />
                                                        در حال ذخیره...
                                                    </>
                                                ) : (
                                                    "💾 ثبت نهایی ترخیص"
                                                )}
                                            </Button>
                                        </div>
                                    </CardBody>
                                </Card>
                            </Col>
                        </Row>
                    </Form>
                </Container>
            </div>
        </React.Fragment>
    );
};

export default ClearancesAdd;