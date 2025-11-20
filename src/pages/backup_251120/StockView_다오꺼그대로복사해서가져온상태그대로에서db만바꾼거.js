import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Row, Col } from 'antd';
import './Home.css';
import { DB_SCHEMA } from '../config';

const StockInquiry = () => {
  // 백엔드에서 받아온 재고 데이터를 저장할 상태
  const [stockData, setStockData] = useState([]);
  // 검색어를 적용한 뒤 화면에 표시할 데이터를 저장할 상태
  const [filteredData, setFilteredData] = useState([]);
  // 검색어 상태
  const [searchText, setSearchText] = useState('');

  // 백엔드 API에서 사용할 vendor 파라미터 (예: "25_DO")
  const v_db = DB_SCHEMA;

  // 컴포넌트 마운트 시 API 호출
  useEffect(() => {
    fetch(`/api/select/stock/jepum?v_db=${v_db}`)
      .then((res) => res.json())
      .then((data) => {
        setStockData(data);
        setFilteredData(data);
      })
      .catch((err) => console.error("API fetch error:", err));
  }, [v_db]);

  // 검색 함수
  const handleSearch = (value) => {
    const lowerValue = value.toLowerCase();
    const filtered = stockData.filter(
      (item) =>
        item.jepum_cd.toLowerCase().includes(lowerValue) ||
        item.jepum_nm.toLowerCase().includes(lowerValue) ||
        (item.spec && item.spec.toLowerCase().includes(lowerValue))
    );
    setFilteredData(filtered);
  };

  // 검색어 입력 시
  const handleInputChange = (e) => {
    setSearchText(e.target.value);
    handleSearch(e.target.value);
  };

  // 테이블 컬럼 정의
  const columns = [
    {
      title: '코드',
      dataIndex: 'jepum_cd', // API에서 받은 필드명
      key: 'jepum_cd',
      align: 'center',
    },
    {
      title: '제품명',
      dataIndex: 'jepum_nm',
      key: 'jepum_nm',
      align: 'center',
    },
    {
      title: '규격',
      dataIndex: 'spec',
      key: 'spec',
      align: 'center',
    },
    {
      title: '수량',
      dataIndex: 'amt',
      key: 'amt',
      align: 'center',
    },
  ];

  return (
    <div className="home-container">
      <div className="status-section">
        <h2>재고조회</h2>

        {/* 검색 입력 필드 */}
        <Row gutter={10} style={{ marginBottom: 16 }}>
          <Col span={24}>
            <Input
              placeholder="코드, 품명, 규격 검색"
              value={searchText}
              onChange={handleInputChange}
            />
          </Col>
        </Row>

        {/* 테이블 */}
        <Table
          dataSource={filteredData}
          columns={columns}
          pagination={false}
          size="small"
          bordered={false}
          scroll={{ y: '60vh' }}
          style={{ boxShadow: 'rgba(0, 0, 0, 0.24) 0px 3px 8px', borderRadius: '10px' }}
        />
      </div>
    </div>
  );
};

export default StockInquiry;
