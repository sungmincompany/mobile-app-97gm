import React, { useState, useEffect } from "react";
import {
  Card,
  Input,
  Tabs,
  List,
  Statistic,
  Tag,
  Spin,
  message,
  Grid,
  Empty,
} from "antd";
import {
  SearchOutlined,
  AppstoreOutlined,
  CheckCircleFilled,
  ReloadOutlined,
} from "@ant-design/icons";
import "./Home.css";
import { DB_SCHEMA } from "../config";

const { useBreakpoint } = Grid;
const { TabPane } = Tabs;

const StockView = () => {
  // ================= 공통 상태 =================
  const screens = useBreakpoint();
  // md(768px) 이상이면 태블릿/PC로 간주
  const isTablet = !!screens.md;
  const v_db = DB_SCHEMA;
  const [activeTab, setActiveTab] = useState("2"); // 초기 탭을 '완제품'으로 설정

  // ================= 데이터 상태 =================
  const [stockData, setStockData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");

  // ================= 데이터 조회 =================
  const fetchStockData = (tabKey) => {
    setLoading(true);

    let url = `/api/stock/list?v_db=${v_db}`;
    if (tabKey === "2") url += `&tab_gbn_cd=01`;
    if (tabKey === "3") url += `&tab_gbn_cd=02`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          message.error("데이터 로드 실패");
        } else {
          setStockData(data);
          setFilteredData(data);
          if (searchText) applySearch(searchText, data);
        }
      })
      .catch(() => message.error("서버 통신 오류"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setSearchText("");
    fetchStockData(activeTab);
  }, [v_db, activeTab]);

  // ================= 검색 및 핸들러 =================
  const applySearch = (text, sourceData) => {
    const lowerValue = text.toLowerCase();
    const filtered = sourceData.filter(
      (item) =>
        item.jepum_cd.toLowerCase().includes(lowerValue) ||
        item.jepum_nm.toLowerCase().includes(lowerValue)
    );
    setFilteredData(filtered);
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchText(value);
    applySearch(value, stockData);
  };

  const handleRefresh = () => {
    fetchStockData(activeTab);
    message.success("새로고침 되었습니다.");
  };

  // ================= 렌더링 헬퍼 =================

  // 📱 모바일 아이템 (수정됨: 테이블 리스트 형태 + 넓은 간격)
  const renderMobileItem = (item, color) => (
    <div
      style={{
        backgroundColor: "#fff",
        borderBottom: "1px solid #f0f0f0", // 카드 테두리 대신 하단 구분선 사용
        padding: "20px 10px", // ✅ 요청사항: 줄 간격을 넓게 (위아래 20px)
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      {/* 좌측: 제품 정보 */}
      <div style={{ flex: 1, paddingRight: "10px" }}>
        <div
          style={{
            fontWeight: "bold",
            fontSize: "16px", // 폰트 크기 약간 키움
            marginBottom: "6px",
            wordBreak: "keep-all",
            color: "#333",
          }}
        >
          {item.jepum_nm}
        </div>
        <div style={{ fontSize: "13px", color: "#999" }}>
          <Tag style={{ marginRight: 0 }}>{item.jepum_cd}</Tag>
        </div>
      </div>

      {/* 우측: 재고 수량 */}
      <div style={{ textAlign: "right", minWidth: "80px" }}>
        <div style={{ fontSize: "18px", fontWeight: "bold", color: color }}>
          {item.stock_tot.toLocaleString()}
        </div>
        <div style={{ fontSize: "12px", color: "#888" }}>EA</div>
      </div>
    </div>
  );

  // 🖥️ PC 아이템 (기존 유지: 카드 형태)
  const renderPCItem = (item, color) => (
    <div
      style={{
        backgroundColor: "#fff",
        border: "1px solid #d9d9d9",
        borderTop: `4px solid ${color}`,
        borderRadius: "8px",
        padding: "15px",
        height: "100%",
        position: "relative",
        transition: "all 0.2s",
        boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "start",
            marginBottom: "10px",
          }}
        >
          <Tag color="blue" style={{ margin: 0 }}>
            {item.jepum_cd}
          </Tag>
          {item.stock_tot > 0 && (
            <CheckCircleFilled style={{ color: "#52c41a" }} />
          )}
        </div>
        <div
          style={{
            fontWeight: "bold",
            fontSize: "16px",
            marginBottom: "15px",
            lineHeight: "1.3",
            wordBreak: "keep-all",
            height: "42px",
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            color: "#333",
          }}
        >
          {item.jepum_nm}
        </div>
      </div>

      <div
        style={{
          textAlign: "right",
          borderTop: "1px dashed #f0f0f0",
          paddingTop: "10px",
        }}
      >
        <Statistic
          value={item.stock_tot}
          precision={0}
          valueStyle={{ color: color, fontWeight: "bold", fontSize: "22px" }}
          suffix={<span style={{ fontSize: "14px", color: "#888" }}>EA</span>}
        />
      </div>
    </div>
  );

  // 모바일용 리스트 헤더
  const renderMobileHeader = () => (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "10px 10px",
        backgroundColor: "#fafafa",
        borderBottom: "2px solid #e8e8e8",
        fontWeight: "bold",
        color: "#666",
        fontSize: "13px",
      }}
    >
      <div>제품정보</div>
      <div>현재고</div>
    </div>
  );

  // ================= 메인 렌더링 =================
  return (
    <div
      className="home-container"
      style={{ padding: "10px", maxWidth: "1200px", margin: "0 auto" }}
    >
      <Card
        title={
          <span style={{ fontWeight: "bold" }}>
            <AppstoreOutlined /> 재고 조회
          </span>
        }
        bordered={true}
        style={{ borderRadius: "10px" }}
        extra={
          <ReloadOutlined
            onClick={handleRefresh}
            style={{ fontSize: "18px", cursor: "pointer" }}
          />
        }
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab} type="card">
          <TabPane tab="전체" key="1" />
          <TabPane tab="완제품" key="2" />
          <TabPane tab="부자재" key="3" />
        </Tabs>

        <div style={{ marginTop: "10px" }}>
          <Input
            placeholder="제품코드 또는 제품명 검색..."
            prefix={<SearchOutlined />}
            size="large"
            value={searchText}
            onChange={handleSearch}
            style={{ marginBottom: "20px" }}
            allowClear
          />

          {loading ? (
            <div style={{ textAlign: "center", padding: "50px" }}>
              <Spin size="large" tip="데이터 불러오는 중..." />
            </div>
          ) : (
            <>
              {filteredData.length === 0 ? (
                <Empty
                  description="데이터가 없습니다."
                  style={{ padding: "50px" }}
                />
              ) : (
                <div
                  style={{
                    border: !isTablet ? "1px solid #f0f0f0" : "none",
                    borderRadius: !isTablet ? "8px" : "0",
                  }}
                >
                  {/* 모바일일 때만 테이블 헤더 표시 */}
                  {!isTablet && renderMobileHeader()}

                  <List
                    grid={
                      isTablet
                        ? {
                            gutter: 16,
                            xs: 1, // 이 설정은 무시되고 아래 renderItem 로직을 따름
                            sm: 2,
                            md: 3,
                            lg: 4,
                            xl: 4,
                            xxl: 5,
                          }
                        : undefined // 모바일에서는 그리드 해제 (리스트형)
                    }
                    dataSource={filteredData}
                    renderItem={(item) => {
                      const hasStock = item.stock_tot > 0;
                      // 재고 유무에 따른 색상 (PC/모바일 공통 로직)
                      const color = hasStock ? "#3f8600" : "#cf1322";

                      return (
                        <List.Item
                          style={{
                            padding: 0,
                            marginBottom: isTablet ? 16 : 0,
                          }}
                        >
                          {isTablet
                            ? renderPCItem(item, color)
                            : renderMobileItem(item, color)}
                        </List.Item>
                      );
                    }}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </Card>
    </div>
  );
};

export default StockView;
