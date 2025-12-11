// src/App.js
import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import SegsanRegister from "./pages/SegsanRegister";
import ChulhaRegister from "./pages/ChulhaRegister";
import StockView from "./pages/StockView";
import { Layout } from "antd";
import "antd/dist/reset.css";
import "./App.css";

const { Header: AntHeader, Sider, Content } = Layout; // Layout 컴포넌트에서 Header, Sider, Content 컴포넌트를 사용

const App = () => {
  // 초기화면 로드 시 메뉴가 바로 열리는 상태가 false임
  const [collapsed, setCollapsed] = useState(true); // 사이드바 접힘 여부

  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };

  return (
    <Router>
      <Layout style={{ minHeight: "100vh" }}>
        {" "}
        {/* 여백 제거 */}
        <AntHeader style={{ padding: 0, border: "none", height: "48px" }}>
          <Header collapsed={collapsed} toggleCollapsed={toggleCollapsed} s />
        </AntHeader>
        <Layout>
          <Sider
            collapsed={collapsed}
            width="100vw" // 전체 너비로 설정
            collapsedWidth="100vw" // 전체 너비로 설정
            style={{
              // 사이드바 스타일
              backgroundColor: "#fff",
              position: "fixed",
              left: 0,
              top: "48px",
              height: "100%",
              zIndex: 10,
              transition: "transform 0.25s ease", // Smooth slide-in/out
              transform: collapsed ? "translateX(-100%)" : "translateX(0)", // 접힐 때 왼쪽으로 이동
            }}
          >
            <Sidebar collapsed={collapsed} toggleCollapsed={toggleCollapsed} />{" "}
            {/* 사이드바 컴포넌트 */}
          </Sider>

          <Content style={{ backgroundColor: "white" }}>
            <Routes>
              <Route
                path="/"
                element={<Navigate to="/SegsanRegister" replace />}
              />{" "}
              {/* 기본 경로 설정 */}
              <Route path="/SegsanRegister" element={<SegsanRegister />} />
              <Route path="/ChulhaRegister" element={<ChulhaRegister />} />
              <Route path="/StockView" element={<StockView />} />
            </Routes>
          </Content>
        </Layout>
      </Layout>
    </Router>
  );
};

export default App;
