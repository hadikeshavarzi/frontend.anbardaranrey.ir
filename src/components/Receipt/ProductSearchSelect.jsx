import React, { useState } from "react";
import Select from "react-select";
import axios from "axios";

const ProductSearchSelect = ({ onSelect }) => {
    const [loading, setLoading] = useState(false);

    const loadOptions = async (inputValue) => {
        if (!inputValue) return [];

        setLoading(true);

        try {
            // 1) کالاهای رسمی (از API یا وب‌سرویس)
            const officialRes = await axios.get(`/api/official-products?search=${inputValue}`);
            const official = officialRes.data.map((p) => ({
                label: `🔵 ${p.name} (شناسه: ${p.code})`,
                value: { ...p, type: "official" },
            }));

            // 2) کالاهای داخلی از Payload
            const internalRes = await axios.get(`/api/products?search=${inputValue}`);
            const internal = internalRes.data.map((p) => ({
                label: `🟢 ${p.name} (داخلی)`,
                value: { ...p, type: "internal" },
            }));

            setLoading(false);

            return [
                {
                    label: "کالاهای رسمی",
                    options: official
                },
                {
                    label: "کالاهای داخلی انبار",
                    options: internal
                }
            ];

        } catch (err) {
            console.error(err);
            setLoading(false);
            return [];
        }
    };

    return (
        <Select
            loadOptions={loadOptions}
            onChange={(opt) => onSelect(opt.value)}
            placeholder="جستجو کالا..."
            isSearchable
            isLoading={loading}
            cacheOptions
            defaultOptions={false}
            menuPortalTarget={document.body}
            menuPosition="fixed"
            styles={{
                menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                menu: (base) => ({ ...base, backgroundColor: "#fff" }),
            }}
        />
    );
};

export default ProductSearchSelect;
