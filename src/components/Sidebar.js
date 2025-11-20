// src/components/Sidebar.js
import React from "react";
import { Menu } from "antd";
import { EditOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const Sidebar = ({ toggleCollapsed }) => {
  const navigate = useNavigate();

  const handleMenuClick = (path) => {
    navigate(path);
    toggleCollapsed(); // 메뉴 클릭 시 사이드바 접기
  };

  const items = [
    {
      key: "1",
      icon: <EditOutlined />,
      label: "생산등록",
      onClick: () => handleMenuClick("/SegsanRegister"),
    },
    {
      key: "2",
      icon: <EditOutlined />,
      label: "주문등록",
      onClick: () => handleMenuClick("/SujuRegister"),
    },
    {
      key: "3",
      icon: <EditOutlined />,
      label: "재고조회",
      onClick: () => handleMenuClick("/StockView"),
    },
  ];

  return <Menu theme="light" mode="inline" items={items} />;
};

export default Sidebar;
