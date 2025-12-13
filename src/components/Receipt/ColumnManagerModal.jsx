import React, { useState, useMemo } from "react";
import {
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Input,
    Row,
    Col,
    Badge,
} from "reactstrap";

/* ------------------------------
 * تعریف گروه‌بندی ستون‌ها بر اساس SQL Schema
 * ------------------------------ */
const COLUMN_GROUPS = {
    basic: {
        label: "اطلاعات پایه",
        icon: "ri-file-list-line",
        columns: ["id", "rowCode", "categoryId", "productId", "nationalProductId", "productDescription", "productionType"],
    },
    quantity: {
        label: "تعداد و وزن",
        icon: "ri-scales-line",
        columns: ["count", "unit", "fullWeight", "emptyWeight", "netWeight", "originWeight", "weightDiff"],
    },
    dimensions: {
        label: "ابعاد",
        icon: "ri-ruler-line",
        columns: ["length", "width", "thickness"],
    },
    status: {
        label: "وضعیت کیفی",
        icon: "ri-checkbox-circle-line",
        columns: ["isUsed", "isDefective"],
    },
    tracking: {
        label: "ردیابی و شناسایی",
        icon: "ri-barcode-line",
        columns: ["heatNumber", "bundleNo", "brand", "orderNo", "parentRow"],
    },
    location: {
        label: "موقعیت و توضیحات",
        icon: "ri-map-pin-line",
        columns: ["depoLocation", "descriptionNotes"],
    },
};

const ColumnManagerModal = ({
                                isOpen,
                                toggle,
                                columnVisibility = {},
                                columnLabels = {},
                                onToggleColumn // تابع آپدیت State والد
                            }) => {
    const [search, setSearch] = useState("");

    // --- فیلتر کردن گروه‌ها ---
    const filteredGroups = useMemo(() => {
        if (!search.trim()) return COLUMN_GROUPS;
        const s = search.toLowerCase();
        let res = {};

        Object.entries(COLUMN_GROUPS).forEach(([key, g]) => {
            const cols = g.columns.filter((c) => {
                const label = columnLabels[c];
                return label && label.toLowerCase().includes(s);
            });
            if (cols.length > 0) res[key] = { ...g, columns: cols };
        });
        return res;
    }, [search, columnLabels]);

    // --- هندل تغییر تیک ---
    const handleToggle = (colKey) => {
        const newVisibility = { ...columnVisibility, [colKey]: !columnVisibility[colKey] };
        onToggleColumn(newVisibility);
    };

    // --- انتخاب/حذف همه ---
    const handleBulkChange = (enable) => {
        const newVisibility = { ...columnVisibility };
        Object.values(COLUMN_GROUPS).forEach(group => {
            group.columns.forEach(col => newVisibility[col] = enable);
        });
        onToggleColumn(newVisibility);
    };

    const activeCount = Object.values(columnVisibility).filter(Boolean).length;

    return (
        <Modal isOpen={isOpen} toggle={toggle} size="lg" scrollable centered>
            <ModalHeader toggle={toggle} className="bg-light">
                <div className="d-flex align-items-center gap-2">
                    <i className="ri-layout-column-line"></i>
                    مدیریت نمایش ستون‌ها
                    <Badge color="primary" pill className="ms-2">{activeCount} ستون فعال</Badge>
                </div>
            </ModalHeader>

            <ModalBody className="p-4 bg-soft-light">
                {/* جستجو و دکمه‌های کلی */}
                <Row className="mb-4 align-items-center g-2">
                    <Col md={6}>
                        <div className="position-relative">
                            <Input
                                placeholder="جستجوی نام ستون..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                style={{ paddingRight: '35px' }}
                                className="bg-white border-light"
                            />
                            <i className="ri-search-line position-absolute top-50 translate-middle-y text-muted" style={{ right: '10px' }}></i>
                        </div>
                    </Col>
                    <Col md={6} className="text-end">
                        <Button size="sm" color="soft-success" className="me-2" onClick={() => handleBulkChange(true)}>
                            انتخاب همه
                        </Button>
                        <Button size="sm" color="soft-danger" onClick={() => handleBulkChange(false)}>
                            حذف همه
                        </Button>
                    </Col>
                </Row>

                {/* گروه‌ها */}
                <div className="d-flex flex-column gap-3">
                    {Object.entries(filteredGroups).map(([key, group]) => {
                        const groupActiveCount = group.columns.filter(c => columnVisibility[c]).length;
                        const isAllActive = group.columns.length > 0 && groupActiveCount === group.columns.length;

                        return (
                            <div key={key} className="card border shadow-sm mb-0">
                                <div className="card-header bg-white py-2 px-3 d-flex justify-content-between align-items-center">
                                    <div className="d-flex align-items-center gap-2">
                                        <div className="avatar-xs d-flex align-items-center justify-content-center bg-soft-primary rounded text-primary">
                                            <i className={group.icon}></i>
                                        </div>
                                        <span className="fw-bold text-dark font-size-13">{group.label}</span>
                                    </div>
                                    <div className="form-check form-switch m-0" title="انتخاب/حذف کل گروه">
                                        <input
                                            className="form-check-input cursor-pointer"
                                            type="checkbox"
                                            checked={isAllActive}
                                            onChange={(e) => {
                                                const newVis = { ...columnVisibility };
                                                group.columns.forEach(c => newVis[c] = e.target.checked);
                                                onToggleColumn(newVis);
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className="card-body p-3">
                                    <Row>
                                        {group.columns.map((col) => {
                                            const label = columnLabels[col];
                                            if (!label) return null;
                                            const isChecked = !!columnVisibility[col];

                                            return (
                                                <Col xs="6" sm="4" md="3" key={col} className="mb-2">
                                                    <div
                                                        className={`d-flex align-items-center p-2 rounded border cursor-pointer transition-all ${isChecked ? 'border-primary bg-soft-primary' : 'border-light bg-white'}`}
                                                        onClick={() => handleToggle(col)}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            className="form-check-input m-0 me-2 cursor-pointer"
                                                            checked={isChecked}
                                                            onChange={() => handleToggle(col)}
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                        <span className={`font-size-12 ${isChecked ? 'text-primary fw-bold' : 'text-muted'}`}>
                                                            {label}
                                                        </span>
                                                    </div>
                                                </Col>
                                            );
                                        })}
                                    </Row>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </ModalBody>
            <ModalFooter>
                <Button color="primary" onClick={toggle} className="w-100">تایید و اعمال تغییرات</Button>
            </ModalFooter>
        </Modal>
    );
};

export default ColumnManagerModal;