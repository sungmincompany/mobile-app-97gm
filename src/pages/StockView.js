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
  Modal,
} from "antd";
import {
  SearchOutlined,
  AppstoreOutlined,
  ReloadOutlined,
  ProfileOutlined,
} from "@ant-design/icons";
import { DB_SCHEMA } from "../config";

const { useBreakpoint } = Grid;
const { TabPane } = Tabs;

const StockView = () => {
  // ================= 공통 상태 =================
  const screens = useBreakpoint();
  const isTablet = !!screens.md;
  const v_db = DB_SCHEMA;
  const [activeTab, setActiveTab] = useState("2"); // 2:완제품, 3:부자재

  // ================= 데이터 상태 =================
  const [stockData, setStockData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");

  // 상세 재고 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [detailList, setDetailList] = useState([]);
  const [selectedParentName, setSelectedParentName] = useState("");

  // ================= 데이터 조회 =================
  const fetchStockData = (tabKey) => {
    setLoading(true);

    // ✅ [수정] 97GM 전용 API 호출
    let url = `/api/97gm/stock/list?v_db=${v_db}`;

    // 탭 키 매핑 (2:완제품->01, 3:부자재->02)
    if (tabKey === "2") url += `&tab_gbn_cd=01`;
    else if (tabKey === "3") url += `&tab_gbn_cd=02`;
    else {
      // 전체 탭(1)인 경우 등 처리 필요 시 추가
      // 현재 백엔드는 01, 02만 처리하므로 기본적으로 빈 배열이 올 수 있음
    }

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          message.error("데이터 로드 실패");
        } else {
          setStockData(data);

          // 완제품 탭('2')일 때만 부모(pum_gbn='4') 필터링
          // 부자재('3')는 전체 다 보여줌
          if (tabKey === "2") {
            const parents = data.filter((item) => item.pum_gbn === "4");
            setFilteredData(parents);
          } else {
            setFilteredData(data);
          }
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
  const applySearch = (text) => {
    const lowerValue = text.toLowerCase();

    // 검색 대상 소스 결정
    let source = stockData;
    if (activeTab === "2") {
      source = stockData.filter((d) => d.pum_gbn === "4");
    }

    if (!text) {
      setFilteredData(source);
      return;
    }

    const filtered = source.filter(
      (item) =>
        item.jepum_cd.toLowerCase().includes(lowerValue) ||
        item.jepum_nm.toLowerCase().includes(lowerValue),
    );
    setFilteredData(filtered);
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchText(value);
    applySearch(value);
  };

  const handleRefresh = () => {
    fetchStockData(activeTab);
    message.success("새로고침 되었습니다.");
  };

  // 아이템 클릭 핸들러 (부자재는 작동 안 함)
  const handleItemClick = (item) => {
    if (item.sub_cnt && item.sub_cnt > 0) {
      // 자식 제품 찾기
      const children = stockData.filter(
        (d) => d.root_jepum_cd === item.jepum_cd,
      );
      setDetailList(children);
      setSelectedParentName(item.jepum_nm);
      setIsModalOpen(true);
    }
    // 부자재나 하위 없는 제품은 클릭해도 반응 없음 (원하면 메시지 출력 가능)
  };

  // ================= 렌더링 헬퍼 =================
  const renderPCItem = (item, color) => (
    <div
      onClick={() => handleItemClick(item)}
      style={{
        backgroundColor: "#fff",
        border: "1px solid #d9d9d9",
        borderTop: `4px solid ${color}`,
        borderRadius: "8px",
        padding: "15px",
        height: "100%",
        cursor: item.sub_cnt > 0 ? "pointer" : "default",
        position: "relative",
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
          {item.sub_cnt > 0 && (
            <Tag color="purple">
              <ProfileOutlined /> 상세
            </Tag>
          )}
        </div>
        <div
          style={{
            fontWeight: "bold",
            fontSize: "16px",
            marginBottom: "15px",
            lineHeight: "1.3",
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
        {item.sub_cnt > 0 && (
          <div style={{ fontSize: "11px", color: "#888" }}>(전체 합계)</div>
        )}
      </div>
    </div>
  );

  const renderMobileTable = () => (
    <table
      style={{
        width: "100%",
        borderCollapse: "collapse",
        backgroundColor: "#fff",
        borderRadius: "8px",
        overflow: "hidden",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      }}
    >
      <thead>
        <tr
          style={{
            backgroundColor: "#fafafa",
            borderBottom: "2px solid #e8e8e8",
            fontSize: "13px",
            color: "#666",
          }}
        >
          <th
            style={{
              padding: "12px 10px",
              textAlign: "left",
              fontWeight: "bold",
            }}
          >
            제품정보
          </th>
          <th
            style={{
              padding: "12px 10px",
              textAlign: "right",
              fontWeight: "bold",
              width: "90px",
              whiteSpace: "nowrap",
            }}
          >
            현재고
          </th>
        </tr>
      </thead>
      <tbody>
        {filteredData.map((item) => {
          const hasStock = item.stock_tot > 0;
          const color = hasStock ? "#3f8600" : "#cf1322";
          return (
            <tr
              key={item.jepum_cd}
              onClick={() => handleItemClick(item)}
              style={{
                borderBottom: "1px solid #f0f0f0",
                cursor: item.sub_cnt > 0 ? "pointer" : "default",
              }}
            >
              <td style={{ padding: "20px 10px", verticalAlign: "middle" }}>
                <div
                  style={{
                    fontWeight: "bold",
                    fontSize: "16px",
                    marginBottom: "6px",
                    color: "#333",
                    wordBreak: "keep-all",
                  }}
                >
                  {item.jepum_nm}
                </div>
                <div
                  style={{
                    fontSize: "13px",
                    color: "#999",
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                  }}
                >
                  <Tag style={{ marginRight: 0 }}>{item.jepum_cd}</Tag>
                  {item.sub_cnt > 0 && (
                    <Tag color="purple" style={{ fontSize: "10px" }}>
                      상세보기 &gt;
                    </Tag>
                  )}
                </div>
              </td>
              <td
                style={{
                  padding: "20px 10px",
                  textAlign: "right",
                  verticalAlign: "middle",
                }}
              >
                <div
                  style={{ fontSize: "18px", fontWeight: "bold", color: color }}
                >
                  {item.stock_tot.toLocaleString()}
                </div>
                <div style={{ fontSize: "12px", color: "#888" }}>EA</div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );

  return (
    <div style={{ padding: "10px", maxWidth: "1200px", margin: "0 auto" }}>
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
          <TabPane tab="완제품" key="2" />
          <TabPane tab="부자재" key="3" />
        </Tabs>

        <div style={{ marginTop: "10px" }}>
          <Input
            placeholder="검색..."
            prefix={<SearchOutlined />}
            size="large"
            value={searchText}
            onChange={handleSearch}
            style={{ marginBottom: "20px" }}
            allowClear
          />
          {loading ? (
            <div style={{ textAlign: "center", padding: "50px" }}>
              <Spin size="large" tip="로딩 중..." />
            </div>
          ) : (
            <>
              {filteredData.length === 0 ? (
                <Empty description="데이터 없음" style={{ padding: "50px" }} />
              ) : (
                <div style={{ border: "none" }}>
                  {!isTablet ? (
                    renderMobileTable()
                  ) : (
                    <List
                      grid={{
                        gutter: 16,
                        xs: 1,
                        sm: 2,
                        md: 3,
                        lg: 4,
                        xl: 4,
                        xxl: 5,
                      }}
                      dataSource={filteredData}
                      renderItem={(item) => {
                        const hasStock = item.stock_tot > 0;
                        const color = hasStock ? "#3f8600" : "#cf1322";
                        return (
                          <List.Item style={{ marginBottom: 16 }}>
                            {renderPCItem(item, color)}
                          </List.Item>
                        );
                      }}
                    />
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </Card>

      <Modal
        title={
          <span>
            <ProfileOutlined /> {selectedParentName} - 상세 재고
          </span>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        centered
        bodyStyle={{ padding: 0 }}
      >
        <div style={{ maxHeight: "60vh", overflowY: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead
              style={{ background: "#fafafa", borderBottom: "1px solid #eee" }}
            >
              <tr>
                <th style={{ padding: "12px", textAlign: "left" }}>
                  상세 품목명
                </th>
                <th style={{ padding: "12px", textAlign: "right" }}>재고</th>
              </tr>
            </thead>
            <tbody>
              {detailList.map((sub) => (
                <tr
                  key={sub.jepum_cd}
                  style={{ borderBottom: "1px solid #f0f0f0" }}
                >
                  <td style={{ padding: "12px" }}>
                    <div style={{ fontWeight: "bold" }}>{sub.jepum_nm}</div>
                    <div style={{ fontSize: "11px", color: "#999" }}>
                      {sub.jepum_cd}
                    </div>
                  </td>
                  <td
                    style={{
                      padding: "12px",
                      textAlign: "right",
                      fontWeight: "bold",
                      color: sub.stock_tot > 0 ? "#1890ff" : "#ccc",
                    }}
                  >
                    {sub.stock_tot.toLocaleString()}{" "}
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: "normal",
                        color: "#999",
                      }}
                    >
                      EA
                    </span>
                  </td>
                </tr>
              ))}
              {detailList.length === 0 && (
                <tr>
                  <td
                    colSpan="2"
                    style={{
                      padding: "20px",
                      textAlign: "center",
                      color: "#999",
                    }}
                  >
                    하위 품목 없음
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Modal>
    </div>
  );
};

export default StockView;
