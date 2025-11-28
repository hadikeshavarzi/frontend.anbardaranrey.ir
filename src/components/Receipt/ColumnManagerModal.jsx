// src/components/Receipt/ColumnManagerModal.jsx
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

/* -------------------------------------------------------------
 *   گروه‌بندی ستون‌ها برای نمایش بهتر
 * ------------------------------------------------------------- */
const COLUMN_GROUPS = {
    basic: {
        label: "اطلاعات پایه",
        icon: "ri-file-list-line",
        columns: ["nationalProductId", "productDescription", "group", "description", "count", "unit", "row"],
    },
    status: {
        label: "وضعیت کالا",
        icon: "ri-checkbox-circle-line",
        columns: ["productionType", "isUsed", "isDefective"],
    },
    weight: {
        label: "اطلاعات وزن",
        icon: "ri-scales-line",
        columns: ["fullWeight", "emptyWeight", "netWeight", "originWeight", "weightDiff"],
    },
    dimensions: {
        label: "ابعاد",
        icon: "ri-ruler-line",
        columns: ["length", "width", "thickness"],
    },
    tracking: {
        label: "ردیابی و شناسایی",
        icon: "ri-barcode-line",
        columns: ["heatNumber", "bundleNo", "brand", "orderNo"],
    },
    location: {
        label: "موقعیت و توضیحات",
        icon: "ri-map-pin-line",
        columns: ["depoLocation", "descriptionNotes"],
    },
};

const ColumnManagerModal = ({
                                isOpen = false,
                                toggle = () => {},
                                columnVisibility = {},
                                columnLabels = {},
                                onToggleColumn = () => {},
                            }) => {
    const [searchTerm, setSearchTerm] = useState("");

    /* -------------------------------------------------------------
     * اطمینان از وجود مقادیر - Defensive programming
     * ------------------------------------------------------------- */
    const safeColumnVisibility = columnVisibility ?? {};
    const safeColumnLabels = columnLabels ?? {};

    /* -------------------------------------------------------------
     * فیلتر ستون‌ها بر اساس جستجو
     * ------------------------------------------------------------- */
    const filteredGroups = useMemo(() => {
        if (!searchTerm.trim()) return COLUMN_GROUPS;

        const filtered = {};
        Object.entries(COLUMN_GROUPS).forEach(([groupKey, group]) => {
            const matchingColumns = group.columns.filter((colKey) => {
                const label = safeColumnLabels[colKey];
                return label && label.toLowerCase().includes(searchTerm.toLowerCase());
            });

            if (matchingColumns.length > 0) {
                filtered[groupKey] = {
                    ...group,
                    columns: matchingColumns,
                };
            }
        });

        return filtered;
    }, [searchTerm, safeColumnLabels]);

    /* -------------------------------------------------------------
     * آمار ستون‌های فعال
     * ------------------------------------------------------------- */
    const stats = useMemo(() => {
        const labelKeys = Object.keys(safeColumnLabels);
        const total = labelKeys.length;
        const visible = labelKeys.filter((key) => Boolean(safeColumnVisibility[key])).length;
        return { total, visible };
    }, [safeColumnVisibility, safeColumnLabels]);

    /* -------------------------------------------------------------
     * انتخاب/عدم انتخاب همه
     * ------------------------------------------------------------- */
    const handleSelectAll = () => {
        Object.keys(safeColumnLabels).forEach((key) => {
            if (!safeColumnVisibility[key]) {
                onToggleColumn(key);
            }
        });
    };

    const handleDeselectAll = () => {
        Object.keys(safeColumnLabels).forEach((key) => {
            if (safeColumnVisibility[key]) {
                onToggleColumn(key);
            }
        });
    };

    /* -------------------------------------------------------------
     * انتخاب/عدم انتخاب گروه
     * ------------------------------------------------------------- */
    const handleToggleGroup = (groupColumns, shouldEnable) => {
        groupColumns.forEach((colKey) => {
            const currentState = Boolean(safeColumnVisibility[colKey]);
            if (currentState !== shouldEnable) {
                onToggleColumn(colKey);
            }
        });
    };

    const isGroupFullySelected = (columns) =>
        columns.every((col) => Boolean(safeColumnVisibility[col]));

    const isGroupPartiallySelected = (columns) =>
        columns.some((col) => Boolean(safeColumnVisibility[col])) && !isGroupFullySelected(columns);

    /* -------------------------------------------------------------
     * هندل کلیک روی آیتم
     * ------------------------------------------------------------- */
    const handleColumnToggle = (colKey) => {
        onToggleColumn(colKey);
    };

    // اگر Modal بسته است، رندر نکن
    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} toggle={toggle} size="lg" className="column-manager-modal">
            <ModalHeader toggle={toggle}>
                <i className="ri-layout-4-line me-2"></i>
                مدیریت ستون‌ها
                <Badge color="primary" className="ms-2">
                    {stats.visible} از {stats.total}
                </Badge>
            </ModalHeader>

            <ModalBody>
                {/* جستجو */}
                <div className="search-wrapper mb-4">
                    <i className="ri-search-line search-icon"></i>
                    <Input
                        placeholder="جستجوی ستون..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                    {searchTerm && (
                        <Button
                            color="link"
                            className="clear-btn"
                            onClick={() => setSearchTerm("")}
                        >
                            <i className="ri-close-line"></i>
                        </Button>
                    )}
                </div>

                {/* دکمه‌های سریع */}
                <div className="quick-actions mb-4">
                    <Button
                        color="success"
                        size="sm"
                        outline
                        onClick={handleSelectAll}
                    >
                        <i className="ri-checkbox-multiple-line me-1"></i>
                        انتخاب همه
                    </Button>
                    <Button
                        color="secondary"
                        size="sm"
                        outline
                        onClick={handleDeselectAll}
                    >
                        <i className="ri-checkbox-blank-line me-1"></i>
                        حذف همه
                    </Button>
                </div>

                {/* لیست گروه‌ها */}
                <div className="column-groups">
                    {Object.entries(filteredGroups).map(([groupKey, group]) => {
                        const isFullySelected = isGroupFullySelected(group.columns);
                        const isPartial = isGroupPartiallySelected(group.columns);
                        const selectedCount = group.columns.filter((c) => Boolean(safeColumnVisibility[c])).length;

                        return (
                            <div key={groupKey} className="column-group">
                                {/* هدر گروه */}
                                <div
                                    className="group-header"
                                    onClick={() => handleToggleGroup(group.columns, !isFullySelected)}
                                >
                                    <div className="group-info">
                                        <i className={`${group.icon} group-icon`}></i>
                                        <span className="group-label">{group.label}</span>
                                        <Badge
                                            color={isFullySelected ? "success" : isPartial ? "warning" : "secondary"}
                                            className="group-badge"
                                        >
                                            {selectedCount}/{group.columns.length}
                                        </Badge>
                                    </div>
                                    <Input
                                        type="checkbox"
                                        checked={isFullySelected}
                                        className={`group-checkbox ${isPartial ? "indeterminate" : ""}`}
                                        onChange={() => handleToggleGroup(group.columns, !isFullySelected)}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                </div>

                                {/* لیست ستون‌ها */}
                                <Row className="column-list">
                                    {group.columns.map((colKey) => {
                                        const label = safeColumnLabels[colKey];
                                        if (!label) return null;

                                        const isVisible = Boolean(safeColumnVisibility[colKey]);

                                        return (
                                            <Col xs="6" sm="4" key={colKey}>
                                                <div
                                                    className={`column-item ${isVisible ? "active" : ""}`}
                                                    onClick={() => handleColumnToggle(colKey)}
                                                >
                                                    <Input
                                                        type="checkbox"
                                                        checked={isVisible}
                                                        onChange={() => handleColumnToggle(colKey)}
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                    <span className="column-label">{label}</span>
                                                </div>
                                            </Col>
                                        );
                                    })}
                                </Row>
                            </div>
                        );
                    })}

                    {Object.keys(filteredGroups).length === 0 && (
                        <div className="no-results">
                            <i className="ri-search-line"></i>
                            <p>ستونی با این نام پیدا نشد</p>
                        </div>
                    )}
                </div>
            </ModalBody>

            <ModalFooter>
                <Button color="primary" onClick={toggle}>
                    <i className="ri-check-line me-1"></i>
                    تأیید
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default ColumnManagerModal;
