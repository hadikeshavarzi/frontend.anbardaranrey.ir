import React, { useState, useEffect } from "react";
import {
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
} from "reactstrap";
import { Link } from "react-router-dom";

import defaultAvatar from "../../../assets/images/users/avatar-1.jpg";

import { API_BASE as BASE_URL } from "../../../helpers/api_helper.jsx";
import { MEDIA_BASE } from "../../../helpers/api_helper.jsx";

const ProfileMenu = () => {
  const [menu, setMenu] = useState(false);
  const [memberInfo, setMemberInfo] = useState(null);

  useEffect(() => {
    try {
      const savedMember = localStorage.getItem("member");

      if (!savedMember) {
        setMemberInfo({
          full_name: "کاربر",
          member_image: null,
        });
        return;
      }

      const parsed = JSON.parse(savedMember);
      setMemberInfo(parsed);
    } catch (e) {
      setMemberInfo({
        full_name: "کاربر",
        member_image: null,
      });
    }
  }, []);

  // نام کاربر
  const displayName =
      memberInfo?.full_name ||
      memberInfo?.name ||
      memberInfo?.email ||
      "کاربر";

  // تعیین آواتار
  const getAvatar = () => {
    if (!memberInfo) return defaultAvatar;

    const img =
        memberInfo.member_image?.url ||
        memberInfo.avatar?.url ||
        memberInfo.image?.url ||
        null;

    if (!img) return defaultAvatar;

    // آدرس نسبی → اضافه کردن MEDIA_BASE
    if (img.startsWith("/")) {
      return MEDIA_BASE + img; // ✔ درست
    }

    return img;
  };

  const avatar = getAvatar();

  return (
      <Dropdown
          isOpen={menu}
          toggle={() => setMenu(!menu)}
          className="d-inline-block"
      >
        <DropdownToggle
            className="btn header-item"
            id="page-header-user-dropdown"
            tag="button"
        >
          <img
              className="rounded-circle header-profile-user"
              src={avatar}
              alt={displayName}
              style={{ width: 32, height: 32, objectFit: "cover" }}
              onError={(e) => (e.target.src = defaultAvatar)}
          />

          <span className="d-none d-xl-inline-block ms-2 me-1">
          {displayName}
        </span>

          <i className="mdi mdi-chevron-down d-none d-xl-inline-block" />
        </DropdownToggle>

        <DropdownMenu className="dropdown-menu-end">
          <DropdownItem tag={Link} to="/profile">
            <i className="bx bx-user font-size-16 align-middle me-1" />
            پروفایل
          </DropdownItem>

          <div className="dropdown-divider" />

          <Link to="/logout" className="dropdown-item">
            <i className="bx bx-power-off font-size-16 align-middle me-1 text-danger" />
            خروج
          </Link>
        </DropdownMenu>
      </Dropdown>
  );
};

export default ProfileMenu;
