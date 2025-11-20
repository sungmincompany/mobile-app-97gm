// src/components/Header.js
import React, { useEffect, useState } from 'react';
import { Button } from 'antd';
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';

const Header = ({ collapsed, toggleCollapsed }) => {
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    // 시간을 갱신하는 함수
    const updateTime = () => {
      const now = new Date();
      const formattedTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
      setCurrentTime(formattedTime);
      requestAnimationFrame(updateTime);
    };

    // 최초 호출
    updateTime();

    // 컴포넌트가 언마운트될 때 애니메이션 프레임을 취소
    return () => cancelAnimationFrame(updateTime);
  }, []);

  return (
    <header style={{
      backgroundColor: '#fff', 
      height: '48px', 
      display: 'flex', 
      alignItems: 'right', 
      justifyContent: 'space-between', 
      padding: '10px 35px 0 15px', 
      boxShadow: 'none', 
      borderBottom: 'none', 
    }}>
      <Button 
        type="primary" 
        onClick={toggleCollapsed}
        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        style={{ margin: '0' }} 
      />
      <span className='Header_currentTime' style={{ textAlign: 'right', flex: 1  }}>{currentTime}</span>
    </header>
  );
};

export default Header;
