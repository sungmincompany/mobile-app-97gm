import React, { useState, useEffect } from 'react';
import { Tabs, Form, Input, Button, Select, DatePicker, message, Table, Modal, Descriptions, Row, Col, InputNumber } from 'antd';
import dayjs from 'dayjs';
import { DB_SCHEMA } from '../config';

const { Option } = Select;
const { TextArea } = Input;
const { confirm } = Modal;

/**
 * 주문등록 (dayjs 버전) + API로 YYYYMMDD 수신 시 변환 예시
 */
const OrderRegister = () => {
  // antd Form 훅
  const [form] = Form.useForm();

  // 상태값
  const [productList, setProductList] = useState([]);
  const [venderList, setVenderList] = useState([]);
  const [orders, setOrders] = useState([]);
  const [editingRecord, setEditingRecord] = useState(null);
  const [activeTab, setActiveTab] = useState("1");
  const [detailRecord, setDetailRecord] = useState(null);

  // 수량 증감용 상태
  const [quantity, setQuantity] = useState(1);

  // DB 스키마 예시
  const v_db = DB_SCHEMA;

  /****************************************************************
   * 1) 제품, 거래처 목록
   ****************************************************************/
  useEffect(() => {
    // 제품 목록
    fetch(`/api/select/jepum/jepum?v_db=${v_db}`)
      .then(res => res.json())
      .then(data => setProductList(data))
      .catch(err => console.error("제품 목록 에러:", err));
  }, [v_db]);

  useEffect(() => {
    // 거래처 목록
    fetch(`/api/select/vender/out?v_db=${v_db}`)
      .then(res => res.json())
      .then(data => setVenderList(data))
      .catch(err => console.error("거래처 목록 에러:", err));
  }, [v_db]);

  /****************************************************************
   * 2) 당일 주문 조회 (YYYYMMDD 기준)
   ****************************************************************/
  const fetchOrders = async () => {
    const today = dayjs().format("YYYYMMDD");
    try {
      const res = await fetch(
        `/api/select/suju/all?v_db=${v_db}&from_dt=${today}&to_dt=${today}`
      );
      if (!res.ok) throw new Error("API response not OK");
      const data = await res.json();

      // [중요] 주문일자(suju_dt), 납기일(out_dt_to)를 서버가 YYYYMMDD로 보낸다고 가정
      // 여기서 "YYYYMMDD" -> "YYYY-MM-DD" 로 미리 변환
      data.forEach(item => {
        if (item.suju_dt && item.suju_dt.length === 8) {
          // 예: "20250314" -> "2025-03-14"
          item.suju_dt = item.suju_dt.replace(
            /(\d{4})(\d{2})(\d{2})/,
            (_, y, m, d) => `${y}-${m}-${d}`
          );
        }
        if (item.out_dt_to && item.out_dt_to.length === 8) {
          item.out_dt_to = item.out_dt_to.replace(
            /(\d{4})(\d{2})(\d{2})/,
            (_, y, m, d) => `${y}-${m}-${d}`
          );
        }
      });

      setOrders(data);
    } catch (error) {
      console.error("주문 조회 에러:", error);
      message.error("주문 조회 중 오류가 발생했습니다.");
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [v_db]);

  /****************************************************************
   * 3) 폼 제출 (등록/수정)
   ****************************************************************/
  const onFinish = (values) => {
    // DatePicker -> dayjs 객체 -> "YYYY-MM-DD" 문자열
    const suju_dt = values.suju_dt ? values.suju_dt.format("YYYY-MM-DD") : null;
    const out_dt_to = values.out_dt_to ? values.out_dt_to.format("YYYY-MM-DD") : null;

    // 서버 전송 payload
    const payload = {
      suju_dt,
      out_dt_to,
      jepum_cd: values.jepum_cd,
      vender_cd: values.vender_cd,
      amt: values.amt,
      bigo: values.bigo || "",
      suju_seq: values.suju_seq,
      suju_gbn: values.suju_gbn,
    };

    if (!editingRecord) {
      // 신규 등록
      fetch(`/api/insert/suju/register?v_db=${v_db}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then(res => res.json())
        .then(resData => {
          if (resData.error) {
            message.error("주문 등록 실패: " + resData.error);
          } else {
            message.success("주문 등록 성공!");
            const newOrder = {
              suju_cd: resData.suju_cd || String(Date.now()),
              suju_dt,    // 이미 "YYYY-MM-DD"
              out_dt_to,
              jepum_cd: payload.jepum_cd,
              jepum_nm: productList.find(p => p.jepum_cd === payload.jepum_cd)?.jepum_nm || "",
              vender_cd: payload.vender_cd,
              vender_nm: venderList.find(v => v.vender_cd === payload.vender_cd)?.vender_nm || "",
              amt: payload.amt,
              bigo: payload.bigo,
            };
            setOrders(prev => [...prev, newOrder]);
            form.resetFields();
            setQuantity(1);
            setActiveTab("2");
          }
        })
        .catch(err => {
          console.error("주문 등록 에러:", err);
          message.error("주문 등록 중 오류가 발생했습니다.");
        });
    } else {
      // 수정 모드
      const updatePayload = { ...payload, suju_cd: editingRecord.suju_cd };
      fetch(`/api/update/suju/update?v_db=${v_db}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatePayload),
      })
        .then(res => res.json())
        .then(resData => {
          if (resData.error) {
            message.error("주문 수정 실패: " + resData.error);
          } else {
            message.success("주문 수정 성공!");
            setOrders(prev =>
              prev.map(order =>
                order.suju_cd === editingRecord.suju_cd
                  ? {
                      ...order,
                      suju_dt,
                      out_dt_to,
                      jepum_cd: payload.jepum_cd,
                      jepum_nm: productList.find(p => p.jepum_cd === payload.jepum_cd)?.jepum_nm || order.jepum_nm,
                      vender_cd: payload.vender_cd,
                      vender_nm: venderList.find(v => v.vender_cd === payload.vender_cd)?.vender_nm || order.vender_nm,
                      amt: payload.amt,
                      bigo: payload.bigo,
                    }
                  : order
              )
            );
            form.resetFields();
            setEditingRecord(null);
            setQuantity(1);
            setActiveTab("2");
          }
        })
        .catch(err => {
          console.error("주문 수정 에러:", err);
          message.error("주문 수정 중 오류가 발생했습니다.");
        });
    }
  };

  const onFinishFailed = (errorInfo) => {
    console.error("폼 검사 실패:", errorInfo);
    message.error("모든 필수 항목을 입력해주세요.");
  };

  /****************************************************************
   * 4) 수정/삭제
   ****************************************************************/
  const handleEdit = (record) => {
    setEditingRecord(record);

    // record.suju_dt는 현재 "YYYY-MM-DD" 형태라고 가정
    // dayjs("2025-03-14", "YYYY-MM-DD") -> valid
    const sujuDtDayjs = record.suju_dt ? dayjs(record.suju_dt, "YYYY-MM-DD") : null;
    const outDtDayjs  = record.out_dt_to ? dayjs(record.out_dt_to, "YYYY-MM-DD") : null;

    form.setFieldsValue({
      suju_dt: sujuDtDayjs,
      out_dt_to: outDtDayjs,
      jepum_cd: record.jepum_cd,
      vender_cd: record.vender_cd,
      amt: record.amt,
      bigo: record.bigo,
      suju_seq: "01",
      suju_gbn: "02",
    });
    setQuantity(record.amt);
    setActiveTab("1");
  };

  const handleDelete = (record) => {
    confirm({
      title: "해당 주문을 삭제하시겠습니까?",
      icon: null,
      okText: "예",
      cancelText: "아니오",
      onOk: async () => {
        try {
          const url = `/api/delete/suju/delete?suju_cd=${record.suju_cd}&v_db=${v_db}`;
          const res = await fetch(url, { method: 'DELETE' });
          const resData = await res.json();
          if (resData.error) {
            message.error(`주문 삭제 실패: ${resData.error}`);
          } else {
            message.success('주문 삭제 성공!');
            fetchOrders();
          }
        } catch (err) {
          console.error('주문 삭제 에러:', err);
          message.error('주문 삭제 중 오류가 발생했습니다.');
        }
      },
    });
  };
  
  /****************************************************************
   * 5) 수량 +/-
   ****************************************************************/
  const handleIncrease = () => {
    setQuantity(prev => prev + 1);
    form.setFieldsValue({ amt: quantity + 1 });
  };

  const handleDecrease = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
      form.setFieldsValue({ amt: quantity - 1 });
    }
  };

  /****************************************************************
   * 6) 테이블 컬럼
   ****************************************************************/
  const columns = [
    {
      title: "거래처",
      dataIndex: "vender_nm",
      key: "vender_nm",
      align: "center",
      width: 80,
    },
    {
      title: "제품",
      dataIndex: "jepum_nm",
      key: "jepum_nm",
      align: "center",
      width: 110,
    },
    {
      title: "수량",
      dataIndex: "amt",
      key: "amt",
      align: "center",
      width: 60,
    },
    {
      title: "상세보기",
      key: "detail",
      align: "center",
      width: 60,
      render: (_, record) => (
        <Button type="link" onClick={() => setDetailRecord(record)}>
          <span style={{ fontSize: '10px', textAlign: 'center' }}>상세보기</span>
        </Button>
      ),
    },
  ];

  // Form.Item 공통 스타일
  const formItemStyle = { marginBottom: 8 };

  /****************************************************************
   * 7) 탭 설정
   ****************************************************************/
  const tabItems = [
    {
      key: "1",
      label: "등록",
      children: (
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          onFinishFailed={onFinishFailed}
          initialValues={{ amt: 1, suju_seq: "01", suju_gbn: "02" }}
        >
          {/* 주문일자 */}
          <Form.Item label="주문일자" name="suju_dt" style={formItemStyle}>
            <DatePicker placeholder="날짜 선택" style={{ width: "100%" }} />
          </Form.Item>

          {/* 납기일 */}
          <Form.Item label="납기일" name="out_dt_to" style={formItemStyle}>
            <DatePicker placeholder="납기일 선택" style={{ width: "100%" }} />
          </Form.Item>

          {/* 제품 */}
          <Form.Item
            label="제품"
            name="jepum_cd"
            rules={[{ required: true, message: "제품을 선택하세요" }]}
            style={formItemStyle}
          >
            <Select
              showSearch
              placeholder="제품 검색"
              optionFilterProp="children"
              filterOption={(input, option) => {
                const childrenArray = React.Children.toArray(option.children);
                const label = childrenArray.join("");
                return label.toLowerCase().includes(input.toLowerCase());
              }}
            >
              {productList.map(p => (
                <Option key={p.jepum_cd} value={p.jepum_cd}>
                  {p.jepum_nm} ({p.jepum_cd})
                </Option>
              ))}
            </Select>
          </Form.Item>

          {/* 거래처 */}
          <Form.Item
            label="거래처"
            name="vender_cd"
            rules={[{ required: true, message: "거래처를 선택하세요" }]}
            style={formItemStyle}
          >
            <Select
              showSearch
              placeholder="거래처 검색"
              optionFilterProp="children"
              filterOption={(input, option) => {
                const childrenArray = React.Children.toArray(option.children);
                const label = childrenArray.join("");
                return label.toLowerCase().includes(input.toLowerCase());
              }}
            >
              {venderList.map(v => (
                <Option key={v.vender_cd} value={v.vender_cd}>
                  {v.vender_nm} ({v.vender_cd})
                </Option>
              ))}
            </Select>
          </Form.Item>

          {/* 수량 (+/-) */}
          <Form.Item label="수량" name="amt" style={formItemStyle}>
            <Row gutter={8}>
              <Col flex="auto">
                <InputNumber
                  min={1}
                  value={quantity}
                  onChange={(val) => {
                    setQuantity(val);
                    form.setFieldsValue({ amt: val });
                  }}
                  style={{ width: '100%' }}
                />
              </Col>
              <Col>
                <Button onClick={handleIncrease}>+</Button>
                <Button onClick={handleDecrease} style={{ marginLeft: 4 }}>
                  -
                </Button>
              </Col>
            </Row>
          </Form.Item>

          {/* 비고 */}
          <Form.Item label="비고" name="bigo" style={formItemStyle}>
            <TextArea placeholder="비고 입력" rows={3} />
          </Form.Item>

          {/* 숨김 필드 (suju_seq, suju_gbn) */}
          <Form.Item name="suju_seq" style={{ display: "none" }}>
            <Input type="hidden" />
          </Form.Item>
          <Form.Item name="suju_gbn" style={{ display: "none" }}>
            <Input type="hidden" />
          </Form.Item>

          {/* 등록/수정 버튼 */}
          <Form.Item style={formItemStyle}>
            <Button type="primary" htmlType="submit" style={{ width: "100%" }}>
              {editingRecord ? "수정하기" : "등록"}
            </Button>
          </Form.Item>
        </Form>
      ),
    },
    {
      key: "2",
      label: "조회",
      children: (
        <>
          <h3>주문목록 (당일 주문만 조회)</h3>
          <Table
            dataSource={orders.map(o => ({ ...o, key: o.suju_cd }))}
            columns={columns}
            pagination={{ pageSize: 5 }}
            tableLayout="fixed"
          />
        </>
      ),
    },
  ];

  /****************************************************************
   * 8) 화면 렌더링
   ****************************************************************/
  return (
    <div style={{ padding: 16, width: "100%", boxSizing: "border-box" }}>
      <h2 style={{ textAlign: "center" }}>주문등록</h2>
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />

      {/* 상세보기 Modal */}
      <Modal
        open={!!detailRecord}
        title="주문 상세정보"
        onCancel={() => setDetailRecord(null)}
        footer={[
          <Button
            key="edit"
            onClick={() => {
              handleEdit(detailRecord);
              setDetailRecord(null);
            }}
            style={{ backgroundColor: '#1e90ff', color: 'white' }}
          >
            수정
          </Button>,
          <Button
            key="delete"
            type="danger"
            onClick={() => {
              handleDelete(detailRecord);
              setDetailRecord(null);
            }}
            style={{ backgroundColor: '#ff4500', color: 'white' }}
          >
            삭제
          </Button>,
          <Button
            key="close"
            onClick={() => setDetailRecord(null)}
            style={{ backgroundColor: 'white', color: 'black' }}
          >
            닫기
          </Button>,
        ]}
      >
        <Descriptions column={1}>
          <Descriptions.Item label="주문번호">{detailRecord?.suju_cd}</Descriptions.Item>
          <Descriptions.Item label="주문일자">{detailRecord?.suju_dt}</Descriptions.Item>
          <Descriptions.Item label="납기일">{detailRecord?.out_dt_to}</Descriptions.Item>
          <Descriptions.Item label="제품">{detailRecord?.jepum_nm}</Descriptions.Item>
          <Descriptions.Item label="거래처">{detailRecord?.vender_nm}</Descriptions.Item>
          <Descriptions.Item label="수량">{detailRecord?.amt}</Descriptions.Item>
          <Descriptions.Item label="비고">{detailRecord?.bigo}</Descriptions.Item>
        </Descriptions>
      </Modal>
    </div>
  );
};

export default OrderRegister;
